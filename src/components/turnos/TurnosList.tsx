import { Slot } from "@/types/turnos";
import SlotCard from "./SlotCard";

interface TurnosListProps {
  slots: Slot[];
  isAdmin: boolean;
  loading: boolean;
  onReserve: (slot: Slot) => void;
  onBlock: (slot: Slot) => void;
  onUnblock: (slot: Slot) => void;
  onActivate: (slot: Slot) => void;
  onRecurringAction: (slot: Slot) => void;
}

export default function TurnosList({ 
  slots, 
  isAdmin, 
  loading,
  onReserve, 
  onBlock, 
  onUnblock, 
  onActivate,
  onRecurringAction
}: TurnosListProps) {
  
  if (loading && slots.length === 0) {
      // Simple loading state
      return <div className="text-center py-10 text-muted-foreground">Cargando horarios...</div>;
  }

  if (slots.length === 0) {
    return (
        <div className="text-center py-8 text-muted-foreground text-sm">
            {isAdmin ? "No hay horarios configurados para este día." : "No hay horarios disponibles para esta fecha."}
        </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
       <div className="flex justify-between items-center px-1">
        <p className="text-xs text-muted-foreground font-medium">Horarios {isAdmin ? "del día" : "disponibles"}</p>
        {isAdmin && <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full border border-accent/20">Modo Admin</span>}
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
          />
        ))}
      </div>
    </div>
  );
}
