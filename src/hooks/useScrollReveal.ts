import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Revela los hijos directos del contenedor a medida que entran al viewport.
 * Los que ya están en pantalla al activarse se animan de inmediato.
 *
 * `active` debe pasar a `true` una vez que el contenido (async) está montado,
 * para medir los hijos reales. Respeta movimiento reducido (deja todo visible).
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(active: boolean) {
  const containerRef = useRef<T>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !active) return;
    if (prefersReducedMotion()) return;

    const items = Array.from(container.children) as HTMLElement[];
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 92%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, [active]);

  return containerRef;
}
