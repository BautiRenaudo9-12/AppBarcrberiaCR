import { memo } from "react";
import { Clock, Lock, Unlock, CalendarCheck, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@/types/turnos";

interface SlotCardProps {
  slot: Slot;
  isAdmin: boolean;
  onReserve: (slot: Slot) => void;
  onBlock: (slot: Slot) => void;
  onUnblock: (slot: Slot) => void;
  onActivate: (slot: Slot) => void;
}

function SlotCard({ 
  slot, 
  isAdmin, 
  onReserve, 
  onBlock, 
  onUnblock, 
  onActivate 
}: SlotCardProps) {
  return (
    <div
      className={cn(
        "bg-card border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all duration-200",
        slot.status === 'blocked' && "opacity-75 bg-secondary/10 border-dashed",
        slot.status === 'reserved' && "border-accent/20 bg-accent/5",
        slot.isException && isAdmin && "bg-green-500/10 border-green-500/20 hover:border-green-500/40",
        slot.status === 'free' && (!slot.isException || !isAdmin) && "hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            slot.status === 'free' ? "bg-accent/20" : 
            slot.status === 'reserved' ? "bg-orange-500/20" : "bg-red-500/20",
            slot.isException && isAdmin && "bg-green-500/20"
        )}>
          {slot.status === 'free' && <Clock className={cn("w-5 h-5", slot.isException && isAdmin ? "text-green-600" : "text-accent")} />}
          {slot.status === 'reserved' && <CalendarCheck className="w-5 h-5 text-orange-500" />}
          {slot.status === 'blocked' && <Lock className="w-5 h-5 text-red-500" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-lg", slot.status === 'blocked' && "text-muted-foreground line-through")}>
            {slot.time}
          </p>
          <div className="flex items-center gap-2">
            <p className={cn(
                "text-xs font-medium truncate",
                slot.status === 'free' ? "text-muted-foreground" :
                slot.status === 'reserved' ? "text-orange-500" : "text-red-500",
                slot.isException && isAdmin && "text-green-600 font-semibold"
            )}>
                {slot.status === 'free' ? ((slot.isException && isAdmin) ? "Sobreturno Activado" : "Disponible") :
                slot.status === 'reserved' ? (isAdmin ? `Reservado: ${slot.appointment?.clientName || 'Cliente'}` : "Reservado") : 
                "Bloqueado"}
            </p>
            
            {slot.blockedRule?.type === 'recurring' && !slot.isException && (
                <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">
                    Recurrente
                </span>
            )}

          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
            <>
                {slot.status === 'free' && (
                    <button 
                        onClick={() => onBlock(slot)}
                        className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                        title="Bloquear horario"
                    >
                        <Lock className="w-4 h-4" />
                    </button>
                )}
                 {slot.status === 'blocked' && (
                    <div className="flex gap-1">
                        {/* Sobreturno Button (Activate Exception) */}
                        <button 
                            onClick={() => onActivate(slot)}
                            className="p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent transition-colors"
                            title="Activar Turno (Excepción para hoy)"
                        >
                            <Power className="w-4 h-4" />
                        </button>

                        {/* Unlock Button (Delete Rule) */}
                        {slot.blockedRule && (
                            <button 
                                onClick={() => onUnblock(slot)}
                                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
                                title="Eliminar regla de bloqueo"
                            >
                                <Unlock className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </>
        )}

        {(slot.status === 'free') && (
            <button 
                onClick={() => onReserve(slot)}
                className="px-6 py-2 rounded-full text-sm font-medium transition-colors bg-green-600/30 text-white hover:bg-green-600 shadow-sm"
            >
                Reservar
            </button>
        )}
        
         {isAdmin && slot.status === 'reserved' && (
            <div className="px-3 py-1 bg-orange-500/10 text-orange-500 text-xs font-medium rounded-full">
               Ocupado
            </div>
        )}
      </div>
    </div>
  );
}

export default memo(SlotCard);