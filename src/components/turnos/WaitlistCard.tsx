import { useState } from "react";
import moment from "moment";
import { BellRing, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { useWaitlist } from "@/hooks/useWaitlist";
import { getNotificationPermission, requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";

interface WaitlistCardProps {
  date: string; // "YYYY-MM-DD"
}

// Se muestra cuando el cliente mira un día laborable sin turnos libres. Le permite anotarse
// en la lista de espera de ese día y se asegura de que tenga las notificaciones activadas
// (sin push, el aviso no le sirve).
export default function WaitlistCard({ date }: WaitlistCardProps) {
  const { user, userProfile, setUserProfile } = useUser();
  const { isInWaitlist, join, leave } = useWaitlist();
  const [busy, setBusy] = useState(false);

  const joined = isInWaitlist(date);
  const prettyDate = moment(date, "YYYY-MM-DD").format("dddd D [de] MMMM");

  // Si el cliente no tiene push activo, se lo pedimos: una lista de espera sin notificaciones
  // no sirve. Reutiliza el mismo flujo que el opt-in de recordatorios.
  const ensureNotifications = async () => {
    if (!user?.email) return;

    const alreadyOn =
      !!userProfile?.fcmToken &&
      userProfile?.notifEnabled !== false &&
      getNotificationPermission() === "granted";
    if (alreadyOn) return;

    if (getNotificationPermission() === "denied") {
      toast.warning("Tenés las notificaciones bloqueadas: desbloqueálas para recibir el aviso.");
      return;
    }

    const result = await requestForToken();
    if (result.status === "success" && result.token) {
      await updateUserProfile(user.email, { fcmToken: result.token, notifEnabled: true });
      setUserProfile({ ...userProfile, fcmToken: result.token, notifEnabled: true });
    } else if (result.status === "denied") {
      toast.warning("Bloqueaste las notificaciones; no vas a recibir el aviso hasta desbloquearlas.");
    } else if (result.status !== "dismissed") {
      toast.info("No pudimos activar las notificaciones en este dispositivo.");
    }
  };

  const handleJoin = async () => {
    setBusy(true);
    try {
      await join(date);
      await ensureNotifications();
      toast.success("Te anotamos en la lista de espera. Te avisamos si se libera un turno.");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo anotar en la lista de espera.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leave(date);
      toast.success("Saliste de la lista de espera.");
    } catch {
      toast.error("No se pudo salir de la lista de espera.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent shrink-0">
          <BellRing className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold">No quedan turnos para este día</p>
          <p className="text-sm text-muted-foreground">
            {joined
              ? `Estás en la lista de espera del ${prettyDate}. Si se libera un turno, te avisamos.`
              : `Anotate en la lista de espera y te avisamos si se libera un turno el ${prettyDate}.`}
          </p>
        </div>
      </div>

      {joined ? (
        <button
          onClick={handleLeave}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-secondary/50 hover:bg-secondary text-foreground py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-accent" />}
          En lista de espera · Salir
        </button>
      ) : (
        <button
          onClick={handleJoin}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
          Avisame si se libera un turno
        </button>
      )}
    </div>
  );
}
