import { useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Feedback de "press" reutilizable para botones: escala al apretar y vuelve con
 * un rebote al soltar. Sólo anima transform (GPU) y respeta movimiento reducido.
 *
 * Uso:
 *   const { ref, ...press } = usePressScale();
 *   <button ref={ref} {...press} onClick={...} />
 */
export function usePressScale<T extends HTMLElement = HTMLButtonElement>(downScale = 0.95) {
  const ref = useRef<T>(null);

  const onPointerDown = () => {
    if (prefersReducedMotion() || !ref.current) return;
    gsap.to(ref.current, { scale: downScale, duration: 0.1 });
  };

  const onPointerUp = () => {
    if (!ref.current) return;
    gsap.to(ref.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });
  };

  return { ref, onPointerDown, onPointerUp, onPointerLeave: onPointerUp };
}
