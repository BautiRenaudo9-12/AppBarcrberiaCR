import { toast } from "sonner";

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

export const showErrorNotification = (text: string) => {
    toast.error(text, {
        position: "top-center"
    })
}
