import { useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { subscribeToUserActiveAppointment, cancelAppointment } from "@/services/appointments";
import { getActiveAnnouncement, Announcement } from "@/services/announcements";
import AnimatedLayout from "@/components/AnimatedLayout";
import { toast } from "sonner";
import NotificationPrompt from "@/components/NotificationPrompt";

// Custom Hooks
import { useFcmToken } from "@/hooks/useFcmToken";

// Components
import HomeHeader from "@/components/home/HomeHeader";
import HomeMenu from "@/components/home/HomeMenu";
import HomeAnnouncement from "@/components/home/HomeAnnouncement";
import ActiveReservation from "@/components/home/ActiveReservation";
import CancelReservationDialog from "@/components/home/CancelReservationDialog";

export default function Home() {
    const { user, isAdmin } = useUser();
    const { setLoading } = useUI();
    
    // Local State
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [reserve, setReserve] = useState<any>(null);
    const [isLoadingReserve, setIsLoadingReserve] = useState(true);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [showNotifPrompt, setShowNotifPrompt] = useState(false);

    // Sync FCM Token
    useFcmToken(user);

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
        if (location.state?.reservationSuccess && Notification.permission !== "granted") {
            setShowNotifPrompt(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

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
        <AnimatedLayout className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Notification Prompt Overlay */}
            {showNotifPrompt && (
                <NotificationPrompt
                    onDismiss={() => setShowNotifPrompt(false)}
                    onSuccess={() => setShowNotifPrompt(false)}
                />
            )}

            <HomeHeader user={user} />

            <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6 flex-1 flex flex-col justify-center w-full">
                
                {/* Announcements */}
                {!isAdmin && announcement && (
                    <HomeAnnouncement announcement={announcement} />
                )}

                {/* Active Reservation Widget */}
                {!isAdmin && (
                    <ActiveReservation 
                        reserve={reserve} 
                        isLoading={isLoadingReserve} 
                        onCancel={() => setShowCancelDialog(true)} 
                    />
                )}

                {/* Main Menu */}
                <HomeMenu isAdmin={isAdmin} />

                {/* Dialogs */}
                <CancelReservationDialog 
                    open={showCancelDialog} 
                    onClose={() => setShowCancelDialog(false)} 
                    onConfirm={handleCancelReserve} 
                />

            </div>
        </AnimatedLayout>
    );
}
