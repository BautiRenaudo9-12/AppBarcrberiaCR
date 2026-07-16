import { Link } from "react-router-dom";
import moment from "moment";
import { useMemo, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { googleCalendarUrl } from "@/lib/calendar";

interface ActiveReservationProps {
    reserve: any;
    isLoading: boolean;
    onCancel: () => void;
}

export default function ActiveReservation({ reserve, isLoading, onCancel }: ActiveReservationProps) {
    const glowRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const { formattedDateCapitalized, formattedTime, calendarUrl } = useMemo(() => {
        if (!reserve || !reserve.timestamp) return { formattedDateCapitalized: "", formattedTime: "", calendarUrl: "" };

        const dateObj = reserve.timestamp?.toDate ? reserve.timestamp.toDate() : null;

        if (!dateObj) return { formattedDateCapitalized: "", formattedTime: "", calendarUrl: "" };

        const formattedDate = moment(dateObj).format("dddd, D [de] MMMM");
        const formattedTime = moment(dateObj).format("HH:mm");
        const formattedDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        return { formattedDateCapitalized, formattedTime, calendarUrl: googleCalendarUrl(dateObj) };
    }, [reserve]);

    useEffect(() => {
        if (!reserve || !glowRef.current || !cardRef.current) return;

        if (prefersReducedMotion()) {
            gsap.set(glowRef.current, { opacity: 0.12 });
            return;
        }

        gsap.set(glowRef.current, { opacity: 0 });
        const pulse = gsap.to(glowRef.current, { opacity: 0.15, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

        const onEnter = () => {
            pulse.kill();
            gsap.to(glowRef.current!, { opacity: 0.5, duration: 0.3, ease: "power2.out" });
        };
        const onLeave = () => {
            gsap.to(glowRef.current!, {
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    gsap.to(glowRef.current!, { opacity: 0.15, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
                },
            });
        };

        cardRef.current.addEventListener("mouseenter", onEnter);
        cardRef.current.addEventListener("mouseleave", onLeave);

        return () => {
            pulse.kill();
            gsap.killTweensOf(glowRef.current!);
            cardRef.current?.removeEventListener("mouseenter", onEnter);
            cardRef.current?.removeEventListener("mouseleave", onLeave);
        };
    }, [reserve]);

    if (isLoading) {
        return (
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="h-3 w-24 bg-white/10 rounded-full" />
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
        );
    }

    if (!reserve) {
        return (
            <div className="relative bg-card/50 border border-white/5 rounded-3xl p-5 space-y-2 text-center py-8">
                <p className="text-muted-foreground text-sm">No tienes turnos próximos</p>
                <Link to="/turnos" className="text-accent text-sm font-medium hover:underline">
                    Reservar ahora
                </Link>
            </div>
        );
    }

    return (
        <div ref={cardRef} className="relative">
            <div ref={glowRef} className="absolute inset-0 bg-gradient-to-r from-accent/30 to-accent/15 rounded-3xl blur-xl pointer-events-none" />

            <div className="relative bg-card border border-white/10 rounded-3xl p-5 space-y-4 z-10">
                <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Tu próximo turno</p>
                    <h2 className="text-xl font-semibold capitalize">{formattedDateCapitalized}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{formattedTime} - Corte de cabello</p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="text-sm text-destructive hover:text-destructive/80 transition-colors font-medium"
                    >
                        Cancelar
                    </button>

                    <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        + Google Calendar
                    </a>
                </div>
            </div>
        </div>
    );
}