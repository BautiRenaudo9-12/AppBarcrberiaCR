import { Handler } from "@netlify/functions";
import { getAdmin } from "./shared/firebaseAdmin";
import { confirmTokenFor, confirmTokenMatches } from "./shared/confirmToken";

// Confirma la asistencia a un turno desde el push de recordatorio. La llama el service
// worker en segundo plano (sin abrir la app) cuando el cliente toca "Confirmar".
//
// Auth: no hay ID token del usuario (el SW no lo tiene). En su lugar validamos el token
// HMAC que el cron incluyó en el payload del push, ligado al turno y a su cliente
// (ver shared/confirmToken). Solo el dispositivo que recibió ese push lo conoce, así que
// poseerlo prueba la intención.

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

    // Turno inexistente responde igual que token inválido, a propósito. Este endpoint no pide
    // login (el service worker no tiene ID token), así que distinguir "no existe" de "token
    // equivocado" convertiría a la function en un oráculo: cualquiera, sin autenticarse,
    // podría barrer IDs —que son `fecha_hora`, o sea adivinables— y mapear qué horarios están
    // reservados. Dentro de la app eso exige estar logueado.
    if (!snap.exists) {
      return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
    }

    const data = snap.data() ?? {};

    // El turno se lee ANTES de validar el token porque el HMAC está ligado al cliente actual
    // del slot: así un token emitido para una reserva anterior en ese mismo horario (la ID se
    // reutiliza) no sirve para confirmar la de quien vino después.
    const expected = confirmTokenFor(appointmentId, data.clientEmail || "", secret);
    if (!confirmTokenMatches(token, expected)) {
      return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
    }

    // Solo tiene sentido confirmar un turno vigente.
    if (data.status !== "confirmed") {
      return { statusCode: 409, body: JSON.stringify({ error: "not_confirmable" }) };
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
