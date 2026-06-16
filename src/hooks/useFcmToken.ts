import { useEffect } from "react";
import { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requestForToken } from "@/services/notifications";

export function useFcmToken(user: User | null, dbToken?: string, enabled: boolean = true, isAdmin: boolean = false) {
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

        if (!enabled) {
            console.log("ℹ️ [useFcmToken] User opted out of notifications, skipping token sync.");
            return;
        }

        const syncToken = async () => {
            console.log("🔄 [useFcmToken] Starting token sync for", user.email);
            try {
                const token = await requestForToken();
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
