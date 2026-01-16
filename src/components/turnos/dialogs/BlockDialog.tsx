import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import moment from "moment";

interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  selectedDate: string;
  slotTime: string | undefined;
  isException: boolean | undefined;
  blockMode: 'day' | 'weeks' | 'forever';
  setBlockMode: (mode: 'day' | 'weeks' | 'forever') => void;
  blockWeeks: number;
  setBlockWeeks: (weeks: number) => void;
}

export default function BlockDialog({
  open,
  onClose,
  onConfirm,
  loading,
  selectedDate,
  slotTime,
  isException,
  blockMode,
  setBlockMode,
  blockWeeks,
  setBlockWeeks
}: BlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isException ? "Re-Bloquear Horario" : "Bloquear Horario"}
          </DialogTitle>
          <DialogDescription>
            {isException
              ? "Este horario está activado manualmente. Al confirmar, se eliminará la excepción y volverá a estar bloqueado."
              : `Configura la duración del bloqueo para el ${moment(selectedDate).format("dddd DD/MM")} a las ${slotTime}.`
            }
          </DialogDescription>
        </DialogHeader>

        {!isException && (
          <div className="py-4 space-y-4">
            <RadioGroup value={blockMode} onValueChange={(v: any) => setBlockMode(v)}>

              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer">
                <RadioGroupItem value="day" id="mode-day" />
                <Label htmlFor="mode-day" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Solo por hoy</div>
                  <div className="text-xs text-muted-foreground">Bloquea solo esta fecha específica.</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer">
                <RadioGroupItem value="weeks" id="mode-weeks" />
                <Label htmlFor="mode-weeks" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Por varias semanas</div>
                  <div className="text-xs text-muted-foreground">Se repetirá este día de la semana.</div>
                </Label>
              </div>

              {blockMode === 'weeks' && (
                <div className="pl-8">
                  <Label className="text-xs mb-1.5 block">Duración (Semanas)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={blockWeeks || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setBlockWeeks(isNaN(val) ? 0 : val);
                    }}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer">
                <RadioGroupItem value="forever" id="mode-forever" />
                <Label htmlFor="mode-forever" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Para siempre</div>
                  <div className="text-xs text-muted-foreground">Bloquea este horario todos los {moment(selectedDate).format("dddd")}s.</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : (isException ? "Re-Bloquear" : "Bloquear Horario")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}