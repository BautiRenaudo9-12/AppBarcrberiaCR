import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import moment from "moment";
import { useTurnos } from "@/hooks/useTurnos";
import { toast } from "sonner";
import { Slot } from "@/types/turnos";

// Components
import DateSelector from "@/components/turnos/DateSelector";
import TurnosList from "@/components/turnos/TurnosList";
import ReserveDialog from "@/components/turnos/dialogs/ReserveDialog";
import BlockDialog from "@/components/turnos/dialogs/BlockDialog";
import UnblockDialog from "@/components/turnos/dialogs/UnblockDialog";
import ActivateExceptionDialog from "@/components/turnos/dialogs/ActivateExceptionDialog";
import RecurringBlockActionDialog from "@/components/turnos/dialogs/RecurringBlockActionDialog";
import CancelDialog from "@/components/turnos/dialogs/CancelDialog";
import PageTitle from "@/components/PageTitle";

export default function Turnos() {
  const navigate = useNavigate();

  // Custom Hook for Logic
  const { 
    selectedDate, 
    setSelectedDate, 
    slots, 
    loading, 
    isAdmin, 
    reserveAppointment, 
    blockSlot,
    unblockSlot,
    activateException,
    cancelReservation
  } = useTurnos();

  // Dialog UI State
  const [selectedTurno, setSelectedTurno] = useState<Slot | null>(null); // Reserve Dialog
  const [clientName, setClientName] = useState("");
  
  const [slotToBlock, setSlotToBlock] = useState<Slot | null>(null); // Block Dialog
  const [blockMode, setBlockMode] = useState<'day' | 'weeks' | 'forever'>('day');
  const [blockWeeks, setBlockWeeks] = useState(4);
  
  const [slotToUnblock, setSlotToUnblock] = useState<Slot | null>(null); // Unblock Dialog
  const [slotToActivate, setSlotToActivate] = useState<Slot | null>(null); // Activate Dialog
  const [slotToRecurringAction, setSlotToRecurringAction] = useState<Slot | null>(null); // Recurring Choice Dialog
  const [slotToCancel, setSlotToCancel] = useState<Slot | null>(null); // Cancel Reservation Dialog

  // --- UI Handlers (Connects Dialogs to Hook) ---

  const onConfirmReserve = async () => {
    if (!selectedTurno) return;
    
    if (isAdmin && !clientName.trim()) {
        toast.error("Debe ingresar un nombre para reservar.");
        return;
    }

    const success = await reserveAppointment(selectedTurno.time, clientName);
    
    if (success) {
        setSelectedTurno(null);
        setClientName("");
        if (!isAdmin) {
            navigate("/", { state: { reservationSuccess: true } });
        }
    }
  };

  const onConfirmBlock = async () => {
    if (!slotToBlock) return;
    const success = await blockSlot(slotToBlock, blockMode, blockWeeks);
    if (success) {
        setSlotToBlock(null);
    }
  };

  const onConfirmUnblock = async () => {
    if (!slotToUnblock?.blockedRule?.id) return;
    const success = await unblockSlot(slotToUnblock.blockedRule.id);
    if (success) {
        setSlotToUnblock(null);
    }
  };

  const onConfirmActivate = async () => {
      if (!slotToActivate) return;
      const success = await activateException(slotToActivate.time);
      if (success) {
          setSlotToActivate(null);
      }
  };
  
  // Logic from Recurring Dialog
  const onRecurringActivate = async () => {
      if (!slotToRecurringAction) return;
      const success = await activateException(slotToRecurringAction.time);
      if (success) setSlotToRecurringAction(null);
  };

  const onRecurringDelete = async () => {
      if (!slotToRecurringAction?.blockedRule?.id) return;
      const success = await unblockSlot(slotToRecurringAction.blockedRule.id);
      if (success) setSlotToRecurringAction(null);
  };

  const onConfirmCancel = async () => {
      if (!slotToCancel?.appointment?.id) return;
      const success = await cancelReservation(slotToCancel.appointment.id);
      if (success) setSlotToCancel(null);
  };

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <div className="bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to={isAdmin ? "/" : "/"}
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <PageTitle className="text-2xl font-bold">Reservar Turno</PageTitle>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6 w-full">
        
        <DateSelector
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            minDate={!isAdmin ? moment().format("YYYY-MM-DD") : undefined}
            maxDate={!isAdmin ? moment().add(6, 'days').format("YYYY-MM-DD") : undefined}
        />

        <TurnosList 
            selectedDate={selectedDate}
            slots={slots}
            isAdmin={isAdmin}
            loading={loading}
            onReserve={setSelectedTurno}
            onBlock={setSlotToBlock}
            onUnblock={setSlotToUnblock}
            onActivate={setSlotToActivate}
            onRecurringAction={setSlotToRecurringAction}
            onCancel={setSlotToCancel}
        />

        {/* --- DIALOGS --- */}
        
        <ReserveDialog 
            open={!!selectedTurno}
            onClose={() => { setSelectedTurno(null); setClientName(""); }}
            onConfirm={onConfirmReserve}
            loading={loading}
            isAdmin={isAdmin}
            selectedDate={selectedDate}
            slotTime={selectedTurno?.time}
            clientName={clientName}
            setClientName={setClientName}
        />

        <BlockDialog
            open={!!slotToBlock}
            onClose={() => { setSlotToBlock(null); setBlockMode('day'); setBlockWeeks(4); }}
            onConfirm={onConfirmBlock}
            loading={loading}
            selectedDate={selectedDate}
            slotTime={slotToBlock?.time}
            isException={slotToBlock?.isException}
            blockMode={blockMode}
            setBlockMode={setBlockMode}
            blockWeeks={blockWeeks}
            setBlockWeeks={setBlockWeeks}
        />
        
        <UnblockDialog 
            open={!!slotToUnblock}
            onClose={() => setSlotToUnblock(null)}
            onConfirm={onConfirmUnblock}
            loading={loading}
        />
        
        <ActivateExceptionDialog 
            open={!!slotToActivate}
            onClose={() => setSlotToActivate(null)}
            onConfirm={onConfirmActivate}
            loading={loading}
            slotTime={slotToActivate?.time}
        />
        
        <RecurringBlockActionDialog
            open={!!slotToRecurringAction}
            onClose={() => setSlotToRecurringAction(null)}
            onActivateException={onRecurringActivate}
            onDeleteRule={onRecurringDelete}
            loading={loading}
            slotTime={slotToRecurringAction?.time}
        />

        <CancelDialog
            open={!!slotToCancel}
            onClose={() => setSlotToCancel(null)}
            onConfirm={onConfirmCancel}
            loading={loading}
            slotTime={slotToCancel?.time}
            clientName={slotToCancel?.appointment?.clientName}
        />

      </div>
    </div>
  );
}