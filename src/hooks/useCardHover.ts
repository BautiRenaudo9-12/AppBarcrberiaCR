import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function useCardHover() {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleEnter = () => {
            gsap.to(card, { y: -4, scale: 1.01, boxShadow: "0 8px 30px rgba(0,0,0,0.25)", duration: 0.3, ease: "power2.out" });
        };

        const handleLeave = () => {
            gsap.to(card, { y: 0, scale: 1, boxShadow: "0 0px 0px rgba(0,0,0,0)", duration: 0.3, ease: "power2.in" });
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