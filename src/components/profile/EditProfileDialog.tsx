import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserProfile } from "@/services/users";
import { createSearchKeywords } from "@/lib/keywords";
import PhoneInput from "@/components/PhoneInput";
import { toast } from "sonner";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  currentName: string;
  currentPhone: string;
  onSaved: (data: { name: string; nro: string }) => void;
}

export default function EditProfileDialog({
  open,
  onClose,
  email,
  currentName,
  currentPhone,
  onSaved,
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName);
  const [nro, setNro] = useState(currentPhone);
  const [loading, setLoading] = useState(false);

  // Reset fields each time the dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setNro(currentPhone);
    }
  }, [open, currentName, currentPhone]);

  const trimmedName = name.trim();
  const trimmedNro = nro.trim();
  const isValid = trimmedName.length > 0 && trimmedNro.length > 0;
  const hasChanges = trimmedName !== currentName || trimmedNro !== currentPhone;

  const handleSave = async () => {
    if (!isValid || !email) return;
    setLoading(true);
    try {
      // Regeneramos keywords para que el índice de búsqueda no quede viejo al cambiar
      // nombre o teléfono.
      const keywords = createSearchKeywords(trimmedName, email, trimmedNro);
      await updateUserProfile(email, { name: trimmedName, nro: trimmedNro, keywords });
      onSaved({ name: trimmedName, nro: trimmedNro });
      toast.success("Perfil actualizado");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el perfil. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualizá tu información de contacto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre completo</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              autoComplete="name"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Teléfono</Label>
            <PhoneInput id="edit-phone" value={nro} onChange={setNro} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-muted-foreground">
              Correo electrónico
            </Label>
            <Input id="edit-email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              El correo no se puede modificar.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !isValid || !hasChanges}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
