import { useState } from "react";
import { Bell, BellOff, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";
import { toast } from "sonner";

interface NotificationsDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  enabled: boolean;
  isAdmin?: boolean;
  onChanged: (data: { fcmToken: string | null; notifEnabled: boolean }) => void;
}

export default function NotificationsDialog({
  open,
  onClose,
  email,
  enabled,
  isAdmin = false,
  onChanged,
}: NotificationsDialogProps) {
  const [loading, setLoading] = useState(false);

  const permission =
    typeof Notification !== "undefined" ? Notification.permission : "default";
  const blocked = permission === "denied";

  let status: { label: string; tone: "on" | "off" | "blocked" };
  if (blocked) {
    status = { label: "Bloqueadas en el navegador", tone: "blocked" };
  } else if (enabled) {
    status = { label: "Activadas", tone: "on" };
  } else {
    status = { label: "Desactivadas", tone: "off" };
  }

  const enable = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        await updateUserProfile(email, { fcmToken: null, notifEnabled: true });
        onChanged({ fcmToken: null, notifEnabled: true });
        toast.info("Los administradores no reciben recordatorios de turnos");
        return;
      }
      const token = await requestForToken();
      if (token) {
        await updateUserProfile(email, { fcmToken: token, notifEnabled: true });
        localStorage.setItem("fcmToken", token);
        onChanged({ fcmToken: token, notifEnabled: true });
        toast.success("Notificaciones activadas correctamente");
      } else if (Notification.permission === "denied") {
        toast.error("Permiso denegado. Habilitalas desde el navegador.");
      } else {
        toast.error("No se pudo activar. Intentá nuevamente.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al activar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const disable = async () => {
    setLoading(true);
    try {
      await updateUserProfile(email, { fcmToken: null, notifEnabled: false });
      localStorage.removeItem("fcmToken");
      onChanged({ fcmToken: null, notifEnabled: false });
      toast.success("Notificaciones desactivadas");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron desactivar. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    if (loading || blocked) return;
    if (checked) enable();
    else disable();
  };

  const StatusIcon = status.tone === "blocked" ? AlertCircle : enabled ? Bell : BellOff;
  const iconColor =
    status.tone === "blocked"
      ? "text-destructive"
      : enabled
      ? "text-accent"
      : "text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notificaciones</DialogTitle>
          <DialogDescription>
            Recibí avisos antes de tus turnos.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <div className="flex items-center gap-3 bg-card border border-white/10 rounded-2xl px-4 py-4">
            <StatusIcon className={`w-5 h-5 ${iconColor} ${loading ? "animate-pulse" : ""}`} />
            <div className="flex-1">
              <Label htmlFor="notif-switch" className="font-medium">
                Recordatorios de turnos
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">{status.label}</p>
            </div>
            <Switch
              id="notif-switch"
              checked={enabled && !blocked}
              onCheckedChange={handleToggle}
              disabled={loading || blocked}
            />
          </div>

          {blocked && (
            <p className="text-xs text-muted-foreground px-1">
              Bloqueaste las notificaciones en este navegador. Habilitalas desde
              el ícono de candado en la barra de direcciones para poder activarlas.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
