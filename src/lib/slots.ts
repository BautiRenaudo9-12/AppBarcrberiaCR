import moment from "moment";

export const generateVirtualSlots = (
  start: string, // "09:00"
  end: string,   // "18:00"
  interval: number // 30
): string[] => {
  const slots: string[] = [];
  let current = moment(start, "HH:mm");
  const endTime = moment(end, "HH:mm");

  while (current.isBefore(endTime)) {
    slots.push(current.format("HH:mm"));
    current.add(interval, "minutes");
  }

  return slots;
};

/**
 * Turnos reservados cuyo horario ya no cae en la grilla del día. Pasa cuando el admin mueve
 * el horario o el intervalo, desactiva el día o lo tapa con un cierre: la config cambia pero
 * las reservas confirmadas siguen vivas (el cliente las ve en su home y el cron le manda el
 * recordatorio). Quien llama los agrega a la lista para que no desaparezcan de la vista.
 *
 * Con la grilla vacía (día inactivo o cerrado) todos los turnos son "fuera de horario", que
 * es justamente el caso donde antes se perdían del todo.
 */
export function findOutOfScheduleAppointments<T extends { time?: string }>(
  appointments: T[],
  virtualSlots: string[]
): (T & { time: string })[] {
  const grid = new Set(virtualSlots);
  return appointments.filter(
    (a): a is T & { time: string } => !!a.time && !grid.has(a.time)
  );
}
