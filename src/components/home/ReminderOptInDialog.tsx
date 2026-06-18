import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";
import { toast } from "sonner";

interface ReminderOptInDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  onEnabled: (data: { fcmToken: string; notifEnabled: true }) => void;
}

// Modal centrado que se ofrece tras reservar (con throttle de 2 meses en Home)
// para invitar al cliente a activar los recordatorios de turnos. La lógica de
// activación espeja la de NotificationsDialog.enable().
export default function ReminderOptInDialog({
  open,
  onClose,
  email,
  onEnabled,
}: ReminderOptInDialogProps) {
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      const result = await requestForToken();
      switch (result.status) {
        case "success":
          await updateUserProfile(email, { fcmToken: result.token!, notifEnabled: true });
          localStorage.setItem("fcmToken", result.token!);
          onEnabled({ fcmToken: result.token!, notifEnabled: true });
          toast.success("Notificaciones activadas correctamente");
          onClose();
          break;
        case "denied":
          toast.error("Están bloqueadas en el navegador. Habilitalas desde el ícono 🔒 de la barra de direcciones.");
          onClose();
          break;
        case "dismissed":
          // El usuario cerró el cartel de permiso sin decidir: no insistimos.
          onClose();
          break;
        case "unsupported":
          toast.error("Tu navegador no admite notificaciones en este dispositivo.");
          onClose();
          break;
        default:
          toast.error("No se pudo activar. Intentá nuevamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al activar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center mb-2">
            <Bell className="w-6 h-6 text-accent" />
          </div>
          <DialogTitle>Activá los recordatorios</DialogTitle>
          <DialogDescription>
            Te avisamos antes de tu turno para que no te lo pierdas.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Ahora no
          </Button>
          <Button onClick={enable} disabled={loading}>
            {loading ? "Activando..." : "Activar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
