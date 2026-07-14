import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

// Parse/format en hora LOCAL para evitar el corrimiento de día que produce
// `new Date("YYYY-MM-DD")` (que interpreta el string como UTC).
function parseYmd(value?: string): Date | undefined {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DateSelector({ selectedDate, onDateChange, minDate, maxDate }: DateSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = parseYmd(selectedDate);
  const min = parseYmd(minDate);
  const max = parseYmd(maxDate);

  const disabled = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ];

  const label = selected
    ? (() => {
        const formatted = format(selected, "EEEE, d 'de' MMMM yyyy", { locale: es });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      })()
    : "Selecciona una fecha";

  const handleSelect = (date?: Date) => {
    if (!date) return;
    onDateChange(toYmd(date));
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium px-1">Selecciona una fecha</p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 bg-card border border-white/10 rounded-2xl px-4 py-3 text-left cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-accent hover:border-white/20",
              selected ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <CalendarIcon className="w-5 h-5 text-accent shrink-0" />
            <span className="font-medium">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-white/10" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected ?? min}
            disabled={disabled}
            startMonth={min}
            endMonth={max}
            locale={es}
            showOutsideDays={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
