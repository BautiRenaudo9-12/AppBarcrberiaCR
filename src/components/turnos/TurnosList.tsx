import { Slot } from "@/types/turnos";
import SlotCard from "./SlotCard";
import TurnosSkeleton from "./TurnosSkeleton";

interface TurnosListProps {
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

      <div className="space-y-2">
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