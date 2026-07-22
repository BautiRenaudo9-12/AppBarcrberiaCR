import { parsePhone } from "@/lib/countries";

// Normalización de teléfonos al formato que espera wa.me (dígitos, con código de país,
// sin "+" ni separadores). ESTA es la única implementación: hubo una segunda copia en
// `countries.ts` que no contemplaba los valores legacy y armaba links rotos para el mismo
// cliente según desde qué pantalla se lo mirara.
//
// Dos formatos conviven en `clientes/{email}.nro`:
//  - El que escribe PhoneInput hoy: "+<código> <número>" (ej. "+54 11 2345 6789").
//  - Valores legacy sin prefijo, siempre argentinos (ej. "11 2345 6789", "011 15-2345-6789").

// Parte nacional argentina → formato de WhatsApp. AR es el caso con más ruido histórico:
// el 0 de tránsito, el viejo 15 de móviles (va después del área) y el 9 que WhatsApp exige
// y que nosotros agregamos al final, para no depender de si venía o no en el dato guardado.
// Los códigos de área argentinos empiezan en 1, 2 o 3, así que un 9 inicial siempre es ese
// prefijo de móvil y se puede quitar sin ambigüedad.
function toArgentinaNumber(national: string): string | null {
  let d = national;
  if (d.startsWith("9")) d = d.slice(1);
  d = d.replace(/^0/, "");
  // El 15 se saca SOLO si sobra longitud. Un nacional argentino son 10 dígitos (área +
  // número) y con el 15 intercalado quedan 12. Sin esta condición el regex se come un "15"
  // que es parte legítima del número: "341 5123456" (Rosario) matchea como
  // "34" + "15" + "123456" y devolvía "54934123456", un link roto.
  if (d.length > 10) d = d.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");

  // Nacional esperado: área (2-4) + número (6-8).
  if (d.length < 8 || d.length > 11) return null;

  return `549${d}`;
}

export function toWhatsappNumber(raw?: string | null): string | null {
  const value = (raw || "").trim();
  if (!value) return null;

  if (value.startsWith("+")) {
    const digits = value.slice(1).replace(/\D/g, "");
    if (!digits) return null;

    if (digits.startsWith("54")) return toArgentinaNumber(digits.slice(2));

    // Otro país: wa.me quiere el número completo con su código tal cual. Solo sacamos el
    // 0 de tránsito, y para eso hay que saber dónde termina el código de país.
    const { country } = parsePhone(value);
    // parsePhone cae a Argentina cuando el prefijo no está en COUNTRIES; como acá ya
    // descartamos el 54, ese fallback significa "código desconocido" y dejamos los
    // dígitos intactos en vez de inventar un corte.
    const known = digits.startsWith(country.dial);
    const normalized = known
      ? `${country.dial}${digits.slice(country.dial.length).replace(/^0+/, "")}`
      : digits;

    return normalized.length >= 8 && normalized.length <= 15 ? normalized : null;
  }

  // Sin prefijo: legacy argentino. Puede traer el 54 pegado sin "+", pero solo lo tratamos
  // como código de país si el largo da (54 + nacional de 10, con o sin el 9): un local de
  // 8 dígitos que casualmente empiece con "54" no debe perderlos.
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const national = digits.startsWith("54") && digits.length >= 12 ? digits.slice(2) : digits;

  return toArgentinaNumber(national);
}

// Link listo para abrir el chat de WhatsApp (sin texto pre-cargado).
export function whatsappLink(raw?: string | null): string | null {
  const num = toWhatsappNumber(raw);
  return num ? `https://wa.me/${num}` : null;
}
