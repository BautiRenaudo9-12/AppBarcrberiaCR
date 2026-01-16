import { memo } from "react";
import { Clock, Lock, CalendarCheck, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@/types/turnos";
import { Switch } from "@/components/ui/switch";

interface SlotCardProps {
  slot: Slot;
  isAdmin: boolean;
  onReserve: (slot: Slot) => void;
  onBlock: (slot: Slot) => void;
  onUnblock: (slot: Slot) => void;
  onActivate: (slot: Slot) => void;
  onRecurringAction: (slot: Slot) => void;
}

function SlotCard({ 
  slot, 
  isAdmin, 
  onReserve, 
  onBlock, 
  onUnblock, 
  onActivate,
  onRecurringAction
}: SlotCardProps) {

  const isAvailable = slot.status !== 'blocked';

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Trying to OPEN the slot
      if (slot.blockedRule?.type === 'recurring') {
         // Ask user what to do with recurring block
         onRecurringAction(slot);
      } else {
         // If it's a manual block, we just remove it
         onUnblock(slot);
      }
    } else {
      // Trying to CLOSE the slot
      onBlock(slot);
    }
  };

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
          <p className={cn("font-semibold text-lg", slot.status === 'blocked' && "text-muted-foreground")}>
            {slot.time}
          </p>
          <div className="flex items-center gap-2">
            
            {/* Solo mostrar si es Sobreturno o Reservado */}
            {slot.isException && isAdmin && (
                <span className="text-xs font-semibold text-green-600">
                    Sobreturno
                </span>
            )}

            {slot.status === 'reserved' && (
                <p className="text-xs font-medium text-orange-500 truncate">
                   {isAdmin ? (slot.appointment?.clientName || 'Cliente') : 'Reservado'}
                </p>
            )}
            
            {slot.blockedRule?.type === 'recurring' && !slot.isException && (
                <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 rounded">
                    Recurrente
                </span>
            )}

          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
            <Switch 
                checked={isAvailable}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-green-600"
            />
        )}

        {(slot.status === 'free' || (isAdmin && slot.status === 'blocked')) && (
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