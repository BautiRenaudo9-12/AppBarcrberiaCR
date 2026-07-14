import { Handler } from "@netlify/functions";
import { getAdmin } from "./shared/firebaseAdmin";

// Recordatorio de re-reserva ("ya te toca"). Cron diario: busca clientes que, según su
// intervalo medio de visitas, ya deberían haber vuelto, y les manda UN push suave.
//
// Costo acotado a propósito:
//  - Los agregados (firstVisit/lastVisit/visitCount/nextNudgeAt) se mantienen incrementales
//    al reservar (ver src/services/appointments.ts), así el cron NO lee historiales.
//  - Una sola query indexada por rango (nextNudgeAt <= now) trae solo los vencidos.
//  - Filtros por cliente (visitas mínimas, throttle, turno activo, notif) y tope por corrida.

const MIN_VISITS = 3; // patrón mínimo para inferir un intervalo confiable
const THROTTLE_DAYS = 21; // no volver a empujar al mismo cliente antes de esto
const MAX_SENDS = 50; // tope de envíos por ejecución
const QUERY_LIMIT = 200; // tope de candidatos leídos por ejecución
const ACTIVE_GRACE_MINUTES = 30;

async function clientHasActiveAppointment(
  db: FirebaseFirestore.Firestore,
  email: string
) {
  const snap = await db
    .collection("appointments")
    .where("clientEmail", "==", email)
    .where("status", "==", "confirmed")
    .get();
  const floor = Date.now() - ACTIVE_GRACE_MINUTES * 60 * 1000;
  return snap.docs.some((d) => {
    const ts = d.data().timestamp;
    const t = ts?.toDate?.()?.getTime?.() ?? 0;
    return t >= floor;
  });
}

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

    let sent = 0;
    const sends: Promise<unknown>[] = [];
    const batch = db.batch();

    for (const doc of snap.docs) {
      if (sent >= MAX_SENDS) break;
      const data = doc.data();
      const email = data.email || doc.id;

      // Patrón mínimo de visitas.
      if ((data.visitCount ?? 0) < MIN_VISITS) continue;

      // Throttle por cliente.
      const lastNudgedMs = data.lastNudgedAt?.toDate?.()?.getTime?.() ?? 0;
      if (nowMs - lastNudgedMs < throttleMs) continue;

      // Notificaciones habilitadas y con token.
      if (data.notifEnabled === false) continue;
      const fcmToken = data.fcmToken;
      if (!fcmToken) continue;

      // Si ya tiene un turno activo, no lo molestamos (ya volvió).
      if (await clientHasActiveAppointment(db, email)) continue;

      const firstName = (data.name || "").split(" ")[0];
      const greeting = firstName ? `${firstName}, ` : "";

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
            sent++;
          })
          .catch((err: any) => {
            console.error(`Fallo el envío a ${email}:`, err?.code || err?.message);
          })
      );

      // Reprogramar el próximo empujón (throttle) y registrar el envío. Cuando el cliente
      // reserve, la transacción de reserva recalcula nextNudgeAt correctamente.
      batch.update(doc.ref, {
        lastNudgedAt: now,
        nextNudgeAt: admin.firestore.Timestamp.fromMillis(nowMs + throttleMs),
      });
    }

    await Promise.all(sends);
    await batch.commit();

    return {
      statusCode: 200,
      body: JSON.stringify({ processed: snap.size, notified: sent }),
    };
  } catch (error: any) {
    console.error("Error en nudge-reengagement:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
