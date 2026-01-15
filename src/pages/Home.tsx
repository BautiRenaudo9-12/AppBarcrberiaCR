import { Link } from "react-router-dom";
import { Calendar, History, Settings, Users, CalendarCheck2, Megaphone } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { getUserActiveAppointment, cancelAppointment } from "@/services/appointments";
import { getActiveAnnouncement, Announcement } from "@/services/announcements";
import { requestForToken } from "@/services/notifications";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import moment from "moment";
import AnimatedLayout from "@/components/AnimatedLayout";
import { toast } from "sonner";

export default function Home() {
  const { user, isAdmin } = useUser();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reserve, setReserve] = useState<any>(null);
  const [isLoadingReserve, setIsLoadingReserve] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const { setLoading } = useUI();

  useEffect(() => {
    // Load active announcement
    getActiveAnnouncement().then(setAnnouncement);

    const fetchReserve = async () => {
        if (!user) return;
        
        // Setup Notifications
        requestForToken().then(token => {
            if (token && user.email) {
                // Save token to user profile
                updateDoc(doc(db, "clientes", user.email), {
                    fcmToken: token
                }).catch(e => console.log("Error saving token", e));
            }
        });

        setIsLoadingReserve(true);
        try {
            const app = await getUserActiveAppointment(user.email!);
            setReserve(app);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingReserve(false);
        }
    };

    fetchReserve();
  }, [user]);

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
  
  // Format date for display
  const dateObj = reserve ? reserve.timestamp.toDate() : null;
  const formattedDate = dateObj ? moment(dateObj).format("dddd, D [de] MMMM") : "";
  const formattedTime = dateObj ? moment(dateObj).format("HH:mm") : "";
  const formattedDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
  const initials = user?.displayName 
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) 
    : "U";

  return (
    <AnimatedLayout className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl px-4 py-4 sm:px-6 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                {firstName ? `Hola, ${firstName}` : "Bienvenido"}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Barberia CR</h1>
            </div>
          </div>
          <Link to="/profile">
            <Avatar className="h-10 w-10 border-2 border-accent/20 transition-transform hover:scale-105">
              <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "Usuario"} />
              <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6 flex-1 flex flex-col justify-center w-full">
        
        {/* Active Announcement Block (Option 2: Side Slide) - Hidden for Admins */}
        {!isAdmin && announcement && (
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-100 text-slate-900 rounded-3xl p-6 shadow-xl border border-white/20 flex items-start gap-5 animate-in slide-in-from-left-full fade-in duration-700 ease-out delay-200 fill-mode-backwards group hover:scale-[1.02] transition-transform">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="relative text-4xl shrink-0 bg-white shadow-sm w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100">
              {announcement.icono}
            </div>
            
            <div className="relative flex-1 py-1">
              <h3 className="font-bold text-lg leading-tight mb-2 flex items-center gap-2">
                Atención
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h3>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                {announcement.texto}
              </p>
            </div>
          </div>
        )}

        {/* Booking Widget - Only for non-admins */}
        {!isAdmin && (
          isLoadingReserve ? (
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded-full" />
              <div className="h-8 w-48 bg-white/10 rounded-lg" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ) : (
            reserve ? (
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-accent/15 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Card */}
              <div className="relative bg-card border border-white/10 rounded-3xl p-5 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Tu próximo turno</p>
                  <h2 className="text-xl font-semibold capitalize">{formattedDateCapitalized}</h2>
                  <p className="text-sm text-muted-foreground font-medium">{formattedTime} - Corte de cabello</p>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="text-sm text-destructive hover:text-destructive/80 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : (
              <div className="relative bg-card/50 border border-white/5 rounded-3xl p-5 space-y-2 text-center py-8">
                  <p className="text-muted-foreground text-sm">No tienes turnos próximos</p>
                  <Link to="/turnos" className="text-accent text-sm font-medium hover:underline">
                      Reservar ahora
                  </Link>
              </div>
          )
        ))}

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-3xl p-6 w-full sm:w-auto sm:max-w-sm space-y-4 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-300">
              <h3 className="text-lg font-semibold">¿Cancelar este turno?</h3>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-3 font-medium transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleCancelReserve}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl py-3 font-medium transition-colors"
                >
                  Cancelar turno
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Menu - iOS Inset Grouped Style */}
        <div className="space-y-3">
          <div className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
            {/* Reservar Turno */}
            <Link
              to="/turnos"
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Reservar Turno</p>
                <p className="text-xs text-muted-foreground font-medium">Ver disponibilidad</p>
              </div>
              <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            {/* Historial */}
            <Link
              to="/historial"
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                <History className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Historial</p>
                <p className="text-xs text-muted-foreground font-medium">Tu historial de visitas</p>
              </div>
              <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
            </Link>

            {/* Admin Section */}
            {isAdmin && (
              <>
                 <Link 
                  to="/admin-turnos" 
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                    <CalendarCheck2 className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Agenda</p>
                    <p className="text-xs text-muted-foreground font-medium">Ver turnos reservados</p>
                  </div>
                  <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link 
                  to="/configuracion" 
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                    <Settings className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Configuración</p>
                    <p className="text-xs text-muted-foreground font-medium">Panel de administración</p>
                  </div>
                  <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link 
                  to="/admin-anuncios" 
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                    <Megaphone className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Anuncios</p>
                    <p className="text-xs text-muted-foreground font-medium">Gestionar campañas</p>
                  </div>
                  <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link 
                  to="/clientes" 
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                >
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                    <Users className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Clientes</p>
                    <p className="text-xs text-muted-foreground font-medium">Gestión de usuarios</p>
                  </div>
                  <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </AnimatedLayout>
  );
}
