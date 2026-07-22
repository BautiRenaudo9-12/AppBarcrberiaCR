import { describe, it, expect } from "vitest";
import { toWhatsappNumber, whatsappLink } from "./phone";

// Los `nro` guardados conviven en dos formatos (ver phone.ts). El caso que motivó estos tests:
// el strip del "15" legacy se comía un "15" que era parte del número real, y para el área 341
// —Rosario, donde está la barbería— eso rompía el link de cualquier cliente cuyo número local
// empiece con 5.
describe("toWhatsappNumber", () => {
  describe("formato de PhoneInput (+código)", () => {
    it("normaliza un móvil argentino con el 9", () => {
      expect(toWhatsappNumber("+54 9 341 5123456")).toBe("5493415123456");
    });

    it("agrega el 9 cuando no viene", () => {
      expect(toWhatsappNumber("+54 341 5123456")).toBe("5493415123456");
    });

    it("no se come el '15' que es parte del número (área 341)", () => {
      // "3415123456" es área 341 + 5123456: no hay 15 de móvil que sacar.
      expect(toWhatsappNumber("+54 341 5123456")).toBe("5493415123456");
    });

    it("saca el 15 legacy cuando sí está", () => {
      expect(toWhatsappNumber("+54 341 15 5123456")).toBe("5493415123456");
    });

    it("maneja Buenos Aires", () => {
      expect(toWhatsappNumber("+54 11 2345 6789")).toBe("5491123456789");
    });

    it("saca el 0 de tránsito de otros países", () => {
      expect(toWhatsappNumber("+598 099 123 456")).toBe("59899123456");
      expect(toWhatsappNumber("+598 99 123 456")).toBe("59899123456");
    });

    it("deja intacto un país que no está en la lista", () => {
      expect(toWhatsappNumber("+49 30 12345678")).toBe("493012345678");
    });

    it("no antepone el 9 a números no argentinos", () => {
      expect(toWhatsappNumber("+1 555 123 4567")).toBe("15551234567");
    });
  });

  describe("valores legacy sin prefijo (siempre argentinos)", () => {
    it("acepta el nacional pelado", () => {
      expect(toWhatsappNumber("11 2345 6789")).toBe("5491123456789");
      expect(toWhatsappNumber("341 512-3456")).toBe("5493415123456");
    });

    it("saca el 0 de tránsito y el 15", () => {
      expect(toWhatsappNumber("011 15-2345-6789")).toBe("5491123456789");
      expect(toWhatsappNumber("0341 15 5123456")).toBe("5493415123456");
    });

    it("acepta el 54 pegado sin '+'", () => {
      expect(toWhatsappNumber("5491123456789")).toBe("5491123456789");
    });
  });

  describe("entradas inutilizables", () => {
    it("devuelve null en vez de armar un link roto", () => {
      expect(toWhatsappNumber("123")).toBeNull();
      expect(toWhatsappNumber("")).toBeNull();
      expect(toWhatsappNumber(null)).toBeNull();
      expect(toWhatsappNumber(undefined)).toBeNull();
    });
  });
});

describe("whatsappLink", () => {
  it("arma el link cuando el número sirve", () => {
    expect(whatsappLink("+54 341 5123456")).toBe("https://wa.me/5493415123456");
  });

  it("devuelve null cuando no", () => {
    expect(whatsappLink("123")).toBeNull();
  });
});
