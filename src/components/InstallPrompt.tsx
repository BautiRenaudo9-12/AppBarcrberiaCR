import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                         || (window.navigator as any).standalone 
                         || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Handle Android/Chrome Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show prompt after 4 seconds
      setTimeout(() => setIsVisible(true), 4000);
    };

    // 4. If iOS, show custom message after delay
    if (ios) {
      setTimeout(() => setIsVisible(true), 4000);
    }

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-md mx-auto bg-card/90 border border-white/10 rounded-3xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl flex items-center gap-4">
        {/* App Icon */}
        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>

        {/* Text content based on Platform */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm truncate">Instalar Barberia CR</h3>
          {isIOS ? (
            <div className="flex flex-col gap-1 mt-0.5">
                <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                    Toca el botón <Share className="w-3 h-3 inline" /> y luego
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    "Añadir a pantalla de inicio"
                </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Accede más rápido desde tu pantalla de inicio.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
          
          {!isIOS && (
            <button
                onClick={handleInstall}
                className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
                <Download className="w-4 h-4" />
                Instalar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}