import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { getDays } from "@/services/reservations";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useUI } from "@/context/UIContext";
import { DayConfig } from "@/types/config";
import { DayConfigCard } from "@/components/configuracion/DayConfigCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Configuracion() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dayToCopy, setDayToCopy] = useState<DayConfig | null>(null);
  const { setLoading } = useUI();

  useEffect(() => {
    loadDays();
  }, []);

  const loadDays = async () => {
    setLoading(true);
    try {
      const snap = await getDays();
      const loadedDays = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          dia: data.dia || d.id,
          desde: data.desde || "09:00",
          hasta: data.hasta || "18:00",
          intervalo: data.intervalo || 30,
          activo: data.activo !== false
        } as DayConfig;
      });
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

  const handleSaveAll = async () => {
    const invalid = days.find(d => (d.desde || "09:00") >= (d.hasta || "18:00") || !d.intervalo);
    if (invalid) {
        toast.error(`Error en el día ${invalid.dia}: El horario o intervalo es inválido.`);
        return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      days.forEach(day => {
        const ref = doc(db, "turnos", day.id);
        batch.update(ref, {
          desde: day.desde || "09:00",
          hasta: day.hasta || "18:00",
          intervalo: day.intervalo || 30,
          activo: day.activo !== false
        });
      });

      await batch.commit();
      
      // Update local state and UI
      toast.success("Toda la configuración ha sido guardada");
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSingle = async (day: DayConfig) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const ref = doc(db, "turnos", day.id);
      
      const sanitizedDay = {
        desde: day.desde || "09:00",
        hasta: day.hasta || "18:00",
        intervalo: day.intervalo || 30,
        activo: day.activo !== false
      };

      batch.update(ref, sanitizedDay);
      await batch.commit();
      
      toast.success(`Configuración de ${day.dia} guardada`);
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const updateDayState = (id: string, field: keyof DayConfig, value: any) => {
    setDays(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    setHasChanges(true);
  };

  const handleApplyToAll = () => {
    if (!dayToCopy) return;
    
    setDays(prev => prev.map(d => ({
        ...d,
        desde: dayToCopy.desde || "09:00",
        hasta: dayToCopy.hasta || "18:00",
        intervalo: dayToCopy.intervalo || 30,
        activo: dayToCopy.activo !== false
    })));
    setHasChanges(true);
    setDayToCopy(null);
    toast.info("Configuración copiada a todos los días. No olvides guardar los cambios.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold">Configuración</h1>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent/20 animate-in fade-in zoom-in duration-300"
            >
              <Save className="w-4 h-4" />
              Guardar Todo
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {days.map((day) => (
            <DayConfigCard 
                key={day.id}
                day={day}
                onUpdate={updateDayState}
                onSave={handleSaveSingle}
                onApplyToAll={(d) => setDayToCopy(d)}
            />
            ))}
        </div>
      </div>

      <AlertDialog open={!!dayToCopy} onOpenChange={(open) => !open && setDayToCopy(null)}>
        <AlertDialogContent className="bg-card border-white/10 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Copiar configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción reemplazará los horarios e intervalos de <strong>todos los días</strong> con la configuración de <strong>{dayToCopy?.dia}</strong>. Los cambios solo se aplicarán permanentemente al presionar "Guardar Todo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-secondary/50 border-white/5 rounded-xl hover:bg-secondary/70">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApplyToAll}
              className="bg-accent text-accent-foreground rounded-xl hover:bg-accent/90"
            >
              Confirmar y Copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
