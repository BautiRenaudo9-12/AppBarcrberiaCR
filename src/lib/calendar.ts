import moment from "moment";

// Datos fijos del local que se vuelcan en el evento.
const BARBERSHOP_NAME = "Barberia CR";
const BARBERSHOP_ADDRESS = "Brown 2178, Rosario, Santa Fe";

// Duración del evento. La fuente real es `intervalo` de `turnos/{dia}`, pero la card del
// próximo turno no tiene esa config a mano: 30 min es el default del negocio (ver
// useTurnos) y alcanza para que el cliente reserve el hueco en su agenda.
const DEFAULT_DURATION_MIN = 30;

// Google interpreta `dates` en UTC cuando termina en Z; `ctz` solo define en qué zona se
// muestra. El timestamp del turno ya es el instante correcto (se ancla a -03:00 al crear
// la reserva, ver services/appointments.ts), así que convertir a UTC es directo.
const TIMEZONE = "America/Argentina/Buenos_Aires";

const formatUtc = (date: Date) => `${moment(date).utc().format("YYYYMMDDTHHmmss")}Z`;

/**
 * Arma el link de plantilla de Google Calendar para un turno. Abre el evento precargado
 * para que el cliente lo guarde con un toque: no requiere OAuth ni backend.
 *
 * Contrapartida asumida: el evento queda en el calendario del cliente aunque después
 * cancele el turno. Borrarlo automáticamente exigiría la Calendar API con OAuth.
 */
export function googleCalendarUrl(start: Date, durationMin: number = DEFAULT_DURATION_MIN): string {
  const end = moment(start).add(durationMin, "minutes").toDate();

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Turno en ${BARBERSHOP_NAME}`,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    location: BARBERSHOP_ADDRESS,
    details: `Tu turno en ${BARBERSHOP_NAME}.`,
    ctz: TIMEZONE,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
