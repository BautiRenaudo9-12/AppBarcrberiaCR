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
  if (!messaging) {
    console.log("Messaging not supported or failed to initialize.");
    return null;
  }

  if (Notification.permission === "denied") {
    // showNotification({ text: "Las notificaciones están bloqueadas. Habilítalas en el navegador.", duration: 5000 });
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const currentToken = await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return null;
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};