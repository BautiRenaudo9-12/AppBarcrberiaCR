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
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";
import { getBlockedRule, BlockedSlot, getCustomDayIndex, getDayTimestamp } from "@/services/blocks";

export interface Appointment {
  id?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  timestamp: Timestamp;
  clientEmail: string;
  clientName: string;
  status: "confirmed" | "cancelled" | "completed" | "blocked";
  createdAd: Timestamp;
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
  const [appSnap, singleSnap, recurringSnap, exceptionSnap] = await Promise.all([
    appSnapshotPromise,
    getDocs(qSingle),
    getDocs(qRecurring),
    getDocs(qExceptions)
  ]);

  // A. If real appointment exists -> NOT Available
  if (!appSnap.empty) return false;

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

  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  const timestamp = Timestamp.fromDate(new Date(dateTimeStr));

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
    createdAd: Timestamp.now()
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
      if (docSnap.exists()) {
        const data = docSnap.data() as Appointment;
        // If it exists but is cancelled, we can overwrite.
        if (data.status !== 'cancelled') {
              throw new Error("El turno acaba de ser reservado por otra persona.");
        }
      }
      transaction.set(appointmentRef, newAppointment);

      // Historial del cliente: cada reserva suma una entrada (se resta al cancelar, ver
      // cancelAppointment). Atómico con la creación del turno. Solo para reservas de
      // clientes reales: las que hace el admin (force) van con su propio email y no
      // corresponden a una cuenta de cliente.
      if (!force) {
        const historyRef = doc(db, "clientes", clientEmail, "history", docId);
        transaction.set(historyRef, { time: timestamp, id: docId });
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
  // del historial del cliente (el id de la entrada coincide con el del turno). Leemos el
  // turno primero para saber a qué cliente pertenece, así sirve tanto para la cancelación
  // del propio cliente como para la del admin sobre la reserva de un cliente.
  export const cancelAppointment = async (appointmentId: string) => {
      const appointmentRef = doc(db, "appointments", appointmentId);
      const snap = await getDoc(appointmentRef);
      const clientEmail = snap.exists() ? (snap.data() as Appointment).clientEmail : null;

      await deleteDoc(appointmentRef);

      if (clientEmail) {
          try {
              await deleteDoc(doc(db, "clientes", clientEmail, "history", appointmentId));
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
