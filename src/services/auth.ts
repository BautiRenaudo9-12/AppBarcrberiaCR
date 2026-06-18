import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { prefersRedirectSignIn } from "@/lib/authEnv";

const googleProvider = new GoogleAuthProvider();

// Inicia el flujo de Google eligiendo el método según el entorno:
// - Desktop → popup (devuelve el resultado por postMessage; no depende del storage
//   de terceros, que en redirect se particiona y rompe el flujo en silencio).
// - Mobile / PWA instalada / WebView → redirect (ahí el popup suele bloquearse o
//   no estar soportado).
// En desktop, si el popup es bloqueado o no está soportado, caemos a redirect.
export const signInWithGoogle = async () => {
  if (prefersRedirectSignIn()) {
    await signInWithRedirect(auth, googleProvider);
    return null; // el resultado llega al recargar (getGoogleRedirectResult)
  }
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (
      error?.code === "auth/popup-blocked" ||
      error?.code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
};

// Resuelve el resultado al volver del redirect (sólo se usa en el fallback).
// Útil además para capturar errores como `auth/account-exists-with-different-credential`.
export const getGoogleRedirectResult = () => getRedirectResult(auth);

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // In a real app, use toast instead of alert, but keeping logic close to original
    throw error;
  }
};

export const _setUserProperties = async ({ nameValue }: { nameValue: string; nroValue?: string }) => {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, {
    displayName: nameValue,
  });
};

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw error;
  }
};
