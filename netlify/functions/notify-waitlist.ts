import { Handler } from "@netlify/functions";
import { getAdmin } from "./shared/firebaseAdmin";
import { emailsWithActiveAppointment } from "./shared/activeAppointments";
import { DEAD_TOKEN_CODES, clearDeadTokens } from "./shared/fcm";

// Aviso de lista de espera: lo llama el browser (best-effort) cuando se libera un turno de un
// día, sea por una cancelación o por un sobreturno del admin. Verifica el ID token de Firebase
// y manda un push a los anotados en la lista de espera de ese día. Ver docs/adr/0002.

// No re-avisar al mismo cliente más seguido que esto (protege de llamadas repetidas/abuso).
const THROTTLE_MINUTES = 10;

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

    // Throttle por destinatario: descartamos antes de leer nada más, así las lecturas de
    // abajo solo cubren a quien podría recibir el aviso.
    const candidates = snap.docs.filter((doc) => {
      const data = doc.data();
      if (!data.clientEmail) return false;
      const last = data.lastNotifiedAt?.toDate?.()?.getTime?.() ?? 0;
      return last < throttleFloor;
    });

    if (!candidates.length) {
      return { statusCode: 200, body: JSON.stringify({ processed: snap.size, notified: 0 }) };
    }

    // Dos lecturas para toda la lista (antes eran dos por anotado, secuenciales).
    const emails = [...new Set(candidates.map((d) => d.data().clientEmail as string))];
    const [busy, profileSnaps] = await Promise.all([
      emailsWithActiveAppointment(db),
      // El ID del doc de cliente es el email, así que alcanza para indexar los perfiles.
      db.getAll(...emails.map((e) => db.collection("clientes").doc(e))),
    ]);
    const profiles = new Map<string, FirebaseFirestore.DocumentData>(
      profileSnaps.map((s) => [s.id, s.data() || {}])
    );

    // Solo los destinatarios que realmente recibieron el push. El throttle se escribe recién
    // después de los envíos: marcarlo antes silenciaba 10 minutos a quien no recibió nada.
    const delivered: FirebaseFirestore.DocumentReference[] = [];
    const staleTokens: { email: string; token: string }[] = [];
    const sends: Promise<unknown>[] = [];

    for (const doc of candidates) {
      const email = doc.data().clientEmail as string;

      // Quien ya tiene un turno activo no debería recibir el aviso (no puede reservar otro).
      if (busy.has(email)) continue;

      // Token/preferencia de notificaciones viven en el perfil privado del cliente.
      const profile = profiles.get(email) || {};
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
            delivered.push(doc.ref);
          })
          .catch((err: any) => {
            // Sin push entregado no marcamos el throttle: así el próximo turno liberado
            // vuelve a intentarlo en vez de dejar al cliente en silencio.
            if (DEAD_TOKEN_CODES.has(err?.code)) staleTokens.push({ email, token: fcmToken });
            console.error(`Fallo el envío a ${email}:`, err?.code || err?.message);
          })
      );
    }

    await Promise.all(sends);

    if (delivered.length) {
      const batch = db.batch();
      const notifiedAt = admin.firestore.Timestamp.now();
      for (const ref of delivered) batch.update(ref, { lastNotifiedAt: notifiedAt });
      await batch.commit();
    }

    // Tokens muertos: fuera del perfil, para no reintentarlos en cada turno liberado.
    await clearDeadTokens(db, staleTokens);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed: snap.size,
        notified: delivered.length,
        cleanedTokens: staleTokens.length,
      }),
    };
  } catch (error: any) {
    console.error("Error en notify-waitlist:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
