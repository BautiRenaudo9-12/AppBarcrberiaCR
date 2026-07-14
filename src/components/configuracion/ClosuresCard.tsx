import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarOff, Plane, Trash2, Plus } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  addClosure,
  deleteClosure,
  subscribeToClosures,
  Closure,
} from "@/services/closures";

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Formatea "YYYY-MM-DD" a algo legible sin el corrimiento de zona de `new Date(str)`.
function prettyYmd(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return format(date, "d 'de' MMM yyyy", { locale: es });
}

// Sección de "Cerrar por rango" (vacaciones) en Configuración. El admin elige un rango de
// fechas y bloquea todos los turnos de esos días. El cartel visible al cliente se maneja
// aparte con los anuncios.
export function ClosuresCard() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToClosures(setClosures);
    return () => unsub();
  }, []);

  // Selección del rango, totalmente controlada (ignoramos el cálculo interno de
  // react-day-picker y sólo usamos el día clickeado, 2do arg de onSelect):
  //  - sin inicio, o con un rango ya completo → un click arranca de nuevo desde ese día
  //    (así reelegir la fecha inicial es un solo click, sin "deshacer" el rango previo);
  //  - con inicio pero sin fin → ese click cierra el rango (ordenando inicio/fin).
  const handleRangeSelect = (_next: DateRange | undefined, selectedDay: Date) => {
    setRange((prev) => {
      if (!prev?.from || (prev.from && prev.to)) {
        return { from: selectedDay, to: undefined };
      }
      return selectedDay < prev.from
        ? { from: selectedDay, to: prev.from }
        : { from: prev.from, to: selectedDay };
    });
  };

  const handleAdd = async () => {
    if (!range?.from) {
      toast.error("Elegí al menos una fecha de inicio.");
      return;
    }
    const start = toYmd(range.from);
    const end = toYmd(range.to ?? range.from); // rango de un solo día si no hay 'to'
    setSaving(true);
    try {
      await addClosure(start, end);
      toast.success("Cierre agregado");
      setRange(undefined);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo agregar el cierre.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteClosure(id);
      toast.success("Cierre eliminado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el cierre.");
    }
  };

  const rangeLabel = range?.from
    ? range.to && toYmd(range.to) !== toYmd(range.from)
      ? `${prettyYmd(toYmd(range.from))} → ${prettyYmd(toYmd(range.to))}`
      : prettyYmd(toYmd(range.from))
    : "Elegí las fechas";

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent shrink-0">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold">Cerrar por rango</p>
          <p className="text-xs text-muted-foreground">
            Bloqueá todos los turnos entre dos fechas (ej. vacaciones).
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center gap-3 bg-secondary/20 border border-white/10 rounded-xl px-4 py-3 text-left transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <CalendarOff className="w-5 h-5 text-accent shrink-0" />
              <span className="font-medium text-sm">{rangeLabel}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-white/10" align="start">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              defaultMonth={range?.from}
              locale={es}
              showOutsideDays={false}
              classNames={{
                // "Hoy" sin relleno verde: solo borde (cuando no está seleccionado; al
                // entrar en el rango, las clases de selección lo pintan igual).
                today: "border border-accent/70 text-foreground rounded-md",
              }}
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={handleAdd}
          disabled={!range?.from || saving}
          className="bg-accent text-accent-foreground px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {saving ? "..." : "Bloquear"}
        </button>
      </div>

      {closures.length > 0 && (
        <div className="space-y-2 pt-1">
          {closures.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 bg-secondary/10 border border-white/5 rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CalendarOff className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">
                  {c.startDate === c.endDate
                    ? prettyYmd(c.startDate)
                    : `${prettyYmd(c.startDate)} → ${prettyYmd(c.endDate)}`}
                </span>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                aria-label="Eliminar cierre"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
