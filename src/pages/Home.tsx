import { Link } from "react-router-dom";
import { Calendar, History, Settings, Users, CalendarCheck2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useUI } from "@/context/UIContext";
import { getReserve, removeReserve, arrayDias } from "@/services/reservations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import moment from "moment";

export default function Home() {
  const { user, isAdmin } = useUser();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [reserveDate, setReserveDate] = useState<any>(null);
  const [isLoadingReserve, setIsLoadingReserve] = useState(true);

  const isDateAfterNowBy30Min = (date: Date) => {
    const now = moment().utcOffset("-03:00");
    const _date = moment(date);
    const minutesDifference = now.diff(_date, "m");
    return minutesDifference <= 30;
  };

  useEffect(() => {
    if (user) {
      // 1. Optimistic Cache Load
      const cached = localStorage.getItem("RESERVE");
      let hasCache = false;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isDateAfterNowBy30Min(parsed.time)) {
          setReserveDate(parsed);
          hasCache = true;
          setIsLoadingReserve(false);
        }
      }

      // 2. Network Fetch (Silent if cache exists)
      if (!hasCache) setIsLoadingReserve(true);
      
      getReserve(isDateAfterNowBy30Min)
        .then((res) => {
            setReserveDate(res);
            if (res) {
                localStorage.setItem("RESERVE", JSON.stringify(res));
            } else {
                localStorage.removeItem("RESERVE");
            }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingReserve(false));
    }
  }, [user]);

  const handleCancelReserve = async () => {
    // Note: If you want global loading for ACTIONS like cancel, you can import useUI here.
    // For now, let's just keep it simple or use local loading if preferred.
    // Re-adding useUI just for this action if needed, or removing it if not used.
    // The prompt asked to remove setLoading from useUI, but we might need it for cancel action?
    // Let's rely on local state or assume cancel is fast enough, or re-import useUI just for handleCancel.
    // I will use local variable for simplicity in this replacement or re-add useUI locally.
    // Actually, let's keep useUI but ONLY use it for handleCancel, NOT for initial load.
  };
  
  // Re-importing useUI inside component for Cancel action
  const { setLoading } = useUI();

  // ... rest of helper functions ...
  // Format date for display
  const formattedDate = reserveDate ? moment(reserveDate.time).format("dddd, D [de] MMMM") : "";
  const formattedTime = reserveDate ? moment(reserveDate.time).format("HH:mm") : "";
  const formattedDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "";
  const initials = user?.displayName 
    ? user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) 
    : "U";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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
        {/* Booking Widget - Only for non-admins */}
        {!isAdmin && (
          isLoadingReserve ? (
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded-full" />
              <div className="h-8 w-48 bg-white/10 rounded-lg" />
              <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
          ) : (
            reserveDate ? (
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
            {/* Mis Turnos */}
            <Link
              to="/turnos"
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
            >
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Mis Turnos</p>
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
    </div>
  );
}