import { ReactNode, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, isRouteTransitionRecent } from "@/lib/motion";

interface PageTitleProps {
    children: ReactNode;
    className?: string;
}

/**
 * Título de header con animación de entrada "wipe con máscara": el texto se
 * revela con un barrido clip-path de izquierda a derecha + leve slide.
 *
 * Coordinado con TransitionManager vía `isRouteTransitionRecent()` para acompañar
 * la entrada de página sin encimar una segunda ola de movimiento. Solo anima
 * `clip-path` y `x` (capas distintas al opacity/scale del contenedor padre), así
 * no hay efecto de "doble entrada". El `ctx.revert()` del cleanup neutraliza el
 * doble-invoke de useLayoutEffect en StrictMode.
 */
export default function PageTitle({ children, className }: PageTitleProps) {
    const titleRef = useRef<HTMLHeadingElement>(null);

    useLayoutEffect(() => {
        if (!titleRef.current) return;
        if (prefersReducedMotion()) return;

        const ctx = gsap.context(() => {
            gsap.fromTo(
                titleRef.current,
                { clipPath: "inset(0 100% 0 0)", x: -8 },
                {
                    clipPath: "inset(0 0% 0 0)",
                    x: 0,
                    duration: 0.6,
                    ease: "power3.inOut",
                    delay: isRouteTransitionRecent() ? 0.05 : 0.15,
                }
            );
        }, titleRef);

        return () => ctx.revert();
    }, []);

    // whitespace-nowrap: el título es un ítem flex dentro del header y, si se lo deja
    // encoger, palabras largas como "Configuración" se parten en dos líneas. Forzamos
    // una sola línea en todas las secciones.
    return (
        <h1 ref={titleRef} className={`whitespace-nowrap ${className ?? ""}`}>
            {children}
        </h1>
    );
}
