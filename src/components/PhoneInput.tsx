import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, parsePhone, formatPhone } from "@/lib/countries";

interface PhoneInputProps {
  // Valor combinado internacional (ej. "+54 11 2345 6789"). Puede venir vacío o legacy.
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  onEnter?: () => void;
}

// Selector de código de país (default Argentina) + input del número local. Combina ambos
// en un único string internacional que se guarda en `nro`. Ver src/lib/countries.ts.
// Usa un <select> nativo a propósito: sin dependencias extra y con mejor picker en mobile.
export default function PhoneInput({
  value,
  onChange,
  id,
  required,
  autoFocus,
  className,
  onEnter,
}: PhoneInputProps) {
  const { country, local } = useMemo(() => parsePhone(value), [value]);

  const handleCountryChange = (code: string) => {
    const next = COUNTRIES.find((c) => c.code === code) || DEFAULT_COUNTRY;
    onChange(formatPhone(next, local));
  };

  const handleLocalChange = (nextLocal: string) => {
    onChange(formatPhone(country, nextLocal));
  };

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <div className="relative shrink-0">
        <select
          aria-label="Código de país"
          value={country.code}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="h-12 w-[6.5rem] appearance-none rounded-xl border border-input bg-background pl-3 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} +{c.dial}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      </div>

      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required={required}
        autoFocus={autoFocus}
        value={local}
        onChange={(e) => handleLocalChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter();
        }}
        placeholder="11 2345 6789"
        className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}
