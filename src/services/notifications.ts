import { toast } from "sonner";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";

interface NotificationProps {
  text?: string;
  duration?: number;
  // Legacy props ignored or mapped
  gravity?: string;
  position?: string;
}

export const showNotification = ({ text = "Exito", duration = 1500 }: NotificationProps) => {
  toast.success(text, {
    duration,
    position: "top-center",
  });
};

// Resultado tipado para que los llamadores puedan distinguir TODOS los casos y dar
// el mensaje correcto, sin quedar colgados:
// - success: hay token (notificaciones listas)
// - denied: el navegador bloqueó las notificaciones (no se puede activar sin desbloquear)
// - dismissed: el usuario cerró el cartel de permiso sin elegir (sigue en "default")
// - unsupported: navegador/SO sin push, o el Service Worker no está disponible (p. ej. dev)
// - error: VAPID faltante o fallo inesperado al obtener el token
export type TokenStatus = "success" | "denied" | "dismissed" | "unsupported" | "error";
export interface TokenResult {
  status: TokenStatus;
  token?: string;
}

// Evita que `navigator.serviceWorker.ready` cuelgue para siempre cuando no hay SW
// registrado (típico en `npm run dev`, donde la PWA no se registra).
const SW_READY_TIMEOUT_MS = 10000;

export const requestForToken = async (): Promise<TokenResult> => {
  console.log("🔔 [Notifications] Requesting token...");

  if (typeof Notification === "undefined" || !messaging || !("serviceWorker" in navigator)) {
    console.warn("⚠️ [Notifications] Messaging/Notification/SW not supported.");
    return { status: "unsupported" };
  }

  if (Notification.permission === "denied") {
    console.warn("⚠️ [Notifications] Permission denied.");
    return { status: "denied" };
  }

  try {
    // Pedimos permiso explícitamente para poder detectar el "cierre" del cartel
    // (queda en "default") y diferenciarlo de un rechazo.
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

    if (permission === "denied") return { status: "denied" };
    if (permission !== "granted") return { status: "dismissed" };

    console.log("🔔 [Notifications] Waiting for Service Worker...");
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS)),
    ]);
    if (!registration) {
      console.warn("⚠️ [Notifications] Service Worker not ready (timeout).");
      return { status: "unsupported" };
    }
    console.log("✅ [Notifications] SW Ready:", registration);

    const vapidKey = import.meta.env.VITE_VAPID_KEY;
    if (!vapidKey) {
      console.error("❌ [Notifications] VITE_VAPID_KEY is missing in .env");
      return { status: "error" };
    }

    console.log("🔔 [Notifications] Getting Token...");
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log("✅ [Notifications] Token received:", currentToken.substring(0, 10) + "...");
      return { status: "success", token: currentToken };
    }
    console.log("⚠️ [Notifications] No registration token available.");
    return { status: "error" };
  } catch (err) {
    console.error("❌ [Notifications] Error retrieving token:", err);
    return { status: "error" };
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return null;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};