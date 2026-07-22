import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Bell, X, AlertCircle } from "lucide-react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { getNotificationPermission, requestForToken, showNotification } from "@/services/notifications";

interface NotificationPromptProps {
    onDismiss: () => void;
    onSuccess: () => void;
}

export default function NotificationPrompt({ onDismiss, onSuccess }: NotificationPromptProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const promptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (getNotificationPermission() === "denied") {
            setIsBlocked(true);
        }
        setTimeout(() => setIsVisible(true), 500);
    }, []);

    useLayoutEffect(() => {
        if (!isVisible || !promptRef.current) return;

        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(promptRef.current!, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" });

            const bell = promptRef.current!.querySelector("[data-bell]");
            if (bell) {
                gsap.fromTo(bell, { rotation: 0 }, { rotation: 15, duration: 0.15, repeat: 5, yoyo: true, ease: "sine.inOut", delay: 0.7 });
            }
        }, promptRef);

        return () => ctx.revert();
    }, [isVisible]);

    const handleEnable = async () => {
        setLoading(true);

        try {
            const result = await requestForToken();

            if (result.status === "success") {
                showNotification({ text: "¡Notificaciones activadas!" });
                setIsVisible(false);
                setTimeout(onSuccess, 500);
            } else if (result.status === "denied") {
                setIsBlocked(true);
                showNotification({ text: "⚠️ Desbloquea las notificaciones desde el candado 🔒 de la URL", duration: 4000 });
            } else if (result.status === "unsupported") {
                showNotification({ text: "Tu navegador no admite notificaciones en este dispositivo.", duration: 4000 });
            }
            // status "dismissed" / "error": no hacemos nada, el cartel queda visible para reintentar.
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onDismiss, 500);
    };

    if (!isVisible) return null;

    return (
        <div ref={promptRef} className="fixed bottom-6 left-4 right-4 z-[100]">
            <div className="max-w-md mx-auto bg-card/95 border border-white/10 rounded-3xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl flex items-center gap-4">

                <div data-bell className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isBlocked ? 'bg-destructive/20' : 'bg-accent/20'}`}>
                    {isBlocked ? (
                        <AlertCircle className="w-6 h-6 text-destructive" />
                    ) : (
                        <Bell className="w-6 h-6 text-accent animate-pulse" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">
                        {isBlocked ? "Notificaciones Bloqueadas" : "Activar Notificaciones"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {isBlocked
                            ? "Habilítalas en tu navegador para recibir recordatorios."
                            : "Recibe recordatorios de tus turnos reservados."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <button
                        onClick={handleEnable}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 ${isBlocked
                            ? "bg-secondary text-foreground hover:bg-secondary/80"
                            : "bg-accent text-white shadow-accent/20 hover:scale-105 active:scale-95"}`}
                    >
                        {loading ? "..." : "Habilitar"}
                    </button>
                </div>
            </div>
        </div>
    );
}