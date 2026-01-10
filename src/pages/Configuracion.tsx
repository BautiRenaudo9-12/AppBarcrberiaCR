import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Clock, CalendarDays } from "lucide-react";
import { getDays } from "@/services/reservations";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useUI } from "@/context/UIContext";

interface DayConfig {
  id: string; // "lunes", "martes", etc.
  dia: string;
  desde?: string;
  hasta?: string;
  intervalo?: number;
  activo?: boolean;
}

import { regenerateSlots } from "@/services/admin";

export default function Configuracion() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const { setLoading } = useUI();

  useEffect(() => {
    loadDays();
  }, []);

  const loadDays = async () => {
    setLoading(true);
    try {
      const snap = await getDays();
      const loadedDays = snap.docs.map(d => ({ id: d.id, ...d.data() } as DayConfig));
      // Sort by index if available, or predefined order
      const sorter = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
      loadedDays.sort((a, b) => sorter.indexOf(a.id) - sorter.indexOf(b.id));
      setDays(loadedDays);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (day: DayConfig) => {
    setLoading(true);
    try {
      // Ensure defaults to avoid "undefined" error in Firebase
      const sanitizedDay = {
        ...day,
        desde: day.desde || "09:00",
        hasta: day.hasta || "18:00",
        intervalo: day.intervalo || 30,
        activo: day.activo !== false // Default to true if undefined
      };

      // 1. Update metadata
      await updateDoc(doc(db, "turnos", day.id), {
        desde: sanitizedDay.desde,
        hasta: sanitizedDay.hasta,
        intervalo: sanitizedDay.intervalo,
        activo: sanitizedDay.activo
      });
      
      // 2. Regenerate actual slots
      const result = await regenerateSlots(sanitizedDay);
      
      toast.success(`Configuración guardada: +${result.created} / -${result.deleted} slots`);
      
      if (result.skipped > 0) {
        toast.warning(`${result.skipped} slots no se borraron por tener reservas activas.`);
      }

      // Update local state to reflect defaults
      setDays(prev => prev.map(d => d.id === day.id ? sanitizedDay : d));
      
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const updateDayState = (id: string, field: keyof DayConfig, value: any) => {
    setDays(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Configuración de Horarios</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
            <div key={day.id} className="bg-card border border-white/10 rounded-3xl overflow-hidden shadow-sm hover:border-white/20 transition-all group">
              {/* Card Header */}
              <div className="bg-white/5 px-5 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <span className="font-semibold capitalize text-lg">{day.dia}</span>
                </div>
                {/* Toggle Switch (Visual placeholder using checkbox for now) */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={day.activo !== false} // Default to true if undefined
                    onChange={(e) => updateDayState(day.id, 'activo', e.target.checked)}
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
                      value={day.desde || "09:00"}
                      onChange={(e) => updateDayState(day.id, 'desde', e.target.value)}
                      className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Fin
                    </label>
                    <input
                      type="time"
                      value={day.hasta || "18:00"}
                      onChange={(e) => updateDayState(day.id, 'hasta', e.target.value)}
                      className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Intervalo (minutos)</label>
                  <input
                    type="number"
                    value={day.intervalo || 30}
                    onChange={(e) => updateDayState(day.id, 'intervalo', parseInt(e.target.value))}
                    className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-accent outline-none text-center font-medium"
                  />
                </div>

                <button
                  onClick={() => handleSave(day)}
                  className="w-full bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
