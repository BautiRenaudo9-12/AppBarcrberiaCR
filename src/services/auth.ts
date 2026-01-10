import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
