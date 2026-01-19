import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Edit2, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { useHistoryCount, useUserInfo } from "@/hooks/useUserQuery";
import AnimatedLayout from "@/components/AnimatedLayout";
import { requestForToken } from "@/services/notifications";
import { updateUserProfile } from "@/services/users";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { isAdmin, userProfile, setUserProfile } = useUser();
  const navigate = useNavigate();
  const [loadingNotif, setLoadingNotif] = useState(false);

  // Queries
  const { data: visitCount = 0 } = useHistoryCount();
  const { data: fetchedProfile } = useUserInfo();

  // Sync React Query data with Context if context is empty
  useEffect(() => {
      if (fetchedProfile && !userProfile) {
          setUserProfile(fetchedProfile);
      }
  }, [fetchedProfile, userProfile, setUserProfile]);

  const handleSignOut = async () => {
    localStorage.removeItem("USER_INFO");
    localStorage.removeItem("RESERVE");
    localStorage.removeItem("IS_ADMIN");
    await signOut(auth);
    navigate("/"); 
  };

  const handleEnableNotifications = async () => {
      setLoadingNotif(true);
      try {
          const token = await requestForToken();
          if (token && userProfile?.email) {
              await updateUserProfile(userProfile.email, { fcmToken: token });
              toast.success("Notificaciones activadas correctamente");
          } else if (!token) {
              if (Notification.permission === "denied") {
                  toast.error("Permiso denegado. Habilita las notificaciones en el navegador.");
              } else {
                  toast.error("No se pudo obtener el token. Intenta nuevamente.");
              }
          }
      } catch (error) {
          console.error(error);
          toast.error("Error al activar notificaciones");
      } finally {
          setLoadingNotif(false);
      }
  };

  const displayProfile = userProfile || fetchedProfile;

  const initials = displayProfile?.name 
    ? displayProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <AnimatedLayout className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-accent">{initials}</span>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{displayProfile?.name || "Cargando..."}</h2>
            <p className="text-xs text-muted-foreground font-medium">{isAdmin ? "Administrador" : "Cliente"}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Información de contacto</p>
          <div className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Correo Electrónico</p>
              <p className="font-medium">{displayProfile?.email || "-"}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Teléfono</p>
              <p className="font-medium">{displayProfile?.nro || "-"}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Estadísticas</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-accent mb-1">{visitCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Visitas</p>
            </div>
            <div className="bg-card border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-3xl font-bold text-accent mb-1">5.0</p>
              <p className="text-xs text-muted-foreground font-medium">Calificación</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Configuración de cuenta</p>
          <div className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
            <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors group text-left">
              <Edit2 className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium">Editar Perfil</p>
                <p className="text-xs text-muted-foreground font-medium">Actualiza tu información</p>
              </div>
              <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button 
                onClick={handleEnableNotifications}
                disabled={loadingNotif}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors group text-left"
            >
              <Bell className={`w-5 h-5 text-accent ${loadingNotif ? "animate-pulse" : ""}`} />
              <div className="flex-1">
                <p className="font-medium">
                    {loadingNotif ? "Activando..." : "Notificaciones"}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                    {loadingNotif ? "Sincronizando..." : "Gestiona alertas"}
                </p>
              </div>
              <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button 
                className="w-full bg-destructive/20 hover:bg-destructive/30 text-red-100 border border-destructive/30 py-3 rounded-2xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-white/10 text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Tendrás que volver a ingresar tus credenciales para acceder a tus turnos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary hover:bg-secondary/80 border-0">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSignOut}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Cerrar Sesión
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AnimatedLayout>
  );
}
