import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

export function useSearchFocus() {
    const inputRef = useRef<HTMLInputElement>(null);
    const iconRef = useRef<Element | null>(null);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        if (prefersReducedMotion()) return;

        const icon = input.parentElement?.querySelector("[data-search-icon]") as Element | null;
        iconRef.current = icon;

        // El anillo de foco lo da CSS (focus:ring). Acá sólo animamos el ícono (transform).
        const handleFocus = () => {
            if (icon) gsap.to(icon, { rotation: -10, duration: 0.2, ease: "power2.out" });
        };

        const handleBlur = () => {
            if (icon) gsap.to(icon, { rotation: 0, duration: 0.2, ease: "power2.in" });
        };

        input.addEventListener("focus", handleFocus);
        input.addEventListener("blur", handleBlur);

        return () => {
            input.removeEventListener("focus", handleFocus);
            input.removeEventListener("blur", handleBlur);
            if (icon) gsap.killTweensOf(icon);
        };
    }, []);

    return inputRef;
}