import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import moment from "moment";

interface ReserveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  isAdmin: boolean;
  selectedDate: string;
  slotTime: string | undefined;
  clientName: string;
  setClientName: (name: string) => void;
}

export default function ReserveDialog({
  open,
  onClose,
  onConfirm,
  loading,
  isAdmin,
  selectedDate,
  slotTime,
  clientName,
  setClientName,
}: ReserveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
          <DialogDescription>
            ¿Deseas agendar turno para el <strong>{moment(selectedDate).format("DD/MM")}</strong> a las <strong>{slotTime}</strong>?
          </DialogDescription>
        </DialogHeader>

        {/* Admin Client Name Input */}
        {isAdmin && (
          <div className="py-4">
            <Label htmlFor="clientName" className="mb-2 block">
              Nombre del Cliente
            </Label>
            <Input
              id="clientName"
              placeholder="Ingrese nombre y apellido..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
        )}

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}