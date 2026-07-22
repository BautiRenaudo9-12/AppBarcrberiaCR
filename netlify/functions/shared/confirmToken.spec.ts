import { describe, it, expect } from "vitest";
import { confirmTokenFor, confirmTokenMatches } from "./confirmToken";

const SECRET = "secreto-de-prueba";
const TURNO = "2026-07-22_10-00";
const ANA = "ana@example.com";
const BETO = "beto@example.com";

describe("confirmToken", () => {
  it("valida el token del mismo turno y cliente", () => {
    const token = confirmTokenFor(TURNO, ANA, SECRET);
    expect(confirmTokenMatches(token, confirmTokenFor(TURNO, ANA, SECRET))).toBe(true);
  });

  // El motivo de existir de este módulo: la ID del turno es determinista ("fecha_hora") y se
  // reutiliza apenas alguien cancela y otra persona toma ese mismo horario. Un token viejo no
  // tiene que servir para confirmar la reserva de quien vino después.
  it("rechaza el token de una reserva anterior en el mismo horario", () => {
    const tokenViejo = confirmTokenFor(TURNO, ANA, SECRET);
    expect(confirmTokenMatches(tokenViejo, confirmTokenFor(TURNO, BETO, SECRET))).toBe(false);
  });

  it("rechaza el token de otro turno del mismo cliente", () => {
    const token = confirmTokenFor(TURNO, ANA, SECRET);
    expect(confirmTokenMatches(token, confirmTokenFor("2026-07-22_10-30", ANA, SECRET))).toBe(
      false
    );
  });

  it("rechaza un token firmado con otro secreto", () => {
    const token = confirmTokenFor(TURNO, ANA, SECRET);
    expect(confirmTokenMatches(token, confirmTokenFor(TURNO, ANA, "otro-secreto"))).toBe(false);
  });

  it("rechaza tokens de largo distinto sin romper timingSafeEqual", () => {
    const esperado = confirmTokenFor(TURNO, ANA, SECRET);
    expect(confirmTokenMatches("", esperado)).toBe(false);
    expect(confirmTokenMatches(esperado.slice(0, 10), esperado)).toBe(false);
    expect(confirmTokenMatches(esperado + "extra", esperado)).toBe(false);
  });

  it("es determinista y devuelve un HMAC-SHA256 en hex", () => {
    const token = confirmTokenFor(TURNO, ANA, SECRET);
    expect(token).toBe(confirmTokenFor(TURNO, ANA, SECRET));
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});
