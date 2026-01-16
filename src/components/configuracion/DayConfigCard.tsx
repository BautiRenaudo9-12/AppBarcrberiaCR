import { Clock, CalendarDays, Save, Copy } from "lucide-react";
import { DayConfig } from "@/types/config";

interface DayConfigCardProps {
  day: DayConfig;
  onUpdate: (id: string, field: keyof DayConfig, value: any) => void;
  onSave: (day: DayConfig) => void;
  onApplyToAll?: (day: DayConfig) => void;
}

export function DayConfigCard({ day, onUpdate, onSave, onApplyToAll }: DayConfigCardProps) {
  // Local validation for intervals
  const handleIntervalChange = (val: string) => {
    const num = parseInt(val);
    if (isNaN(num)) {
        onUpdate(day.id, 'intervalo', "");
        return;
    }
    onUpdate(day.id, 'intervalo', Math.max(1, num)); // Min 1 minute
  };

  const isInvalidRange = (day.desde || "09:00") >= (day.hasta || "18:00");

  return (
    <div className="bg-card border border-white/10 rounded-3xl overflow-hidden shadow-sm hover:border-white/20 transition-all group">
      {/* Card Header */}
      <div className="bg-white/5 px-5 py-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
            <CalendarDays className="w-4 h-4" />
          </div>
          <span className="font-semibold capitalize text-lg">{day.dia}</span>
        </div>
        {/* Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={day.activo !== false}
            onChange={(e) => onUpdate(day.id, 'activo', e.target.checked)}
            className="sr-only peer" 
          />
          <div className="w-9 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
        </label>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Inicio
            </label>
            <input
              type="time"
              value={day.desde ?? ""}
              onChange={(e) => onUpdate(day.id, 'desde', e.target.value)}
              className={`w-full bg-secondary/20 border ${isInvalidRange ? 'border-destructive/50' : 'border-white/10'} rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium transition-colors`}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Fin
            </label>
            <input
              type="time"
              value={day.hasta ?? ""}
              onChange={(e) => onUpdate(day.id, 'hasta', e.target.value)}
              className={`w-full bg-secondary/20 border ${isInvalidRange ? 'border-destructive/50' : 'border-white/10'} rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium transition-colors`}
            />
          </div>
        </div>

        {isInvalidRange && (
            <p className="text-[10px] text-destructive text-center font-medium">La hora de inicio debe ser menor a la de fin</p>
        )}

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Intervalo (minutos)</label>
          <input
            type="number"
            min="1"
            value={day.intervalo ?? ""}
            onChange={(e) => handleIntervalChange(e.target.value)}
            className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium"
          />
        </div>

        <div className="grid grid-cols-5 gap-2 mt-2">
            <button
                onClick={() => onSave(day)}
                disabled={isInvalidRange || !day.intervalo}
                className="col-span-4 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Save className="w-4 h-4" />
                Guardar
            </button>
            <button
                onClick={() => onApplyToAll?.(day)}
                title="Aplicar a todos los días"
                className="col-span-1 bg-secondary/30 hover:bg-secondary/50 text-foreground border border-white/5 rounded-xl py-2 flex items-center justify-center transition-colors"
            >
                <Copy className="w-4 h-4" />
            </button>
        </div>
      </div>
    </div>
  );
}
