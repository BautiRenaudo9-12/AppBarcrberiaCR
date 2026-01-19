import { useEffect } from "react";
import { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requestForToken } from "@/services/notifications";

export function useFcmToken(user: User | null) {
    useEffect(() => {
        if (!user || !user.email) {
            console.log("ℹ️ [useFcmToken] No user or email, skipping token sync.");
            return;
        }

        const syncToken = async () => {
            console.log("🔄 [useFcmToken] Starting token sync for", user.email);
            try {
                const token = await requestForToken();
                if (token) {
                    const storedToken = localStorage.getItem('fcmToken');
                    // Only update Firestore if the token has changed locally
                    if (storedToken !== token) {
                        console.log("📝 [useFcmToken] Token changed, updating Firestore...");
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
    }, [user]);
}
