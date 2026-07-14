import { Handler } from "@netlify/functions";
import crypto from "crypto";
import { getAdmin } from "./shared/firebaseAdmin";

// Confirma la asistencia a un turno desde el push de recordatorio. La llama el service
// worker en segundo plano (sin abrir la app) cuando el cliente toca "Confirmar".
//
// Auth: no hay ID token del usuario (el SW no lo tiene). En su lugar validamos un token
// HMAC(appointmentId, CRON_SECRET) que el cron incluye en el payload del push. Solo el
// dispositivo que recibió ese push conoce el token, así que poseerlo prueba la intención.
// El secreto nunca viaja: solo su HMAC por-turno.

function expectedToken(appointmentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(appointmentId).digest("hex");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "not_configured" }) };
  }

  let appointmentId: string | undefined;
  let token: string | undefined;
  try {
    const body = JSON.parse(event.body || "{}");
    appointmentId = body.appointmentId;
    token = body.token;
  } catch {
    /* ignore */
  }

  if (!appointmentId || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: "bad_request" }) };
  }

  // Comparación en tiempo constante para no filtrar el token por timing.
  const expected = expectedToken(appointmentId, secret);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
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
    const ref = db.collection("appointments").doc(appointmentId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: "not_found" }) };
    }
    await ref.update({
      clientConfirmed: true,
      confirmedAt: admin.firestore.Timestamp.now(),
    });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error: any) {
    console.error("Error en confirm-appointment:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
