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

export const requestForToken = async () => {
  console.log("🔔 [Notifications] Requesting token...");
  if (!messaging) {
    console.error("❌ [Notifications] Messaging not supported or failed to initialize.");
    return null;
  }

  if (Notification.permission === "denied") {
    console.warn("⚠️ [Notifications] Permission denied.");
    return null;
  }

  try {
    console.log("🔔 [Notifications] Waiting for Service Worker...");
    const registration = await navigator.serviceWorker.ready;
    console.log("✅ [Notifications] SW Ready:", registration);

    const vapidKey = import.meta.env.VITE_VAPID_KEY;
    if (!vapidKey) {
        console.error("❌ [Notifications] VITE_VAPID_KEY is missing in .env");
        return null;
    }

    console.log("🔔 [Notifications] Getting Token...");
    const currentToken = await getToken(messaging, { 
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      console.log("✅ [Notifications] Token received:", currentToken.substring(0, 10) + "...");
      return currentToken;
    } else {
      console.log('⚠️ [Notifications] No registration token available.');
      return null;
    }
  } catch (err) {
    console.error('❌ [Notifications] Error retrieving token:', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return null;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};