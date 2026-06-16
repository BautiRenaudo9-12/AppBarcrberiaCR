import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent } from "@/lib/motion";

export function useConfigAnimations(isLoading?: boolean) {
    const pageRef = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useLayoutEffect(() => {
        if (isLoading) return;

        const page = pageRef.current;
        if (!page) return;

        if (prefersReducedMotion()) {
            hasAnimated.current = true;
            return;
        }

        const ctx = gsap.context(() => {
            const cards = page.querySelectorAll("[data-card]");

            const tl = gsap.timeline({ delay: hasAnimated.current || isRouteTransitionRecent() ? 0 : 0.15 });

            if (cards.length > 0) {
                tl.fromTo(cards, { opacity: 0, y: 24, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: "power3.out" }, "-=0.15");
            }
        }, page);

        hasAnimated.current = true;

        return () => ctx.revert();
    }, [isLoading]);

    return pageRef;
}