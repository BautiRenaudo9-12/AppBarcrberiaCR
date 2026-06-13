import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";

export function useClientesAnimations() {
    const pageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;

        const ctx = gsap.context(() => {
            const headerItems = page!.querySelectorAll("[data-header-stagger]");
            const searchEl = page!.querySelector("[data-search]");
            const statsEl = page!.querySelector("[data-stats]");
            const gridEl = page!.querySelector("[data-grid]");
            const cards = gridEl ? gridEl.querySelectorAll("[data-client-card]") : [];

            const tl = gsap.timeline({ delay: 0.15 });

            tl.fromTo(headerItems, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: "power3.out" });

            if (searchEl) {
                tl.fromTo(searchEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, "-=0.15");
            }

            if (statsEl) {
                tl.fromTo(statsEl, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: "elastic.out(1, 0.75)" }, "-=0.1");
            }

            if (cards.length > 0) {
                tl.fromTo(cards, { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.05, ease: "power3.out" }, "-=0.2");
            }
        }, page);

        return () => ctx.revert();
    }, []);

    return pageRef;
}