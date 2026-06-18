import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Slot } from "@/types/turnos";
import { useTurnos } from "@/hooks/useTurnos";
import DateSelector from "@/components/turnos/DateSelector";
import SlotCard from "@/components/turnos/SlotCard";
import TurnosSkeleton from "@/components/turnos/TurnosSkeleton";
import CancelDialog from "@/components/turnos/dialogs/CancelDialog";

export default function ListaTurnos() {
  const { selectedDate, setSelectedDate, slots, loading, cancelReservation } = useTurnos();
  const [slotToCancel, setSlotToCancel] = useState<Slot | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const reservedSlots = useMemo(
    () =>
      slots
        .filter((s) => s.status === "reserved")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [slots]
  );

  const onConfirmCancel = async () => {
    if (!slotToCancel?.appointment?.id) return;
    setCancelling(true);
    const success = await cancelReservation(slotToCancel.appointment.id);
    setCancelling(false);
    if (success) setSlotToCancel(null);
  };

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <div className="bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Lista de Turnos</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6 w-full">
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

        {loading && reservedSlots.length === 0 ? (
          <TurnosSkeleton />
        ) : reservedSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay turnos reservados para esta fecha.
          </div>
        ) : (
          <div className="space-y-2 pb-10">
            {reservedSlots.map((slot) => (
              <SlotCard
                key={slot.time}
                slot={slot}
                isAdmin
                cancelOnly
                onCancel={setSlotToCancel}
              />
            ))}
          </div>
        )}

        <CancelDialog
          open={!!slotToCancel}
          onClose={() => setSlotToCancel(null)}
          onConfirm={onConfirmCancel}
          loading={cancelling}
          slotTime={slotToCancel?.time}
          clientName={slotToCancel?.appointment?.clientName}
        />
      </div>
    </div>
  );
}
