import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActivateExceptionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  slotTime: string | undefined;
}

export default function ActivateExceptionDialog({
  open,
  onClose,
  onConfirm,
  loading,
  slotTime,
}: ActivateExceptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activar Turno (Excepción)</DialogTitle>
          <DialogDescription>
            Se habilitará el turno de las <strong>{slotTime}</strong> solo por hoy.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            {loading ? "Procesando..." : "Activar Turno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
