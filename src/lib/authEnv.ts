// Detección de entorno para elegir el método de login con Google.
// Popup funciona bien en navegadores desktop; en mobile, PWA instalada y WebView
// el popup suele bloquearse o no estar soportado, así que ahí preferimos redirect.

/** True si la app corre como PWA instalada (standalone). */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/** True si es un dispositivo móvil o tablet. */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Windows Phone/i.test(ua)) return true;
  // iPadOS se presenta como "Macintosh" pero reporta puntos táctiles.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
}

/** True para in-app browsers / WebView conocidos (FB, Instagram, etc.). */
export function isInAppWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|Line|; wv\)|GSA/i.test(ua);
}

/**
 * Decide si conviene usar redirect en vez de popup para el login con Google.
 * Redirect en mobile, PWA instalada y WebView; popup queda para desktop.
 */
export function prefersRedirectSignIn(): boolean {
  if (typeof window === "undefined") return false;
  return isStandalonePWA() || isMobileDevice() || isInAppWebView();
}
