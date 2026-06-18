import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent, shouldPlayHomeEntrance, markHomeEntrancePlayed } from "@/lib/motion";

type AnimateStyle = "slide" | "card" | "menu";

const SECTION_CONFIGS: Record<AnimateStyle, { from: gsap.TweenVars; to: gsap.TweenVars }> = {
    slide: {
        from: { opacity: 0, x: -40 },
        to: { opacity: 1, x: 0, duration: 0.55, ease: "back.out(1.4)" },
    },
    card: {
        from: { opacity: 0, scale: 0.92, y: 12 },
        to: { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "elastic.out(1, 0.75)" },
    },
    menu: {
        from: { opacity: 0 },
        to: { opacity: 1, duration: 0.01 },
    },
};

export function useHomeAnimations(baseDelay = 0.2) {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const sections = container.querySelectorAll<HTMLElement>("[data-animate]");
        if (sections.length === 0) return;

        if (prefersReducedMotion()) return;

        if (!shouldPlayHomeEntrance()) return;
        markHomeEntrancePlayed();

        const startDelay = isRouteTransitionRecent() ? 0 : baseDelay;

        const ctx = gsap.context(() => {
            let cumulativeDelay = startDelay;

            sections.forEach((section) => {
                const style = (section.getAttribute("data-animate") || "menu") as AnimateStyle;
                const config = SECTION_CONFIGS[style] || SECTION_CONFIGS.menu;
                const sectionDelay = cumulativeDelay;

                if (style === "menu") {
                    const items = section.querySelectorAll("[data-menu-item]");
                    if (items.length > 0) {
                        gsap.fromTo(
                            items,
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, delay: sectionDelay, ease: "power3.out" }
                        );
                    }
                } else {
                    gsap.fromTo(section, config.from, { ...config.to, delay: sectionDelay });
                }

                cumulativeDelay += 0.1;
            });
        }, container);

        return () => ctx.revert();
    }, []);

    return containerRef;
}