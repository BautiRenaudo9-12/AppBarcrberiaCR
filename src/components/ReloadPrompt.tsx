import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useState } from "react";
import { AlertCircle, RefreshCw, X } from "lucide-react";

export default function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (needRefresh) {
        setIsOpen(true);
    }
  }, [needRefresh]);

  const close = () => {
    setIsOpen(false);
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // Prevent showing "Offline ready" toast as it's often confusing for users.
  // We only care about "Need Refresh" (Updates).
  if (!isOpen || !needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card/90 backdrop-blur-md border border-accent/20 p-4 rounded-2xl shadow-2xl flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="bg-accent/20 p-2 rounded-xl text-accent shrink-0">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Actualización disponible</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Hay una nueva versión de la aplicación. Actualiza para obtener las últimas mejoras.
            </p>
          </div>
          <button 
            onClick={close}
            className="text-muted-foreground hover:text-foreground transition-colors -mt-1 -mr-1 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex gap-2 justify-end">
            <button
                onClick={() => updateServiceWorker(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto"
            >
                Actualizar ahora
            </button>
        </div>
      </div>
    </div>
  );
}
