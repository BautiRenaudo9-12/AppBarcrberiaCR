import { useEffect } from "react";
import { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requestForToken } from "@/services/notifications";

export function useFcmToken(user: User | null) {
    useEffect(() => {
        if (!user || !user.email) return;

        const syncToken = async () => {
            try {
                const token = await requestForToken();
                if (token) {
                    const storedToken = localStorage.getItem('fcmToken');
                    // Only update Firestore if the token has changed locally
                    if (storedToken !== token) {
                        await updateDoc(doc(db, "clientes", user.email!), {
                            fcmToken: token
                        });
                        localStorage.setItem('fcmToken', token);
                        console.log("FCM Token updated in Firestore");
                    }
                }
            } catch (error) {
                console.error("Error syncing FCM token:", error);
            }
        };

        syncToken();
    }, [user]);
}
