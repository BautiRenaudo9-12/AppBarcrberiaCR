// Utilidades de animación compartidas.

/** Respeta la preferencia del SO de "movimiento reducido". */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// --- Coordinación con TransitionManager --------------------------------------
// TransitionManager anima la página entera al entrar. Las animaciones de entrada
// por página consultan esto para no encimar una segunda ola de movimiento
// (evita el efecto "doble entrada" cuando se navega entre rutas).
let lastTransitionAt = 0;

/** Marca que recién ocurrió una transición de ruta. */
export function markRouteTransition() {
  lastTransitionAt = Date.now();
}

/** True si hubo una transición de ruta en los últimos `windowMs`. */
export function isRouteTransitionRecent(windowMs = 450): boolean {
  return Date.now() - lastTransitionAt < windowMs;
}
