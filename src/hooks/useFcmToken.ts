import { useEffect } from "react";
import { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requestForToken } from "@/services/notifications";

// `enabled` es tri-estado a propósito: `undefined` significa "todavía no sabemos si el
// cliente tiene las notificaciones activadas" (el perfil no cargó aún). No alcanza con
// asumir `true`: el opt-out es de la app, no del navegador, así que el permiso sigue en
// "granted" y sincronizar en esa ventana le vuelve a escribir el token a quien se dio de baja.
export function useFcmToken(user: User | null, dbToken?: string, enabled?: boolean, isAdmin: boolean = false) {
    useEffect(() => {
        if (!user || !user.email) {
            console.log("ℹ️ [useFcmToken] No user or email, skipping token sync.");
            return;
        }

        if (isAdmin) {
            console.log("ℹ️ [useFcmToken] Admin user, skipping token sync.");
            if (dbToken) {
                updateDoc(doc(db, "clientes", user.email!), { fcmToken: null })
                    .then(() => {
                        localStorage.removeItem('fcmToken');
                        console.log("✅ [useFcmToken] Cleared existing FCM token for admin");
                    })
                    .catch((err) => console.error("❌ [useFcmToken] Error clearing admin token:", err));
            }
            return;
        }

        if (enabled === undefined) {
            console.log("ℹ️ [useFcmToken] Perfil sin cargar, esperando para sincronizar.");
            return;
        }

        if (!enabled) {
            // El usuario desactivó las notificaciones: además de no sincronizar, hay que
            // limpiar el token de Firestore para que el cron de recordatorios deje de
            // enviarle push (de lo contrario el opt-out no se respeta del lado del servidor).
            if (dbToken) {
                updateDoc(doc(db, "clientes", user.email!), { fcmToken: null })
                    .then(() => {
                        localStorage.removeItem("fcmToken");
                        console.log("✅ [useFcmToken] Cleared FCM token after opt-out");
                    })
                    .catch((err) => console.error("❌ [useFcmToken] Error clearing token on opt-out:", err));
            }
            return;
        }

        const syncToken = async () => {
            console.log("🔄 [useFcmToken] Starting token sync for", user.email);
            try {
                const result = await requestForToken();
                const token = result.status === "success" ? result.token! : null;
                if (token) {
                    const storedToken = localStorage.getItem('fcmToken');
                    
                    // Update if:
                    // 1. Token changed locally (storedToken !== token)
                    // 2. OR Database doesn't have it (dbToken missing)
                    // 3. OR Database has a different one (dbToken !== token)
                    const needsUpdate = storedToken !== token || !dbToken || dbToken !== token;

                    if (needsUpdate) {
                        console.log("📝 [useFcmToken] Token mismatch or missing in DB, updating Firestore...");
                        await updateDoc(doc(db, "clientes", user.email!), {
                            fcmToken: token
                        });
                        localStorage.setItem('fcmToken', token);
                        console.log("✅ [useFcmToken] FCM Token updated in Firestore");
                    } else {
                        console.log("✅ [useFcmToken] Token already up to date.");
                    }
                } else {
                    console.warn("⚠️ [useFcmToken] Failed to get token.");
                }
            } catch (error) {
                console.error("❌ [useFcmToken] Error syncing FCM token:", error);
            }
        };

        syncToken();
    }, [user, dbToken, enabled, isAdmin]);
}
