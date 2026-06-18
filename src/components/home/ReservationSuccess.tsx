import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

interface ReservationSuccessProps {
    onDone: () => void;
}

/**
 * Overlay de confirmación que aparece al volver al Home tras reservar.
 * Dibuja un check (circle + path via stroke-dash) y se auto-cierra.
 */
export default function ReservationSuccess({ onDone }: ReservationSuccessProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const circleRef = useRef<SVGCircleElement>(null);
    const checkRef = useRef<SVGPathElement>(null);
    const onDoneRef = useRef(onDone);
    onDoneRef.current = onDone;

    useLayoutEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        if (prefersReducedMotion()) {
            gsap.set(overlay, { opacity: 1 });
            const t = setTimeout(() => onDoneRef.current(), 1500);
            return () => clearTimeout(t);
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
            tl.fromTo(
                "[data-success-card]",
                { scale: 0.8, opacity: 0, y: 10 },
                { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" },
                "-=0.1"
            );

            if (circleRef.current) {
                const len = circleRef.current.getTotalLength();
                gsap.set(circleRef.current, { strokeDasharray: len, strokeDashoffset: len });
                tl.to(circleRef.current, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, "-=0.25");
            }

            if (checkRef.current) {
                const len = checkRef.current.getTotalLength();
                gsap.set(checkRef.current, { strokeDasharray: len, strokeDashoffset: len });
                tl.to(checkRef.current, { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" }, "-=0.15");
            }

            tl.fromTo(
                "[data-success-text]",
                { opacity: 0, y: 8 },
                { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" },
                "-=0.1"
            );

            tl.to(overlay, { opacity: 0, duration: 0.3, ease: "power2.in", delay: 0.9, onComplete: () => onDoneRef.current() });
        }, overlay);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            style={{ opacity: 0 }}
        >
            <div
                data-success-card
                className="bg-card border border-white/10 rounded-3xl px-8 py-7 flex flex-col items-center gap-4 shadow-2xl shadow-black/50"
            >
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                    <circle ref={circleRef} cx="36" cy="36" r="32" stroke="rgb(48,209,88)" strokeWidth="4" />
                    <path
                        ref={checkRef}
                        d="M22 37 L32 47 L51 27"
                        stroke="rgb(48,209,88)"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <div data-success-text className="text-center">
                    <p className="font-bold text-lg">¡Reserva confirmada!</p>
                    <p className="text-sm text-muted-foreground">Te esperamos en tu turno.</p>
                </div>
            </div>
        </div>
    );
}
