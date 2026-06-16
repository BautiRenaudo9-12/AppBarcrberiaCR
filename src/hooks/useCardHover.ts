import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

export function useCardHover() {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;
        if (prefersReducedMotion()) return;

        // Sólo transform (GPU). La sombra la maneja CSS (transition-shadow) para
        // evitar repaints por frame al animar box-shadow desde JS.
        const handleEnter = () => {
            gsap.to(card, { y: -4, scale: 1.01, duration: 0.3, ease: "power2.out" });
        };

        const handleLeave = () => {
            gsap.to(card, { y: 0, scale: 1, duration: 0.3, ease: "power2.in" });
        };

        card.addEventListener("mouseenter", handleEnter);
        card.addEventListener("mouseleave", handleLeave);

        return () => {
            card.removeEventListener("mouseenter", handleEnter);
            card.removeEventListener("mouseleave", handleLeave);
            gsap.killTweensOf(card);
        };
    }, []);

    return cardRef;
}