import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-[90] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 p-3 rounded-xl shadow-lg flex items-center gap-3">
        <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500 shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-500">Sin conexión</p>
          <p className="text-[10px] text-amber-500/80">
            Trabajando en modo offline. Los cambios se guardarán al recuperar la red.
          </p>
        </div>
      </div>
    </div>
  );
}
