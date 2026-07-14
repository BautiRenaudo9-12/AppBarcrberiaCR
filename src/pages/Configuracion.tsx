import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, CalendarRange } from "lucide-react";
import { useConfigAnimations } from "@/hooks/useConfigAnimations";
import { getDays, DAYS_META } from "@/services/reservations";
import { updateBookingConfig } from "@/services/config";
import { useBookingConfig } from "@/hooks/useBookingConfig";
import { useQueryClient } from "@tanstack/react-query";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useUI } from "@/context/UIContext";
import { DayConfig } from "@/types/config";
import { DayConfigCard } from "@/components/configuracion/DayConfigCard";
import ConfigSkeleton from "@/components/configuracion/ConfigSkeleton";
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
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import PageTitle from "@/components/PageTitle";

export default function Configuracion() {
  const [days, setDays] = useState<DayConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dayToCopy, setDayToCopy] = useState<DayConfig | null>(null);
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const { setLoading } = useUI();
  const pageRef = useConfigAnimations(isLoadingDays);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const prevHasChanges = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Rango máximo de días de reserva (config global).
  const queryClient = useQueryClient();
  const { data: bookingConfig } = useBookingConfig();
  const [maxDaysInput, setMaxDaysInput] = useState<string>("");
  const [savingMaxDays, setSavingMaxDays] = useState(false);

  useEffect(() => {
    if (bookingConfig) setMaxDaysInput(String(bookingConfig.maxDays));
  }, [bookingConfig]);

  const maxDaysChanged =
    bookingConfig != null && maxDaysInput !== "" && Number(maxDaysInput) !== bookingConfig.maxDays;

  const handleSaveMaxDays = async () => {
    const value = Number(maxDaysInput);
    if (!Number.isFinite(value) || value < 1 || value > 60) {
      toast.error("El rango debe ser un número entre 1 y 60 días.");
      return;
    }
    setSavingMaxDays(true);
    try {
      await updateBookingConfig(value);
      await queryClient.invalidateQueries({ queryKey: ["config", "booking"] });
      toast.success("Rango de reserva actualizado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el rango de reserva.");
    } finally {
      setSavingMaxDays(false);
    }
  };

  useEffect(() => {
    loadDays();
  }, []);

  useEffect(() => {
    if (!saveBtnRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(saveBtnRef.current, hasChanges ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 });
      prevHasChanges.current = hasChanges;
      return;
    }

    if (hasChanges && !prevHasChanges.current) {
      gsap.fromTo(saveBtnRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
    } else if (!hasChanges && prevHasChanges.current) {
      gsap.to(saveBtnRef.current, { scale: 0, opacity: 0, duration: 0.2, ease: "power2.in" });
    }
    prevHasChanges.current = hasChanges;
  }, [hasChanges]);

  const loadDays = async () => {
    // Sin overlay global en la entrada: el ConfigSkeleton (isLoadingDays) cubre el
    // loading in-place, consistente con el resto de las páginas.
    try {
      const snap = await getDays();
      const byId = new Map(snap.docs.map(d => [d.id, d.data()]));
      // Mostramos siempre los 7 días (lunes → domingo). Si el doc de un día todavía no
      // existe en Firestore (p. ej. sábado/domingo recién agregados), aparece con valores
      // por defecto y desactivado; se crea al guardarlo.
      const loadedDays = DAYS_META.map(meta => {
        const data = byId.get(meta.id);
        return {
          id: meta.id,
          dia: (data?.dia as string) || meta.dia,
          desde: (data?.desde as string) || "09:00",
          hasta: (data?.hasta as string) || "18:00",
          intervalo: (data?.intervalo as number) || 30,
          activo: data ? data.activo !== false : false
        } as DayConfig;
      });
      setDays(loadedDays);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar configuraciones");
    } finally {
      setIsLoadingDays(false);
    }
  };

  const flashCards = useCallback((borderColor: string) => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll("[data-card]");
    if (cards.length === 0) return;
    gsap.fromTo(
      cards,
      { borderColor },
      { borderColor: "rgba(255,255,255,0.1)", duration: 0.8, ease: "power2.out", stagger: 0.03 }
    );
  }, []);

  const handleSaveAll = async () => {
    const invalid = days.find(d => (d.desde || "09:00") >= (d.hasta || "18:00") || !d.intervalo);
    if (invalid) {
        toast.error(`Error en el día ${invalid.dia}: El horario o intervalo es inválido.`);
        flashCards("rgba(255,69,58,0.5)");
        return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      days.forEach(day => {
        const ref = doc(db, "turnos", day.id);
        // set + merge para crear el doc si aún no existe (sábado/domingo). Incluimos
        // `dia` e `index` para que la query `orderBy("index")` de getDays lo devuelva.
        const meta = DAYS_META.find(m => m.id === day.id);
        batch.set(ref, {
          dia: day.dia,
          ...(meta ? { index: meta.index } : {}),
          desde: day.desde || "09:00",
          hasta: day.hasta || "18:00",
          intervalo: day.intervalo || 30,
          activo: day.activo !== false
        }, { merge: true });
      });

      await batch.commit();
      
      toast.success("Toda la configuración ha sido guardada");
      setHasChanges(false);
      flashCards("rgba(48,209,88,0.5)");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllDown = () => {
    if (prefersReducedMotion()) return;
    if (saveBtnRef.current) {
      gsap.to(saveBtnRef.current, { scale: 0.95, duration: 0.1 });
    }
  };

  const handleSaveAllUp = () => {
    if (saveBtnRef.current) {
      gsap.to(saveBtnRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });
    }
  };

  const handleSaveSingle = async (day: DayConfig) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const ref = doc(db, "turnos", day.id);
      const meta = DAYS_META.find(m => m.id === day.id);

      // set + merge para crear el doc si aún no existe (sábado/domingo). Incluimos
      // `dia` e `index` para que la query `orderBy("index")` de getDays lo devuelva.
      const sanitizedDay = {
        dia: day.dia,
        ...(meta ? { index: meta.index } : {}),
        desde: day.desde || "09:00",
        hasta: day.hasta || "18:00",
        intervalo: day.intervalo || 30,
        activo: day.activo !== false
      };

      batch.set(ref, sanitizedDay, { merge: true });
      await batch.commit();
      
      toast.success(`Configuración de ${day.dia} guardada`);

      if (gridRef.current) {
        const card = gridRef.current.querySelector(`[data-card-id="${day.id}"]`);
        if (card) {
          gsap.fromTo(
            card,
            { borderColor: "rgba(48,209,88,0.5)" },
            { borderColor: "rgba(255,255,255,0.1)", duration: 0.8, ease: "power2.out" }
          );
        }
      }
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
    <div ref={pageRef} className="h-dvh bg-background text-foreground flex flex-col">
      <div className="bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <PageTitle className="text-2xl font-bold">Configuración</PageTitle>
          </div>
          
          <button
            ref={saveBtnRef}
            onClick={handleSaveAll}
            onPointerDown={handleSaveAllDown}
            onPointerUp={handleSaveAllUp}
            onPointerLeave={handleSaveAllUp}
            style={!hasChanges ? { scale: 0, opacity: 0 } : undefined}
            className="bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <Save className="w-4 h-4" />
            Guardar Todo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-5xl mx-auto px-4 py-8 pb-20 sm:px-6 space-y-8 w-full">
        {/* Ventana de reserva: rango máximo de días hacia adelante */}
        <div className="bg-card border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent shrink-0">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">Ventana de reserva</p>
              <p className="text-xs text-muted-foreground">
                Cuántos días hacia adelante puede reservar un cliente (además de hoy).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={60}
              value={maxDaysInput}
              onChange={(e) => setMaxDaysInput(e.target.value)}
              className="w-20 bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 text-center text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            />
            <span className="text-sm text-muted-foreground">días</span>
            <button
              onClick={handleSaveMaxDays}
              disabled={!maxDaysChanged || savingMaxDays}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {savingMaxDays ? "..." : "Guardar"}
            </button>
          </div>
        </div>

        {isLoadingDays ? (
          <ConfigSkeleton />
        ) : (
          <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        )}
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