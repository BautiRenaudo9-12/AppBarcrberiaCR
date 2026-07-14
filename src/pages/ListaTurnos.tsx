import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import moment from "moment";
import { Slot } from "@/types/turnos";
import { useTurnos } from "@/hooks/useTurnos";
import { getClientsPhones } from "@/services/users";
import { toWhatsappNumber } from "@/lib/countries";
import DateSelector from "@/components/turnos/DateSelector";
import SlotCard from "@/components/turnos/SlotCard";
import TurnosSkeleton from "@/components/turnos/TurnosSkeleton";
import CancelDialog from "@/components/turnos/dialogs/CancelDialog";
import PageTitle from "@/components/PageTitle";

export default function ListaTurnos() {
  const { selectedDate, setSelectedDate, slots, loading, cancelReservation } = useTurnos();
  const [slotToCancel, setSlotToCancel] = useState<Slot | null>(null);
  const [cancelling, setCancelling] = useState(false);
  // Mapa email -> teléfono, para el botón de WhatsApp de cada turno reservado.
  const [phones, setPhones] = useState<Record<string, string>>({});

  const reservedSlots = useMemo(
    () =>
      slots
        .filter((s) => s.status === "reserved")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [slots]
  );

  // Trae los teléfonos de los clientes con turno en la fecha seleccionada.
  useEffect(() => {
    const emails = reservedSlots
      .map((s) => s.appointment?.clientEmail)
      .filter((e): e is string => !!e);
    if (emails.length === 0) {
      setPhones({});
      return;
    }
    let cancelled = false;
    getClientsPhones(emails)
      .then((map) => {
        if (!cancelled) setPhones(map);
      })
      .catch((e) => console.error("No se pudieron traer los teléfonos:", e));
    return () => {
      cancelled = true;
    };
  }, [reservedSlots]);

  // Arma el link de WhatsApp para un turno (o undefined si el cliente no tiene teléfono).
  const buildWhatsappHref = (slot: Slot): string | undefined => {
    const email = slot.appointment?.clientEmail;
    const number = toWhatsappNumber(email ? phones[email] : undefined);
    if (!number) return undefined;
    const prettyDate = moment(selectedDate).format("DD/MM");
    const name = slot.appointment?.clientName || "";
    const msg = `Hola ${name}, te escribimos de la barbería por tu turno del ${prettyDate} a las ${slot.time}.`;
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  };

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
          <PageTitle className="text-2xl font-bold">Lista de Turnos</PageTitle>
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
                whatsappHref={buildWhatsappHref(slot)}
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
