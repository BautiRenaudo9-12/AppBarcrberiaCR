import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnblockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export default function UnblockDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: UnblockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Regla de Bloqueo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar esta regla de bloqueo? <strong>El horario quedará disponible permanentemente</strong> (a menos que crees otro bloqueo).
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : "Eliminar Regla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}