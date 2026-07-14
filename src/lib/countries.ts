// Lista curada de países para el selector de código de teléfono. Argentina va primero
// porque es el default de la barbería. `dial` es el código de país sin el "+".
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", dial: "54", flag: "🇦🇷" },
  { code: "UY", name: "Uruguay", dial: "598", flag: "🇺🇾" },
  { code: "CL", name: "Chile", dial: "56", flag: "🇨🇱" },
  { code: "BR", name: "Brasil", dial: "55", flag: "🇧🇷" },
  { code: "PY", name: "Paraguay", dial: "595", flag: "🇵🇾" },
  { code: "BO", name: "Bolivia", dial: "591", flag: "🇧🇴" },
  { code: "PE", name: "Perú", dial: "51", flag: "🇵🇪" },
  { code: "US", name: "Estados Unidos", dial: "1", flag: "🇺🇸" },
  { code: "ES", name: "España", dial: "34", flag: "🇪🇸" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Argentina

// Busca el país que corresponde a un número internacional guardado (`+54 11 ...`).
// Prueba los dial más largos primero para no confundir "54" con "598". Devuelve el país
// y el resto (número local) ya separado. Si no matchea ninguno, asume el default (AR) y
// deja el valor completo como número local — así los `nro` legacy sin prefijo siguen
// tratándose como Argentina.
export function parsePhone(value?: string | null): { country: Country; local: string } {
  const raw = (value || "").trim();
  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    // Ordenar por dial más largo primero.
    const byLength = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    for (const country of byLength) {
      if (digits.startsWith(country.dial)) {
        return { country, local: digits.slice(country.dial.length) };
      }
    }
  }
  return { country: DEFAULT_COUNTRY, local: raw };
}

// Arma el valor internacional que se guarda en `nro`. Si no hay número local, devuelve "".
export function formatPhone(country: Country, local: string): string {
  const localDigits = local.replace(/\D/g, "");
  if (!localDigits) return "";
  return `+${country.dial} ${localDigits}`;
}
