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
  /** Link wa.me pre-armado para contactar al cliente por WhatsApp (solo admin). */
  whatsappHref?: string;
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
  whatsappHref,
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

            {slot.outOfSchedule && isAdmin && (
              <span
                className="text-[10px] bg-white/10 text-muted-foreground px-1.5 rounded shrink-0"
                title="Este turno quedó fuera del horario configurado para el día"
              >
                Fuera de horario
              </span>
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

        {whatsappHref && slot.status === "reserved" && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.582 0 11.94-5.359 11.944-11.893a11.821 11.821 0 00-3.421-8.452z" />
            </svg>
          </a>
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