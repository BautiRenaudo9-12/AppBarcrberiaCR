import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { Announcement } from "@/services/announcements";
import { prefersReducedMotion, shouldPlayHomeEntrance, markHomeEntrancePlayed } from "@/lib/motion";

interface HomeAnnouncementProps {
    announcement: Announcement;
}

export default function HomeAnnouncement({ announcement }: HomeAnnouncementProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const shimmerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!cardRef.current) return;

        if (prefersReducedMotion()) return;

        if (!shouldPlayHomeEntrance()) return;
        markHomeEntrancePlayed();

        const ctx = gsap.context(() => {
            gsap.fromTo(cardRef.current!, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.55, ease: "back.out(1.4)" });

            if (shimmerRef.current) {
                gsap.fromTo(shimmerRef.current, { xPercent: -100 }, { xPercent: 100, duration: 0.8, delay: 0.6, ease: "power2.inOut" });
            }
        }, cardRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={cardRef} className="relative overflow-hidden bg-gradient-to-br from-white to-slate-100 text-slate-900 rounded-3xl p-6 shadow-xl border border-white/20 flex items-start gap-5 group hover:scale-[1.02] transition-transform">
            <div ref={shimmerRef} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" style={{ transform: "translateX(-100%)" }} />

            <div className="relative text-4xl shrink-0 bg-white shadow-sm w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100">
                {announcement.icono}
            </div>

            <div className="relative flex-1 py-1">
                <h3 className="font-bold text-lg leading-tight mb-2 flex items-center gap-2">
                    Atención
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {announcement.texto}
                </p>
            </div>
        </div>
    );
}