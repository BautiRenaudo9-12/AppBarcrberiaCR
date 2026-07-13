import { Handler } from "@netlify/functions";
import { getAdmin } from "./shared/firebaseAdmin";

// Aviso de lista de espera: lo llama el browser (best-effort) al cancelar un turno. Verifica
// el ID token de Firebase y manda un push a los anotados en la lista de espera de ese día.
// Ver docs/adr/0002.

// No re-avisar al mismo cliente más seguido que esto (protege de llamadas repetidas/abuso).
const THROTTLE_MINUTES = 10;
// Gracia hacia el pasado para considerar "activo" un turno (consistente con el cliente).
const ACTIVE_GRACE_MINUTES = 30;

async function clientHasActiveAppointment(db: FirebaseFirestore.Firestore, email: string) {
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
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let admin;
  try {
    admin = getAdmin();
  } catch (e) {
    console.error("Firebase init failed:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "init_failed" }) };
  }

  // Auth: exigimos un ID token de Firebase válido (cualquier usuario logueado puede disparar
  // el aviso; el throttle por destinatario acota el abuso).
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { statusCode: 401, body: "Unauthorized" };
  try {
    await admin.auth().verifyIdToken(token);
  } catch {
    return { statusCode: 401, body: "Unauthorized" };
  }

  let date: string | undefined;
  try {
    date = JSON.parse(event.body || "{}").date;
  } catch {
    /* ignore */
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { statusCode: 400, body: JSON.stringify({ error: "bad_date" }) };
  }

  try {
    const db = admin.firestore();
    const snap = await db.collection("waitlist").where("date", "==", date).get();

    const prettyDate = new Date(`${date}T12:00:00-03:00`).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    const nowMs = Date.now();
    const throttleFloor = nowMs - THROTTLE_MINUTES * 60 * 1000;
    const batch = db.batch();
    const sends: Promise<unknown>[] = [];
    let notified = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const email = data.clientEmail;
      if (!email) continue;

      // Throttle por destinatario.
      const last = data.lastNotifiedAt?.toDate?.()?.getTime?.() ?? 0;
      if (last >= throttleFloor) continue;

      // Quien ya tiene un turno activo no debería recibir el aviso (no puede reservar otro).
      if (await clientHasActiveAppointment(db, email)) continue;

      // Token/preferencia de notificaciones viven en el perfil privado del cliente.
      const userDoc = await db.collection("clientes").doc(email).get();
      const profile = userDoc.data() || {};
      if (profile.notifEnabled === false) continue;
      const fcmToken = profile.fcmToken;
      if (!fcmToken) continue;

      sends.push(
        admin
          .messaging()
          .send({
            token: fcmToken,
            data: {
              type: "waitlist_slot",
              title: "¡Se liberó un turno!",
              body: `Se liberó un turno el ${prettyDate}. Reservá antes de que lo tomen.`,
              url: `/turnos?date=${date}`,
              date,
            },
          })
          .then(() => {
            notified++;
          })
          .catch((err: any) => {
            console.error(`Fallo el envío a ${email}:`, err?.code || err?.message);
          })
      );

      batch.update(doc.ref, { lastNotifiedAt: admin.firestore.Timestamp.now() });
    }

    await Promise.all(sends);
    await batch.commit();

    return {
      statusCode: 200,
      body: JSON.stringify({ processed: snap.size, notified }),
    };
  } catch (error: any) {
    console.error("Error en notify-waitlist:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
