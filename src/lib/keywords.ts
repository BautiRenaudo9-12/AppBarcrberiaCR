// Índice de búsqueda de clientes. La idea: guardar en `clientes/{email}.keywords` un set de
// tokens normalizados (sin tildes, minúsculas) que cubran nombre + email + teléfono, y buscar
// con `array-contains-any` sobre esos tokens. Normalizar acá y en el término de búsqueda es lo
// que hace la búsqueda insensible a mayúsculas/tildes y tolerante al espacio final.

const MIN = 2;

// Normaliza texto para indexar/buscar: sin tildes, minúsculas, sin espacios de más.
export const normalizeText = (text: string): string =>
  (text || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

// Substrings (>= MIN chars) de una cadena corta. Al ser por-palabra/por-segmento (no del
// string entero con espacios), la cantidad queda acotada. Permite buscar cualquier fragmento
// (prefijo, medio o sufijo): "tista" -> "bautista", "456" -> "...456...".
const substrings = (s: string): string[] => {
  const out: string[] = [];
  if (s.length > 0 && s.length < MIN) out.push(s);
  for (let i = 0; i < s.length; i++) {
    for (let j = i + MIN; j <= s.length; j++) out.push(s.slice(i, j));
  }
  return out;
};

// Keywords de un texto por palabra (nombre): substrings de cada palabra.
export const generateKeywords = (text: string): string[] => {
  const norm = normalizeText(text);
  if (!norm) return [];
  const set = new Set<string>();
  for (const word of norm.split(" ")) {
    if (!word) continue;
    for (const s of substrings(word)) set.add(s);
  }
  return Array.from(set);
};

// Índice unificado nombre + email + teléfono para `clientes/{email}.keywords`.
export const createSearchKeywords = (name: string, email: string, phone?: string): string[] => {
  const set = new Set<string>();

  // Nombre: substrings por palabra.
  for (const k of generateKeywords(name || "")) set.add(k);

  // Email: substrings del local-part + el email completo como token exacto.
  const em = normalizeText(email || "").replace(/\s+/g, "");
  if (em) {
    set.add(em);
    const local = em.split("@")[0] || "";
    for (const s of substrings(local)) set.add(s);
  }

  // Teléfono: substrings de los dígitos.
  const digits = (phone || "").replace(/\D/g, "");
  for (const s of substrings(digits)) set.add(s);

  return Array.from(set);
};

// Tokens normalizados del término de búsqueda, para `array-contains-any` (máx. 10, límite de
// Firestore). Se descartan fragmentos de menos de MIN chars (no matchean nada indexado y
// vaciarían el AND). El AND multi-palabra se filtra en el cliente sobre estos tokens.
export const searchTokens = (term: string): string[] => {
  const norm = normalizeText(term);
  if (!norm) return [];
  const words = norm.split(" ").filter((w) => w.length >= MIN);
  return Array.from(new Set(words)).slice(0, 10);
};
