import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  runTransaction,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  deleteDoc,
  deleteField,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";
import { getBlockedRule, BlockedSlot, getCustomDayIndex, getDayTimestamp } from "@/services/blocks";
import { isDateClosed } from "@/services/closures";

export interface Appointment {
  id?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  timestamp: Timestamp;
  clientEmail: string;
  clientName: string;
  status: "confirmed" | "cancelled" | "completed" | "blocked";
  createdAt: Timestamp;
  // Confirmación de asistencia del cliente (desde el push de recordatorio). La escribe la
  // Netlify function `confirm-appointment` vía Admin SDK; el cliente no la toca directo.
  clientConfirmed?: boolean;
  confirmedAt?: Timestamp;
}

// Fetch appointments for a specific date range (or single date)
export const getAppointmentsByDate = async (dateStr: string) => {
  try {
    // dateStr format: YYYY-MM-DD
    // Usamos `in` en vez de `!= "cancelled"`: es más barato, no excluye docs sin el campo
    // status, y los estados válidos son finitos y conocidos.
    const q = query(
      collection(db, "appointments"),
      where("date", "==", dateStr),
      where("status", "in", ["confirmed", "blocked", "completed"])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

// Check if a specific slot is available
export const isSlotAvailable = async (dateStr: string, timeStr: string) => {
  // 1. Check existing appointments (DB)
  const qApp = query(
    collection(db, "appointments"),
    where("date", "==", dateStr),
    where("time", "==", timeStr),
    where("status", "in", ["confirmed", "blocked"])
  );
  const appSnapshotPromise = getDocs(qApp);

  // 2. Check Blocks (DB) - Optimized Queries
  const targetTimestamp = getDayTimestamp(dateStr);
  const targetDayIndex = getCustomDayIndex(moment(dateStr, "YYYY-MM-DD").toDate());

  // Query A: Single Blocks for this specific date and time
  const qSingle = query(
    collection(db, "blocked_slots"),
    where("type", "==", "single"),
    where("date", "==", targetTimestamp),
    where("startTime", "==", timeStr)
  );

  // Query B: Recurring Blocks for this day of week and time
  const qRecurring = query(
    collection(db, "blocked_slots"),
    where("type", "==", "recurring"),
    where("dayOfWeek", "==", targetDayIndex),
    where("startTime", "==", timeStr)
  );

  // 3. Check Exceptions (DB) - Optimized
  const qExceptions = query(
    collection(db, "slot_exceptions"), 
    where("date", "==", dateStr), 
    where("time", "==", timeStr)
  );

  // Execute in parallel
  const [appSnap, singleSnap, recurringSnap, exceptionSnap, closed] = await Promise.all([
    appSnapshotPromise,
    getDocs(qSingle),
    getDocs(qRecurring),
    getDocs(qExceptions),
    isDateClosed(dateStr)
  ]);

  // A. If real appointment exists -> NOT Available
  if (!appSnap.empty) return false;

  // A2. If the whole day is inside a closure (vacaciones) -> NOT Available.
  // Un cierre pisa todo, incluso sobreturnos/excepciones.
  if (closed) return false;

  // B. If Exception exists -> Available (overrides blocks)
  if (!exceptionSnap.empty) return true;

  // C. Check Single Blocks
  if (!singleSnap.empty) return false; // Found a specific block for this slot

  // D. Check Recurring Blocks (validate start/end dates)
  const recurringRules = recurringSnap.docs.map(d => ({id: d.id, ...d.data()})) as BlockedSlot[];
  const activeRecurring = recurringRules.find(rule => {
      // We already matched dayOfWeek and startTime in the query
      // Just check date ranges
      if (rule.startDate && targetTimestamp < rule.startDate) return false;
      if (rule.endDate && targetTimestamp > rule.endDate) return false;
      return true;
  });

  if (activeRecurring) return false;

  return true;
};

// Cotas del intervalo medio entre visitas. El promedio crudo no sirve solo: con reservas
// juntas (reservó, canceló y volvió a reservar el mismo día) da horas, y el cliente queda
// vencido para siempre — pasó de verdad, ver el backfill del 2026-07-16. Del otro lado, un
// cliente que volvió después de años daría meses y no lo empujaríamos nunca.
const MIN_NUDGE_INTERVAL_DAYS = 14;
const MAX_NUDGE_INTERVAL_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

// `nextNudgeAt = última visita + intervalo medio acotado` es lo que consulta el cron de
// re-reserva (ver netlify/functions/nudge-reengagement y docs/adr/0003). El intervalo medio
// necesita al menos 2 visitas; con menos no se agenda nada. La fórmula vive en un solo lado a
// propósito: la usan tanto la reserva (incremental) como el recálculo al cancelar, y si se
// duplicara los dos caminos derivarían en silencio.
const nextNudgeFrom = (
  firstVisit: Timestamp,
  lastVisit: Timestamp,
  visitCount: number
): Timestamp | null => {
  if (visitCount < 2 || lastVisit.toMillis() <= firstVisit.toMillis()) return null;
  const avgMs = (lastVisit.toMillis() - firstVisit.toMillis()) / (visitCount - 1);
  const intervalMs = Math.min(
    Math.max(avgMs, MIN_NUDGE_INTERVAL_DAYS * DAY_MS),
    MAX_NUDGE_INTERVAL_DAYS * DAY_MS
  );
  return Timestamp.fromMillis(lastVisit.toMillis() + intervalMs);
};

// Recalcula los agregados de re-reserva desde `history`, que es la fuente de verdad (suma una
// entrada al reservar, resta al cancelar). Hace falta recalcular en vez de restar: los
// agregados son incrementales y una cancelación no se puede invertir sin saber cuál pasa a
// ser la última visita — eso solo lo dice el historial. Es O(N) sobre el historial de UN
// cliente y solo al cancelar: el cron sigue sin leer historiales, que era el punto del diseño.
const recalcNudgeAggregates = async (clientEmail: string) => {
  const histSnap = await getDocs(collection(db, "clientes", clientEmail, "history"));
  const times = histSnap.docs
    .map((d) => d.data().time as Timestamp | undefined)
    .filter((t): t is Timestamp => typeof t?.toMillis === "function")
    .sort((a, b) => a.toMillis() - b.toMillis());

  const clientRef = doc(db, "clientes", clientEmail);

  if (!times.length) {
    await setDoc(
      clientRef,
      {
        visitCount: 0,
        firstVisit: deleteField(),
        lastVisit: deleteField(),
        nextNudgeAt: deleteField(),
      },
      { merge: true }
    );
    return;
  }

  const firstVisit = times[0];
  const lastVisit = times[times.length - 1];
  const visitCount = times.length;

  await setDoc(
    clientRef,
    {
      firstVisit,
      lastVisit,
      visitCount,
      // Si quedó con una sola visita no hay intervalo que estimar: borramos el nextNudgeAt
      // viejo en vez de dejarlo apuntando a un turno que ya no existe.
      nextNudgeAt: nextNudgeFrom(firstVisit, lastVisit, visitCount) ?? deleteField(),
    },
    { merge: true }
  );
};

// Create a new appointment
export const createAppointment = async (
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:mm
  clientEmail: string,
  clientName: string,
  force: boolean = false
) => {
  // 1. Check logical availability (Blocks, Exceptions, etc.)
  // We still do this to provide specific error messages ("Blocked by admin" vs "Taken")
  if (!force) {
    const isAvailable = await isSlotAvailable(dateStr, timeStr);
    if (!isAvailable) {
      throw new Error("El turno ya no está disponible.");
    }

    // Un cliente no puede tener más de un turno activo a la vez. Defensa en profundidad:
    // el guard de /turnos ya bloquea el acceso, pero esto cubre pestañas viejas o reservas
    // creadas en otra sesión. Los admins (force=true) quedan exentos.
    // LIMITACIÓN CONOCIDA: este chequeo NO es atómico con la creación y firestore.rules
    // tampoco lo impone (solo valida clientEmail == token.email). Dos reservas simultáneas
    // de slots distintos podrían colarse. Cerrarlo del todo requeriría una Cloud Function;
    // se acepta como caso borde de baja frecuencia.
    const existing = await getUserActiveAppointment(clientEmail);
    if (existing) {
      throw new Error("Ya tenés un turno reservado. Cancelalo para reservar otro.");
    }
  }

  // Argentina es UTC-03:00 todo el año (sin DST). Anclamos el offset para que el instante
  // guardado represente la hora-pared elegida sin importar la zona del dispositivo, y así
  // coincida con cómo el cron formatea/notifica (America/Argentina/Buenos_Aires).
  const timestamp = Timestamp.fromDate(new Date(`${dateStr}T${timeStr}:00-03:00`));

  // 2. Deterministic ID to prevent Race Conditions (Double Booking)
  // ID format: "2026-01-16_10-00"
  const docId = `${dateStr}_${timeStr.replace(':', '-')}`;
  const appointmentRef = doc(db, "appointments", docId);

  const newAppointment: Appointment = {
    // id is implicit in document key but good to store
    date: dateStr,
    time: timeStr,
    timestamp,
    clientEmail,
    clientName,
    status: "confirmed",
    createdAt: Timestamp.now()
  };

  try {
    // 3. Atomic Write
    // check if exists first to be safe, or use a transaction if we needed strict read-before-write logic
    // But setDoc will overwrite if we don't check. 
    // Actually, to prevent overwrite of an existing confirmed appointment, we should check existence.
    // The most robust way for "Insert if not exists" is a Transaction.
    
    /* 
       Why Transaction? 
       setDoc(..., { merge: false }) overwrites. 
       We want to fail if it exists.
    */
   
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(appointmentRef);

      // Para clientes reales leemos también su perfil (antes de cualquier escritura, como
      // exige runTransaction) para actualizar los agregados de re-reserva.
      const clientRef = doc(db, "clientes", clientEmail);
      const clientSnap = force ? null : await transaction.get(clientRef);

      // Si el doc existe, el slot está tomado y punto. No hay caso "existe pero cancelado":
      // cancelar borra el doc (hard delete, ver cancelAppointment) y nada escribe nunca el
      // estado `cancelled`. Aunque quedara uno viejo de otra época, sobrescribirlo sería un
      // update, que firestore.rules solo permite al admin — el cliente fallaría igual.
      if (docSnap.exists()) {
        throw new Error("El turno acaba de ser reservado por otra persona.");
      }
      transaction.set(appointmentRef, newAppointment);

      // Historial del cliente: cada reserva suma una entrada (se resta al cancelar, ver
      // cancelAppointment). Atómico con la creación del turno. Solo para reservas de
      // clientes reales: las que hace el admin (force) van con su propio email y no
      // corresponden a una cuenta de cliente.
      if (!force) {
        const historyRef = doc(db, "clientes", clientEmail, "history", docId);
        transaction.set(historyRef, { time: timestamp, id: docId });

        // Agregados para el recordatorio de re-reserva ("ya te toca"). Promedio incremental
        // O(1): con firstVisit + lastVisit + visitCount alcanza para el intervalo medio, sin
        // leer todo el historial. `nextNudgeAt = lastVisit + intervaloMedio` es lo que el
        // cron consulta (una query indexada por rango). Ver netlify/functions/nudge-reengagement.
        const cData = clientSnap && clientSnap.exists() ? clientSnap.data() : {};
        const prevCount = typeof cData.visitCount === "number" ? cData.visitCount : 0;
        const visitCount = prevCount + 1;
        const firstVisit = (cData.firstVisit as Timestamp) ?? timestamp;
        const lastVisit = timestamp;

        // `nudgeStreak` = cuántos "ya te toca" seguidos le mandamos sin que vuelva. Reservar
        // es exactamente la señal de que volvió, así que lo reinicia y le devuelve el crédito
        // completo de insistencia (el cron corta al llegar al tope, ver nudge-reengagement).
        const patch: Record<string, unknown> = { firstVisit, lastVisit, visitCount, nudgeStreak: 0 };
        const nextNudgeAt = nextNudgeFrom(firstVisit, lastVisit, visitCount);
        if (nextNudgeAt) patch.nextNudgeAt = nextNudgeAt;
        transaction.set(clientRef, patch, { merge: true });
      }
    });

    return true;
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      if (error.message.includes("reservado")) {
          throw error; // Re-throw specific race condition error
      }
      throw new Error("No se pudo reservar el turno. Intente nuevamente.");
    }
  };
  
  // Cancel/Delete appointment. Hard delete para liberar el slot. Además resta la entrada
  // del historial del cliente (el id de la entrada coincide con el del turno) y recalcula los
  // agregados de re-reserva. Leemos el turno primero para saber a qué cliente pertenece, así
  // sirve tanto para la cancelación del propio cliente como para la del admin sobre la
  // reserva de un cliente (firestore.rules deja al admin escribir el doc del cliente).
  export const cancelAppointment = async (appointmentId: string) => {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const snap = await getDoc(appointmentRef);
      const clientEmail = snap.exists() ? (snap.data() as Appointment).clientEmail : null;

      await deleteDoc(appointmentRef);

      if (clientEmail) {
          try {
              // Solo las reservas de clientes reales dejan entrada en el historial. Si no hay,
              // era un walk-in que cargó el admin con su propio email: no hay agregados suyos
              // que tocar y no queremos escribirle basura al doc del admin.
              const historyRef = doc(db, "clientes", clientEmail, "history", appointmentId);
              const histSnap = await getDoc(historyRef);
              if (!histSnap.exists()) return;

              await deleteDoc(historyRef);
              await recalcNudgeAggregates(clientEmail);
          } catch (e) {
              console.error("No se pudo restar la entrada del historial al cancelar:", e);
          }
      }
  };

export const getUserActiveAppointment = async (userEmail: string) => {
    const now = new Date();
    // We want appointments where status is confirmed and time is in the future.
    // Firestore composite queries with inequality on different fields are tricky.
    // Simpler: Query by email and status, then filter by date in client.
    
    const q = query(
        collection(db, "appointments"),
        where("clientEmail", "==", userEmail),
        where("status", "==", "confirmed")
    );
    
    const snapshot = await getDocs(q);
    
    // Filter for future appointments (allowing a 30min grace period into the past like before)
    const futureApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        .filter(app => {
            const appDate = app.timestamp.toDate();
            // isDateAfterNowBy30Min logic
            const momentApp = moment(appDate);
            const momentNow = moment().utcOffset("-03:00"); // consistent timezone
            const diff = momentNow.diff(momentApp, "minutes");
            return diff <= 30; 
        })
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
        
    return futureApps.length > 0 ? futureApps[0] : null;
};

export const subscribeToUserActiveAppointment = (userEmail: string, callback: (appointment: Appointment | null) => void) => {
    const q = query(
        collection(db, "appointments"),
        where("clientEmail", "==", userEmail),
        where("status", "==", "confirmed")
    );

    // Returns the unsubscribe function
    return onSnapshot(q, (snapshot) => {
        const futureApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
            .filter(app => {
                const appDate = app.timestamp.toDate();
                const momentApp = moment(appDate);
                const momentNow = moment().utcOffset("-03:00");
                const diff = momentNow.diff(momentApp, "minutes");
                return diff <= 30;
            })
            .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
        
        callback(futureApps.length > 0 ? futureApps[0] : null);
    }, (error) => {
        console.error("Error subscribing to appointments:", error);
        callback(null);
    });
};
