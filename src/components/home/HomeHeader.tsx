import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "firebase/auth";
import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent, shouldPlayHomeEntrance, markHomeEntrancePlayed } from "@/lib/motion";

interface HomeHeaderProps {
    user: User | null;
}

export default function HomeHeader({ user }: HomeHeaderProps) {
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
    const initials = user?.displayName
        ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    const headerRef = useRef<HTMLDivElement>(null);

    // El prompt de instalación PWA lo maneja exclusivamente <InstallPrompt /> (montado a
    // nivel de App). Mantenerlo también acá mostraba dos avisos de instalación a la vez.

    useLayoutEffect(() => {
        if (!headerRef.current) return;

        // Movimiento reducido: solo fade de opacidad (sin desplazamientos/scale).
        if (prefersReducedMotion()) {
            const ctx = gsap.context(() => {
                const els = headerRef.current!.querySelectorAll("[data-header-stagger], [data-header-avatar]");
                gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.05, ease: "power1.out" });
            }, headerRef);
            return () => ctx.revert();
        }

        if (!shouldPlayHomeEntrance()) return;
        markHomeEntrancePlayed();

        const ctx = gsap.context(() => {
            const staggerEls = headerRef.current!.querySelectorAll("[data-header-stagger]");
            const avatarEl = headerRef.current!.querySelector("[data-header-avatar]");

            const tl = gsap.timeline({ delay: isRouteTransitionRecent() ? 0 : 0.1 });

            tl.fromTo(headerRef.current!, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
            tl.fromTo(staggerEls, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power3.out" }, "-=0.15");

            if (avatarEl) {
                tl.fromTo(avatarEl, { scale: 0 }, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" }, "-=0.2");
            }
        }, headerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={headerRef} className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl px-4 py-4 sm:px-6 shadow-sm">
            <div className="max-w-md mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img data-header-stagger src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <p data-header-stagger className="text-xs text-muted-foreground font-medium mb-0.5">
                            {firstName ? `Hola, ${firstName}` : "Bienvenido"}
                        </p>
                        <h1 data-header-stagger className="text-2xl font-bold tracking-tight">Barberia CR</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/profile">
                        <Avatar data-header-avatar className="h-10 w-10 border-2 border-accent/20 transition-transform hover:scale-105">
                            <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Usuario"} />
                            <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Link>
                </div>
            </div>
        </div>
    );
}