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

// --- Entrance animations de Home (mobile: una sola vez) ----------------------
// En mobile (<=768px) las animaciones de entrada de Home se ejecutan solo la
// primera vez que el componente se monta durante la sesión. En desktop siempre.
let homeEntrancePlayed = false;

export function shouldPlayHomeEntrance(): boolean {
  if (typeof window === "undefined") return true;
  if (window.innerWidth > 768) return true;
  return !homeEntrancePlayed;
}

export function markHomeEntrancePlayed() {
  homeEntrancePlayed = true;
}

export function resetHomeEntrancePlayed() {
  homeEntrancePlayed = false;
}

// --- Entrance animations de Profile (una sola vez por apertura de la app) -----
// El intro de Perfil se ejecuta solo la primera vez que se monta durante la
// sesión. Al navegar de vuelta a Perfil no se repite; se resetea al recargar
// o relanzar la app.
let profileEntrancePlayed = false;

export function shouldPlayProfileEntrance(): boolean {
  return !profileEntrancePlayed;
}

export function markProfileEntrancePlayed() {
  profileEntrancePlayed = true;
}
