import { useRegisterSW } from "virtual:pwa-register/react";

// Con registerType: 'autoUpdate' (ver vite.config), el SW nuevo se aplica solo en la próxima
// carga — no hay cartel "Actualizar ahora". Mantenemos useRegisterSW solo para registrar el
// SW de forma explícita (FCM lo necesita registrado) y loguear el estado. No renderiza UI.
export default function ReloadPrompt() {
  useRegisterSW({
    onRegistered(r) {
      console.log("SW registrado:", r);
    },
    onRegisterError(error) {
      console.error("Error al registrar el SW:", error);
    },
  });

  return null;
}
