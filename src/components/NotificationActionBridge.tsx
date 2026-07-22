import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Puente entre el service worker (push-sw.js) y la app cuando ya está abierta. Al tocar
// "Cancelar" en el push de recordatorio, el SW hace focus() de la ventana y nos manda un
// postMessage en vez de client.navigate() (que rechazaba en ventanas no controladas y dejaba
// el botón sin efecto). Acá lo recibimos y navegamos a la URL que Home.tsx sabe interpretar
// (?action=cancel&id=...), reutilizando su efecto para abrir el diálogo de cancelación. Sin
// recargar la página. Va montado dentro del <BrowserRouter> para tener useNavigate.
export default function NotificationActionBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (
        data &&
        data.type === "notification-action" &&
        data.action === "cancel" &&
        data.appointmentId
      ) {
        navigate(`/?action=cancel&id=${encodeURIComponent(data.appointmentId)}`);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [navigate]);

  return null;
}
