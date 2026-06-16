import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CancelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  slotTime?: string;
  clientName?: string;
}

export default function CancelDialog({
  open,
  onClose,
  onConfirm,
  loading,
  slotTime,
  clientName,
}: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Reserva</DialogTitle>
          <DialogDescription>
            ¿Seguro que querés cancelar la reserva de{" "}
            <strong>{clientName || "este cliente"}</strong> a las{" "}
            <strong>{slotTime}</strong>? <strong>El turno quedará libre.</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : "Cancelar reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
