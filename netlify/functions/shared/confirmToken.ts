import crypto from "crypto";

// Token de confirmación de asistencia: viaja en el payload del push de recordatorio
// (check-upcoming-appointments) y lo valida confirm-appointment cuando el cliente toca
// "Confirmar". Es la única prueba de intención que tenemos, porque el service worker no
// tiene el ID token del usuario. El secreto (CRON_SECRET) nunca viaja: solo su HMAC.
//
// Va ligado al turno **y al cliente**: la ID del turno es determinista ("2026-01-16_10-00")
// y se reutiliza apenas alguien cancela y otra persona toma ese mismo slot. Firmando solo la
// ID, el token del push viejo seguiría siendo válido y podría marcar como confirmado el
// turno de un tercero.
//
// Vive acá, compartido, para que las dos puntas no puedan derivar: si una cambia lo que
// firma y la otra no, todas las confirmaciones fallan en silencio.
export function confirmTokenFor(
  appointmentId: string,
  clientEmail: string,
  secret: string
): string {
  return crypto
    .createHmac("sha256", secret)
    .update(`${appointmentId}|${clientEmail}`)
    .digest("hex");
}

// Comparación en tiempo constante, para no filtrar el token esperado por timing.
// `timingSafeEqual` exige buffers del mismo largo, así que el chequeo de longitud va antes
// (y no filtra nada útil: el largo del HMAC es público y siempre el mismo).
export function confirmTokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
