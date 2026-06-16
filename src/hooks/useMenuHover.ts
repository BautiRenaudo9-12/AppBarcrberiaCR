import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

export function useMenuHover() {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        if (prefersReducedMotion()) return;

        const items = menu.querySelectorAll("[data-menu-item]");

        const handleEnter = (e: Event) => {
            const link = e.currentTarget as HTMLElement;
            const icon = link.querySelector("[data-menu-icon]");
            const arrow = link.querySelector("[data-menu-arrow]");

            if (icon) gsap.to(icon, { scale: 1.15, duration: 0.3, ease: "back.out(2)" });
            if (arrow) gsap.to(arrow, { x: 6, duration: 0.25, ease: "power2.out" });
        };

        const handleLeave = (e: Event) => {
            const link = e.currentTarget as HTMLElement;
            const icon = link.querySelector("[data-menu-icon]");
            const arrow = link.querySelector("[data-menu-arrow]");

            if (icon) gsap.to(icon, { scale: 1, duration: 0.3, ease: "power2.out" });
            if (arrow) gsap.to(arrow, { x: 0, duration: 0.25, ease: "power2.in" });
        };

        items.forEach((item) => {
            item.addEventListener("mouseenter", handleEnter);
            item.addEventListener("mouseleave", handleLeave);
        });

        return () => {
            items.forEach((item) => {
                item.removeEventListener("mouseenter", handleEnter);
                item.removeEventListener("mouseleave", handleLeave);
            });
        };
    }, []);

    return menuRef;
}