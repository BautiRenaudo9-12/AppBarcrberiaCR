import { useLocation, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { cancelAppointment } from "@/services/appointments";
import { notifyWaitlist } from "@/services/waitlist";
import { getActiveAnnouncement, Announcement } from "@/services/announcements";
import { getNotificationPermission, requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";
import { toast } from "sonner";
import NotificationPrompt from "@/components/NotificationPrompt";
import ReminderOptInDialog from "@/components/home/ReminderOptInDialog";
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

// Cada cuánto, como máximo, volvemos a ofrecer activar los recordatorios tras reservar.
const REMINDER_PROMPT_KEY = "NOTIF_REMINDER_LAST_ASKED";
const REMINDER_THROTTLE_MS = 60 * 24 * 60 * 60 * 1000; // ~2 meses

export default function Home() {
    const { user, isAdmin, userProfile, setUserProfile, activeAppointment: reserve, isLoadingAppointment: isLoadingReserve } = useUser();
    const { setLoading } = useUI();
    const contentRef = useHomeAnimations();

    // Local State
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [showNotifPrompt, setShowNotifPrompt] = useState(false);
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ¿Conviene ofrecer activar recordatorios? Solo si no están realmente activas
    // (token + flag + permiso granted), no están bloqueadas en el navegador, y no
    // se ofreció en los últimos ~2 meses (throttle por dispositivo en localStorage).
    const shouldOfferReminder = () => {
        if (isAdmin || !user?.email) return false;

        const permission = getNotificationPermission();
        const blocked = permission === "denied";
        const active =
            !!userProfile?.fcmToken &&
            userProfile?.notifEnabled !== false &&
            permission === "granted";
        if (active || blocked) return false;

        const lastAsked = Number(localStorage.getItem(REMINDER_PROMPT_KEY) || 0);
        return Date.now() - lastAsked > REMINDER_THROTTLE_MS;
    };

    // Sync FCM Token. Pasamos `undefined` mientras no sepamos la preferencia real (ver
    // useFcmToken). Exigimos la clave presente y no solo el perfil: el USER_INFO cacheado
    // por una versión anterior no la trae, y asumir "activadas" ahí le re-escribiría el
    // token a quien se dio de baja, justo hasta que llegue el perfil fresco.
    // Chequeamos el TIPO del valor en vez de usar `in`: `userProfile` sale de localStorage y
    // puede ser cualquier JSON válido, no necesariamente un objeto (safeParse solo atrapa el
    // parseo roto, no un `5` o un `"texto"`). `"x" in 5` tira TypeError y se lleva puesto el
    // Home entero. Con `typeof` un perfil corrupto cae en "no sé" y esperamos al perfil fresco.
    const notifPreference =
        typeof userProfile?.notifEnabled === "boolean" ? userProfile.notifEnabled : undefined;

    useFcmToken(user, userProfile?.fcmToken, notifPreference, isAdmin);

    // Initial Data Load (Announcements)
    useEffect(() => {
        getActiveAnnouncement().then(setAnnouncement);
    }, []);

    // Handle Notification Prompt Logic
    const location = useLocation();
    useEffect(() => {
        if (location.state?.reservationSuccess) {
            setShowSuccess(true);
            window.history.replaceState({}, document.title);
            // El modal de recordatorios se abre al terminar la animación de éxito
            // (ver onDone de ReservationSuccess), no encima de ella.
            return;
        }

        // Proactive check for new users
        if (getNotificationPermission() === "default" && !localStorage.getItem("NOTIF_PROMPT_DISMISSED")) {
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
                const result = await requestForToken();
                if (result.status === "success") {
                    await updateUserProfile(user.email, { fcmToken: result.token!, notifEnabled: true });
                    setUserProfile({ ...userProfile, fcmToken: result.token!, notifEnabled: true });
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
            // Se liberó el turno: avisamos a la lista de espera de ese día (best-effort).
            notifyWaitlist(reserve.date);
            toast.success("Reserva cancelada");
            // El contexto se actualiza solo por la suscripción a turnos activos.
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
                <ReservationSuccess
                    onDone={() => {
                        setShowSuccess(false);
                        if (shouldOfferReminder()) {
                            localStorage.setItem(REMINDER_PROMPT_KEY, String(Date.now()));
                            setShowReminderDialog(true);
                        }
                    }}
                />
            )}

            {/* Notification Prompt Overlay */}
            {showNotifPrompt && (
                <NotificationPrompt
                    onDismiss={handleNotifDismiss}
                    onSuccess={handleNotifSuccess}
                />
            )}

            {/* Recordatorios post-reserva (modal centrado, máx. cada 2 meses) */}
            {user?.email && (
                <ReminderOptInDialog
                    open={showReminderDialog}
                    onClose={() => setShowReminderDialog(false)}
                    email={user.email}
                    onEnabled={({ fcmToken, notifEnabled }) =>
                        setUserProfile({ ...userProfile, fcmToken, notifEnabled })
                    }
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
