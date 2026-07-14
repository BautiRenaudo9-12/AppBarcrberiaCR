import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { updateUserProfile } from "@/services/users";
import { createSearchKeywords } from "@/lib/keywords";
import PhoneInput from "@/components/PhoneInput";
import { toast } from "sonner";

// Paso obligatorio tras el login con Google: el usuario debe cargar su teléfono
// (Google no lo provee) antes de poder usar la app. Modal no descartable.
export default function CompleteProfileGate() {
  const { needsPhone, userProfile, setUserProfile } = useUser();
  const [nro, setNro] = useState("");
  const [loading, setLoading] = useState(false);

  if (!needsPhone) return null;

  const email = userProfile?.email || "";
  const name = userProfile?.name || "";
  const trimmedNro = nro.trim();
  const isValid = trimmedNro.length > 0 && !!email;

  const handleSave = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const keywords = createSearchKeywords(name, email, trimmedNro);
      await updateUserProfile(email, { nro: trimmedNro, keywords });
      setUserProfile({ ...userProfile, nro: trimmedNro });
      toast.success("¡Listo! Ya podés reservar tus turnos.");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar el teléfono. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open>
      <DialogContent
        // No descartable: sin cierre por overlay, Esc ni botón X (oculto vía CSS,
        // ya que es el único <button> hijo directo del contenido).
        className="[&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Completá tu teléfono</DialogTitle>
          <DialogDescription>
            Necesitamos tu número para poder contactarte por tus turnos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="gate-phone">Teléfono</Label>
          <PhoneInput
            id="gate-phone"
            value={nro}
            onChange={setNro}
            autoFocus
            onEnter={() => {
              if (isValid && !loading) handleSave();
            }}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || !isValid} className="w-full">
            {loading ? "Guardando..." : "Continuar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
