import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent, shouldPlayHomeEntrance, markHomeEntrancePlayed, resetHomeEntrancePlayed } from "@/lib/motion";

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
                    const items = section.querySelectorAll<HTMLElement>("[data-menu-item]");
                    if (items.length > 0) {
                        const tl = gsap.timeline({ delay: sectionDelay });

                        tl.fromTo(
                            section,
                            { opacity: 0, scale: 0.96 },
                            { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }
                        );

                        tl.fromTo(
                            items,
                            { opacity: 0, x: -15, scale: 0.95 },
                            { opacity: 1, x: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: "back.out(1.4)" },
                            "-=0.2"
                        );

                        const icons = section.querySelectorAll<HTMLElement>("[data-menu-icon]");
                        tl.fromTo(
                            icons,
                            { scale: 0.8 },
                            { scale: 1, duration: 0.6, stagger: 0.06, ease: "elastic.out(1, 0.5)" },
                            "-=0.4"
                        );

                        items.forEach((item, i) => {
                            const shimmer = item.querySelector<HTMLElement>("[data-shimmer]");
                            if (shimmer) {
                                gsap.fromTo(
                                    shimmer,
                                    { xPercent: -100, opacity: 0 },
                                    { xPercent: 100, opacity: 0.08, duration: 0.6, delay: sectionDelay + 0.3 + i * 0.06, ease: "power1.inOut", onComplete: () => { gsap.set(shimmer, { opacity: 0 }); } }
                                );
                            }
                        });
                    }
                } else {
                    gsap.fromTo(section, config.from, { ...config.to, delay: sectionDelay });
                }

                cumulativeDelay += 0.1;
            });
        }, container);

        return () => {
            ctx.revert();
            resetHomeEntrancePlayed();
        };
    }, []);

    return containerRef;
}