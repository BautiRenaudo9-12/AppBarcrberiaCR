import { memo, useRef, useEffect } from "react";
import { Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slot } from "@/types/turnos";
import { Switch } from "@/components/ui/switch";
import gsap from "gsap";

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
  onRecurringAction,
}: SlotCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reserveBtnRef = useRef<HTMLButtonElement>(null);
  const prevStatusRef = useRef(slot.status);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (prevStatusRef.current !== slot.status && cardRef.current) {
      prevStatusRef.current = slot.status;

      gsap.fromTo(
        cardRef.current,
        { scale: 1.03 },
        { scale: 1, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [slot.status]);

  const isAvailable = slot.status !== "blocked";

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (slot.blockedRule?.type === "recurring") {
        onRecurringAction(slot);
      } else {
        onUnblock(slot);
      }
    } else {
      onBlock(slot);
    }
  };

  const handleReserveDown = () => {
    if (reserveBtnRef.current) {
      gsap.to(reserveBtnRef.current, { scale: 0.93, duration: 0.1 });
    }
  };

  const handleReserveUp = () => {
    if (reserveBtnRef.current) {
      gsap.to(reserveBtnRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "back.out(2)",
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-card border border-white/10 rounded-xl p-3 flex items-center justify-between transition-all duration-200",
        slot.status === "blocked" &&
          "opacity-60 bg-secondary/10 border-dashed border-destructive/30",
        slot.status === "reserved" && "hover:border-white/20",
        slot.isException && isAdmin && "border-accent/30 hover:border-accent/50",
        slot.status === "free" && !slot.isException && "hover:border-white/20"
      )}
    >
      <div className="flex items-center gap-3 flex-1">
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
          <div className="flex items-center gap-2">
            {slot.isException && isAdmin && (
              <span className="text-xs font-semibold text-accent">Sobreturno</span>
            )}

            {slot.status === "reserved" && (
              <p className="text-xs font-medium text-accent truncate">
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
        {isAdmin && (
          <Switch
            checked={isAvailable}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-accent"
          />
        )}

        {(slot.status === "free" || (isAdmin && slot.status === "blocked")) && (
          <button
            ref={reserveBtnRef}
            onClick={() => onReserve(slot)}
            onPointerDown={handleReserveDown}
            onPointerUp={handleReserveUp}
            onPointerLeave={handleReserveUp}
            className={cn(
              "rounded-full font-medium transition-colors bg-accent/30 text-white hover:bg-accent",
              isAdmin ? "px-3 py-1 text-xs" : "px-6 py-2 text-sm"
            )}
          >
            Reservar
          </button>
        )}

        {isAdmin && slot.status === "reserved" && (
          <div className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
            Ocupado
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SlotCard);