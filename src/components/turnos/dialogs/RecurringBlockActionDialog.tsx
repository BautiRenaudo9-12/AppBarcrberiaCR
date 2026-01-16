import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Power, Trash2 } from "lucide-react";

interface RecurringBlockActionDialogProps {
  open: boolean;
  onClose: () => void;
  onActivateException: () => void;
  onDeleteRule: () => void;
  loading: boolean;
  slotTime: string | undefined;
}

export default function RecurringBlockActionDialog({
  open,
  onClose,
  onActivateException,
  onDeleteRule,
  loading,
  slotTime,
}: RecurringBlockActionDialogProps) {
  const [action, setAction] = useState<'exception' | 'delete'>('exception');

  const handleConfirm = () => {
    if (action === 'exception') {
      onActivateException();
    } else {
      onDeleteRule();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activar Horario</DialogTitle>

        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup value={action} onValueChange={(v: any) => setAction(v)}>
            
            <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer data-[state=checked]:border-accent">
              <RadioGroupItem value="exception" id="opt-exception" />
              <Label htmlFor="opt-exception" className="flex-1 cursor-pointer flex items-center gap-3">
                  {/* <div className="p-2 bg-green-500/20 text-green-500 rounded-full">
                    <Power className="w-4 h-4" />
                  </div> */}
                <div>
                  <div className="font-semibold">Solo por Hoy</div>                  
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-secondary/20 cursor-pointer data-[state=checked]:border-destructive">
              <RadioGroupItem value="delete" id="opt-delete" />
              <Label htmlFor="opt-delete" className="flex-1 cursor-pointer flex items-center gap-3">
                {/* <div className="p-2 bg-red-500/20 text-red-500 rounded-full">
                   <Trash2 className="w-4 h-4" />
                </div> */}
                <div>
                  <div className="font-semibold">Para Siempre</div>
                </div>
              </Label>
            </div>

          </RadioGroup>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
