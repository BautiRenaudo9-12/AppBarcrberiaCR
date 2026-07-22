import { Handler } from "@netlify/functions";
import { getAdmin } from "./shared/firebaseAdmin";
import { emailsWithActiveAppointment } from "./shared/activeAppointments";
import { DEAD_TOKEN_CODES, clearDeadTokens } from "./shared/fcm";
import { sweepExpiredDocs } from "./shared/cleanup";

// Recordatorio de re-reserva ("ya te toca"). Cron diario: busca clientes que, según su
// intervalo medio de visitas, ya deberían haber vuelto, y les manda UN push suave.
//
// Costo acotado a propósito:
//  - Los agregados (firstVisit/lastVisit/visitCount/nextNudgeAt) se mantienen incrementales
//    al reservar (ver src/services/appointments.ts), así el cron NO lee historiales.
//  - Una sola query indexada por rango (nextNudgeAt <= now) trae solo los vencidos.
//  - Filtros por cliente (visitas mínimas, throttle, turno activo, notif) y tope por corrida.
//
// `nextNudgeAt` es el **cursor del scheduler**, no la fecha en que al cliente "le toca": tras
// un nudge vale now + THROTTLE_DAYS, que ya no tiene nada que ver con su intervalo de visitas.
// De ahí la regla que sostiene todo esto: **todo candidato que el cron evalúa se reprograma**,
// lo haya recibido o no. Si a los salteados no se los movía, los que nunca son elegibles (sin
// push, con menos de MIN_VISITS) se clavaban adelante para siempre —la query es asc con tope—
// y terminaban tapando a quienes sí había que avisar.

const MIN_VISITS = 3; // patrón mínimo para inferir un intervalo confiable
const THROTTLE_DAYS = 21; // no volver a empujar al mismo cliente antes de esto
const RECHECK_DAYS = 7; // cada cuánto volver a mirar a un candidato que hoy no es elegible
const MAX_SENDS = 50; // tope de envíos por ejecución
const QUERY_LIMIT = 200; // tope de candidatos leídos por ejecución

// Tope de insistencia: cuántos "ya te toca" seguidos mandamos sin que el cliente vuelva.
// THROTTLE_DAYS limita la frecuencia pero no el total: sin este tope, quien no vuelve nunca
// recibiría un push cada 21 días para siempre. Eso es justo lo que mata la feature — "la
// relevancia es supervivencia" (docs/adr/0001): al que le llegan avisos que no quiere, apaga
// las notificaciones y deja de recibir también los recordatorios de turno. Reservar reinicia
// el contador (ver src/services/appointments.ts).
const MAX_NUDGES_WITHOUT_VISIT = 3;

export const handler: Handler = async (event) => {
  // Fail-closed: mismo esquema que check-upcoming-appointments (x-api-key === CRON_SECRET).
  const apiKey = event.headers["x-api-key"];
  if (!process.env.CRON_SECRET || apiKey !== process.env.CRON_SECRET) {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let admin;
  try {
    admin = getAdmin();
  } catch (e) {
    console.error("Firebase init failed:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "init_failed" }) };
  }

  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();
    const throttleMs = THROTTLE_DAYS * 24 * 60 * 60 * 1000;

    // Candidatos: clientes cuyo "ya te toca" venció. Query indexada por rango.
    const snap = await db
      .collection("clientes")
      .where("nextNudgeAt", "<=", now)
      .orderBy("nextNudgeAt", "asc")
      .limit(QUERY_LIMIT)
      .get();

    // Un solo lookup de turnos activos para todos los candidatos (antes: una query por
    // cliente, secuencial, hasta QUERY_LIMIT veces por corrida).
    const busy = snap.empty ? new Set<string>() : await emailsWithActiveAppointment(db);

    // El tope se cuenta sobre los envíos *disparados*, sincrónicamente dentro del bucle: los
    // `.then` de los envíos no corren hasta después, así que contar entregas no sirve para
    // cortar.
    let attempted = 0;
    // Solo los clientes que realmente recibieron el push: el throttle se reprograma recién
    // después de los envíos (ver abajo).
    const nudged: FirebaseFirestore.DocumentReference[] = [];
    // Los que evaluamos y salteamos: mueven el cursor igual, para que la cola no se tape.
    const skipped: FirebaseFirestore.DocumentReference[] = [];
    // Los que agotaron el tope de insistencia: salen de la cola del todo (ver abajo).
    const exhausted: FirebaseFirestore.DocumentReference[] = [];
    const staleTokens: { email: string; token: string }[] = [];
    const sends: Promise<unknown>[] = [];

    for (const doc of snap.docs) {
      // Ojo: cortamos ANTES de evaluar, así los que quedan afuera del tope conservan su
      // nextNudgeAt y son los primeros de la corrida de mañana.
      if (attempted >= MAX_SENDS) break;
      const data = doc.data();
      const email = data.email || doc.id;

      // Patrón mínimo de visitas.
      if ((data.visitCount ?? 0) < MIN_VISITS) {
        skipped.push(doc.ref);
        continue;
      }

      // Ya insistimos suficiente y no volvió: paramos. No alcanza con saltearlo —
      // reprogramarlo lo dejaría rotando en la cola para siempre. Al no tener nextNudgeAt
      // sale de la query, y solo vuelve a entrar si reserva (eso reinicia el contador).
      if ((data.nudgeStreak ?? 0) >= MAX_NUDGES_WITHOUT_VISIT) {
        exhausted.push(doc.ref);
        continue;
      }

      // Throttle por cliente.
      const lastNudgedMs = data.lastNudgedAt?.toDate?.()?.getTime?.() ?? 0;
      if (nowMs - lastNudgedMs < throttleMs) {
        skipped.push(doc.ref);
        continue;
      }

      // Notificaciones habilitadas y con token.
      if (data.notifEnabled === false) {
        skipped.push(doc.ref);
        continue;
      }
      const fcmToken = data.fcmToken;
      if (!fcmToken) {
        skipped.push(doc.ref);
        continue;
      }

      // Si ya tiene un turno activo, no lo molestamos (ya volvió).
      if (busy.has(email)) {
        skipped.push(doc.ref);
        continue;
      }

      const firstName = (data.name || "").split(" ")[0];
      const greeting = firstName ? `${firstName}, ` : "";

      attempted++;
      sends.push(
        admin
          .messaging()
          .send({
            token: fcmToken,
            data: {
              type: "reengagement",
              title: "¿Te toca un corte? ✂️",
              body: `${greeting}ya pasó un tiempo desde tu última visita. Reservá tu turno cuando quieras.`,
              url: "/turnos",
            },
          })
          .then(() => {
            nudged.push(doc.ref);
          })
          .catch((err: any) => {
            // Token muerto: lo sacamos del perfil y corremos el cursor igual, si no se clava
            // en la cabeza de la cola y la tapa. Un error transitorio no toca nada: el cron de
            // mañana lo reintenta.
            if (DEAD_TOKEN_CODES.has(err?.code)) {
              staleTokens.push({ email, token: fcmToken });
              skipped.push(doc.ref);
            }
            console.error(`Fallo el envío a ${email}:`, err?.code || err?.message);
          })
      );
    }

    await Promise.all(sends);

    if (nudged.length || skipped.length || exhausted.length) {
      const batch = db.batch();

      // Recibió el push: throttle completo y +1 a la insistencia. Si el envío falló, no lo
      // tocamos y el cron de mañana lo reintenta (reprogramarlo igual lo dejaba 21 días en
      // silencio sin haberle llegado nada). Cuando el cliente reserve, la transacción de
      // reserva recalcula nextNudgeAt y reinicia nudgeStreak, pisando estos valores.
      const nextAfterNudge = admin.firestore.Timestamp.fromMillis(nowMs + throttleMs);
      for (const ref of nudged) {
        batch.update(ref, {
          lastNudgedAt: now,
          nextNudgeAt: nextAfterNudge,
          nudgeStreak: admin.firestore.FieldValue.increment(1),
        });
      }

      // Agotó la insistencia: lo sacamos de la cola. Sin nextNudgeAt no entra más a la query
      // —ni gasta lecturas ni rota— hasta que vuelva a reservar.
      for (const ref of exhausted) {
        batch.update(ref, { nextNudgeAt: admin.firestore.FieldValue.delete() });
      }

      // Salteado: solo movemos el cursor, sin tocar lastNudgedAt — no se le mandó nada. El
      // recheck corto es lo que hace que esto se auto-cure: si activa push, lo levantamos en
      // RECHECK_DAYS sin necesidad de que ningún opt-in recalcule nada.
      const nextRecheck = admin.firestore.Timestamp.fromMillis(
        nowMs + RECHECK_DAYS * 24 * 60 * 60 * 1000
      );
      for (const ref of skipped) batch.update(ref, { nextNudgeAt: nextRecheck });

      await batch.commit();
    }

    // Después del batch: toca los mismos docs de `clientes` pero otros campos, y así la
    // limpieza lee el perfil ya reprogramado.
    await clearDeadTokens(db, staleTokens);

    // Barrido de lista de espera y sobreturnos vencidos. Va colgado de este cron por ser el
    // único diario, y es best-effort: si falla, los nudges (el trabajo real de esta function)
    // ya están hechos y no tiene sentido devolver un error.
    let sweptDocs: Record<string, number> = {};
    try {
      sweptDocs = await sweepExpiredDocs(db);
    } catch (e) {
      console.error("Falló el barrido de datos vencidos:", e);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: snap.size,
        notified: nudged.length,
        rescheduled: skipped.length,
        exhausted: exhausted.length,
        cleanedTokens: staleTokens.length,
        swept: sweptDocs,
      }),
    };
  } catch (error: any) {
    console.error("Error en nudge-reengagement:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
