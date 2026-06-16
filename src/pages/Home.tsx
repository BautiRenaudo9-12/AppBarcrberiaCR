import { useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { subscribeToUserActiveAppointment, cancelAppointment } from "@/services/appointments";
import { getActiveAnnouncement, Announcement } from "@/services/announcements";
import { requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";
import { toast } from "sonner";
import NotificationPrompt from "@/components/NotificationPrompt";
import ReservationSuccess from "@/components/home/ReservationSuccess";
import { useHomeAnimations } from "@/hooks/useHomeAnimations";

// Custom Hooks
import { useFcmToken } from "@/hooks/useFcmToken";

// Components
import HomeHeader from "@/components/home/HomeHeader";
import HomeMenu from "@/components/home/HomeMenu";
import HomeAnnouncement from "@/components/home/HomeAnnouncement";
import ActiveReservation from "@/components/home/ActiveReservation";
import CancelReservationDialog from "@/components/home/CancelReservationDialog";

export default function Home() {
    const { user, isAdmin, userProfile } = useUser();
    const { setLoading } = useUI();
    const contentRef = useHomeAnimations();
    
    // Local State
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [reserve, setReserve] = useState<any>(null);
    const [isLoadingReserve, setIsLoadingReserve] = useState(true);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [showNotifPrompt, setShowNotifPrompt] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Sync FCM Token
    useFcmToken(user, userProfile?.fcmToken, userProfile?.notifEnabled !== false);

    // Initial Data Load (Announcements)
    useEffect(() => {
        getActiveAnnouncement().then(setAnnouncement);
    }, []);

    // Active Appointment Subscription
    useEffect(() => {
        if (!user || !user.email) return;

        setIsLoadingReserve(true);
        const unsubscribe = subscribeToUserActiveAppointment(user.email, (app) => {
            setReserve(app);
            setIsLoadingReserve(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Handle Notification Prompt Logic
    const location = useLocation();
    useEffect(() => {
        // Confirmación visual de la reserva (independiente del permiso de notificaciones).
        if (location.state?.reservationSuccess) {
            setShowSuccess(true);
        }

        // 1. If explicit success state (just reserved)
        if (location.state?.reservationSuccess && Notification.permission !== "granted") {
            setShowNotifPrompt(true);
            window.history.replaceState({}, document.title);
            return;
        }

        // 2. Proactive check for new users
        if (Notification.permission === "default" && !localStorage.getItem("NOTIF_PROMPT_DISMISSED")) {
             // Wait a bit before showing to not overwhelm immediately
             const timer = setTimeout(() => {
                 setShowNotifPrompt(true);
             }, 3000);
             return () => clearTimeout(timer);
        }
    }, [location]);

    const handleNotifSuccess = async () => {
        setShowNotifPrompt(false);
        if (user && user.email) {
            try {
                // Ensure we have the token and it's synced
                const token = await requestForToken();
                if (token) {
                    await updateUserProfile(user.email, { fcmToken: token });
                }
            } catch (e) {
                console.error("Error syncing token after prompt success", e);
            }
        }
    };

    const handleNotifDismiss = () => {
        setShowNotifPrompt(false);
        // Remember dismissal for this session/browser
        localStorage.setItem("NOTIF_PROMPT_DISMISSED", "true");
    };

    // Handle URL Actions (e.g. Cancel from Notification click)
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        const action = searchParams.get("action");
        const id = searchParams.get("id");

        if (action === "cancel" && id && reserve && reserve.id === id) {
            setShowCancelDialog(true);
            setSearchParams({});
        }
    }, [searchParams, reserve, setSearchParams]);

    // Handlers
    const handleCancelReserve = async () => {
        if (!reserve) return;
        setLoading(true);
        try {
            await cancelAppointment(reserve.id);
            toast.success("Reserva cancelada");
            setReserve(null);
            setShowCancelDialog(false);
        } catch (error) {
            toast.error("Error al cancelar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Reservation Success Overlay */}
            {showSuccess && (
                <ReservationSuccess onDone={() => setShowSuccess(false)} />
            )}

            {/* Notification Prompt Overlay */}
            {showNotifPrompt && (
                <NotificationPrompt
                    onDismiss={handleNotifDismiss}
                    onSuccess={handleNotifSuccess}
                />
            )}

            <HomeHeader user={user} />

            <div ref={contentRef} className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6 flex-1 flex flex-col justify-center w-full">
                
                {/* Announcements */}
                {!isAdmin && announcement && (
                    <HomeAnnouncement announcement={announcement} />
                )}

                {/* Active Reservation Widget */}
                {!isAdmin && (
                    <div data-animate="card">
                        <ActiveReservation 
                            reserve={reserve} 
                            isLoading={isLoadingReserve} 
                            onCancel={() => setShowCancelDialog(true)} 
                        />
                    </div>
                )}

                {/* Main Menu */}
                <div data-animate="menu">
                    <HomeMenu isAdmin={isAdmin} />
                </div>

                {/* Dialogs */}
                <CancelReservationDialog 
                    open={showCancelDialog} 
                    onClose={() => setShowCancelDialog(false)} 
                    onConfirm={handleCancelReserve} 
                />

            </div>
        </div>
    );
}
