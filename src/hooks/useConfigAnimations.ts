import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";

export function useConfigAnimations() {
    const pageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;

        const ctx = gsap.context(() => {
            const headerItems = page.querySelectorAll("[data-header-stagger]");
            const cards = page.querySelectorAll("[data-card]");

            const tl = gsap.timeline({ delay: 0.15 });

            tl.fromTo(headerItems, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: "power3.out" });

            if (cards.length > 0) {
                tl.fromTo(cards, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: "power3.out" }, "-=0.15");
            }
        }, page);

        return () => ctx.revert();
    }, []);

    return pageRef;
}