import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { Slot } from "@/types/turnos";
import SlotCard from "./SlotCard";
import TurnosSkeleton from "./TurnosSkeleton";

interface TurnosListProps {
  selectedDate: string;
  slots: Slot[];
  isAdmin: boolean;
  loading: boolean;
  onReserve: (slot: Slot) => void;
  onBlock: (slot: Slot) => void;
  onUnblock: (slot: Slot) => void;
  onActivate: (slot: Slot) => void;
  onRecurringAction: (slot: Slot) => void;
  onCancel: (slot: Slot) => void;
}

export default function TurnosList({
  selectedDate,
  slots,
  isAdmin,
  loading,
  onReserve,
  onBlock,
  onUnblock,
  onActivate,
  onRecurringAction,
  onCancel,
}: TurnosListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const lastAnimatedDateRef = useRef<string | null>(null);
  const wasLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  // Revertir el contexto GSAP sólo al desmontar (no en cada cambio de deps),
  // así un refresco de la misma fecha no interrumpe la animación en vuelo.
  useLayoutEffect(() => () => ctxRef.current?.revert(), []);

  useLayoutEffect(() => {
    // Mientras carga sólo recordamos que hubo un ciclo de carga: la entrada
    // se anima recién cuando llega la data fresca (evita animar slots viejos).
    if (loading) {
      wasLoadingRef.current = true;
      return;
    }

    if (!listRef.current) return;
    const children = Array.from(listRef.current.children);
    if (children.length === 0) {
      wasLoadingRef.current = false;
      return;
    }

    const justLoaded = wasLoadingRef.current;
    wasLoadingRef.current = false;
    const dateChanged = lastAnimatedDateRef.current !== selectedDate;
    lastAnimatedDateRef.current = selectedDate;

    // Primera carga al entrar a la página: la entrada la maneja TransitionManager
    // (la página entra como bloque). No staggeamos las cards para no encimar.
    if (!hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      return;
    }

    // Sólo animamos al cambiar de fecha con data fresca. Los refrescos de la
    // misma fecha (suscripciones, acciones admin) no re-disparan el stagger.
    if (!dateChanged || !justLoaded) return;

    if (prefersReducedMotion()) return;

    ctxRef.current?.revert();
    ctxRef.current = gsap.context(() => {
      gsap.fromTo(
        children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
          ease: "power2.out",
        }
      );
    }, listRef.current);
  }, [selectedDate, slots, loading]);

  if (loading && slots.length === 0) {
    return <TurnosSkeleton />;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm animate-in fade-in-0 zoom-in-95 duration-300">
        {isAdmin
          ? "No hay horarios configurados para este día."
          : "No hay horarios disponibles para esta fecha."}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      <div className="flex justify-between items-center px-1">
        <p className="text-xs text-muted-foreground font-medium">
          Horarios {isAdmin ? "del día" : "disponibles"}
        </p>
      </div>

      <div ref={listRef} className="space-y-2">
        {slots.map((slot) => (
          <SlotCard
            key={slot.time}
            slot={slot}
            isAdmin={isAdmin}
            onReserve={onReserve}
            onBlock={onBlock}
            onUnblock={onUnblock}
            onActivate={onActivate}
            onRecurringAction={onRecurringAction}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
}