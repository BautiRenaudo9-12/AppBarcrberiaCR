import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent } from "@/lib/motion";

export function useAnunciosAnimations() {
    const pageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const page = pageRef.current;
        if (!page) return;

        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            const headerItems = page!.querySelectorAll("[data-header-stagger]");
            const formEl = page!.querySelector("[data-form]");

            const tl = gsap.timeline({ delay: isRouteTransitionRecent() ? 0 : 0.15 });

            tl.fromTo(headerItems, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: "power3.out" });

            // Las cards (AnnouncementCard) se auto-animan en su propio mount, lo que
            // respeta el fade-in incremental del scroll infinito y el resaltado isNew.
            if (formEl) {
                tl.fromTo(formEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, "-=0.15");
            }
        }, page);

        return () => ctx.revert();
    }, []);

    return pageRef;
}
