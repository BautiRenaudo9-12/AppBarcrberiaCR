// Normaliza un teléfono argentino guardado en `nro` (formato libre, ej. "11 2345 6789",
// "011 15-2345-6789", "+54 9 11 2345 6789") al formato que espera wa.me para móviles de
// Argentina: 54 + 9 + área + número (ej. "5491123456789").
//
// Es una heurística: cubre los casos comunes (número nacional de 10 dígitos con o sin el
// 0 de tránsito y el viejo 15). Números muy raros devuelven null para no armar un link roto.
export function toWhatsappNumber(raw?: string | null): string | null {
  if (!raw) return null;

  let d = raw.replace(/\D/g, "");
  if (!d) return null;

  // Si ya viene con código de país, nos quedamos con la parte nacional para re-normalizar.
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1); // el 9 lo agregamos al final de forma consistente
  }

  // Quitar el 0 de tránsito y el viejo 15 de móvil (aparece después del área).
  d = d.replace(/^0/, "");
  d = d.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");

  // Nacional esperado: área (2-4) + número (6-8) ≈ 10 dígitos.
  if (d.length < 8 || d.length > 11) return null;

  return `549${d}`;
}

// Link listo para abrir el chat de WhatsApp (sin texto pre-cargado).
export function whatsappLink(raw?: string | null): string | null {
  const num = toWhatsappNumber(raw);
  return num ? `https://wa.me/${num}` : null;
}
