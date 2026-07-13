import { memo } from "react";
import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@/types/turnos";
import { Switch } from "@/components/ui/switch";
import { usePressScale } from "@/hooks/usePressScale";

interface SlotCardProps {
  slot: Slot;
  isAdmin: boolean;
  onReserve?: (slot: Slot) => void;
  onBlock?: (slot: Slot) => void;
  onUnblock?: (slot: Slot) => void;
  onActivate?: (slot: Slot) => void;
  onRecurringAction?: (slot: Slot) => void;
  onCancel: (slot: Slot) => void;
  /** Modo "solo cancelar": oculta el switch de bloqueo y el botón Reservar. */
  cancelOnly?: boolean;
}

function SlotCard({
  slot,
  isAdmin,
  onReserve,
  onBlock,
  onUnblock,
  onActivate,
  onRecurringAction,
  onCancel,
  cancelOnly = false,
}: SlotCardProps) {
  const { ref: reserveBtnRef, ...reservePress } = usePressScale(0.93);
  const { ref: cancelBtnRef, ...cancelPress } = usePressScale(0.93);

  const isAvailable = slot.status !== "blocked";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (slot.blockedRule?.type === "recurring") {
        onRecurringAction?.(slot);
      } else {
        onUnblock?.(slot);
      }
    } else {
      onBlock?.(slot);
    }
  };

  return (
    <div
      className={cn(
        "bg-card border border-white/10 rounded-xl p-3 flex items-center justify-between transition-all duration-200",
        slot.status === "blocked" &&
          "bg-secondary/10 border-dashed border-destructive/40",
        slot.status === "reserved" && "hover:border-white/20",
        slot.isException && isAdmin && "border-accent/30 hover:border-accent/50",
        slot.status === "free" && !slot.isException && "hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            slot.status === "blocked" ? "bg-destructive/15" : "bg-accent/20",
            slot.isException && isAdmin && "bg-accent/15"
          )}
        >
          {slot.status !== "blocked" && (
            <Clock
              className={cn(
                "w-5 h-5 text-accent",
                slot.isException && isAdmin && "text-accent"
              )}
            />
          )}
          {slot.status === "blocked" && (
            <Lock className="w-5 h-5 text-destructive" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-semibold text-lg",
              slot.status === "blocked" && "text-muted-foreground"
            )}
          >
            {slot.time}
          </p>
          <div className="flex items-center gap-2 min-w-0">
            {slot.isException && isAdmin && (
              <span className="text-xs font-semibold text-accent">Sobreturno</span>
            )}

            {slot.status === "reserved" && (
              <p className="text-sm font-medium text-accent truncate">
                {isAdmin ? slot.appointment?.clientName || "Cliente" : "Reservado"}
              </p>
            )}

            {slot.blockedRule?.type === "recurring" && !slot.isException && (
              <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 rounded">
                Recurrente
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {isAdmin && !cancelOnly && (
          <Switch
            checked={isAvailable}
            onCheckedChange={handleToggle}
            aria-label={isAvailable ? "Bloquear horario" : "Desbloquear horario"}
            className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-destructive/70"
          />
        )}

        {!cancelOnly && (slot.status === "free" || (isAdmin && slot.status === "blocked")) && (
          <button
            ref={reserveBtnRef}
            onClick={() => onReserve?.(slot)}
            {...reservePress}
            className={cn(
              "rounded-full font-medium transition-colors bg-accent/30 text-white hover:bg-accent min-w-[5.5rem] text-center",
              isAdmin ? "px-3 py-1 text-xs" : "px-6 py-2 text-sm"
            )}
          >
            Reservar
          </button>
        )}

        {isAdmin && slot.status === "reserved" && (
          <button
            ref={cancelBtnRef}
            onClick={() => onCancel(slot)}
            {...cancelPress}
            className="rounded-full font-medium transition-colors bg-destructive/30 text-white hover:bg-destructive min-w-[5.5rem] text-center px-3 py-1 text-xs"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(SlotCard);