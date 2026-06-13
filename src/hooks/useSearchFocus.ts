import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export function useSearchFocus() {
    const inputRef = useRef<HTMLInputElement>(null);
    const iconRef = useRef<Element | null>(null);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;

        const icon = input.parentElement?.querySelector("[data-search-icon]") as Element | null;
        iconRef.current = icon;

        const handleFocus = () => {
            gsap.to(input, { boxShadow: "0 0 0 2px rgba(48, 209, 88, 0.3)", duration: 0.3, ease: "power2.out" });
            if (icon) gsap.to(icon, { rotation: -10, duration: 0.2, ease: "power2.out" });
        };

        const handleBlur = () => {
            gsap.to(input, { boxShadow: "0 0 0 0px rgba(48, 209, 88, 0)", duration: 0.3, ease: "power2.in" });
            if (icon) gsap.to(icon, { rotation: 0, duration: 0.2, ease: "power2.in" });
        };

        input.addEventListener("focus", handleFocus);
        input.addEventListener("blur", handleBlur);

        return () => {
            input.removeEventListener("focus", handleFocus);
            input.removeEventListener("blur", handleBlur);
            gsap.killTweensOf(input);
            if (icon) gsap.killTweensOf(icon);
        };
    }, []);

    return inputRef;
}