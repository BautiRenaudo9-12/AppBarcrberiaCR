import { describe, it, expect } from "vitest";
import { generateVirtualSlots, findOutOfScheduleAppointments } from "./slots";

describe("generateVirtualSlots", () => {
  it("genera la grilla del día según el intervalo", () => {
    expect(generateVirtualSlots("14:00", "16:00", 30)).toEqual([
      "14:00",
      "14:30",
      "15:00",
      "15:30",
    ]);
  });

  it("excluye la hora de cierre", () => {
    expect(generateVirtualSlots("09:00", "10:00", 60)).toEqual(["09:00"]);
  });

  it("devuelve vacío si el rango es inválido", () => {
    expect(generateVirtualSlots("18:00", "09:00", 30)).toEqual([]);
  });
});

// Un turno confirmado no puede desaparecer de la vista porque cambió la config del día: el
// cliente lo sigue teniendo en su home y el cron le manda el recordatorio igual.
describe("findOutOfScheduleAppointments", () => {
  const grid = ["14:00", "14:30", "15:00", "15:30"];
  const appts = [
    { time: "09:00", status: "confirmed" }, // quedó antes de la grilla nueva
    { time: "14:30", status: "confirmed" }, // sigue dentro
    { time: "17:00", status: "blocked" }, // quedó después
  ];

  it("devuelve solo los que no caen en la grilla", () => {
    expect(findOutOfScheduleAppointments(appts, grid).map((a) => a.time)).toEqual([
      "09:00",
      "17:00",
    ]);
  });

  it("con la grilla vacía (día inactivo o cerrado) todos quedan fuera", () => {
    expect(findOutOfScheduleAppointments(appts, []).map((a) => a.time)).toEqual([
      "09:00",
      "14:30",
      "17:00",
    ]);
  });

  it("ignora turnos sin hora en vez de romper", () => {
    const conBasura = [...appts, { status: "confirmed" } as { time?: string; status: string }];
    expect(findOutOfScheduleAppointments(conBasura, grid).every((a) => !!a.time)).toBe(true);
  });

  it("sin turnos devuelve vacío", () => {
    expect(findOutOfScheduleAppointments([], grid)).toEqual([]);
  });
});
