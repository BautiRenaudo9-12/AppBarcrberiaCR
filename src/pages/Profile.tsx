import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Edit2, Bell, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserInfo, getHistory } from "@/services/users";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";

export default function Profile() {
  const [visitCount, setVisitCount] = useState(0);
  const { isAdmin, userProfile, setUserProfile } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // If not in context (first time or clear cache), fetch and update context
    if (!userProfile) {
       getUserInfo().then(info => setUserProfile(info));
    }
    getHistory().then((snap) => setVisitCount(snap.docs.length));
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("USER_INFO");
    localStorage.removeItem("RESERVE");
    localStorage.removeItem("IS_ADMIN");
    await signOut(auth);
    navigate("/"); 
  };

  const initials = userProfile?.name 
    ? userProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen bg-background text-foreground">
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
            <h2 className="text-xl font-bold">{userProfile?.name || "Cargando..."}</h2>
            <p className="text-xs text-muted-foreground font-medium">{isAdmin ? "Administrador" : "Cliente"}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Información de contacto</p>
          <div className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Correo Electrónico</p>
              <p className="font-medium">{userProfile?.email || "-"}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Teléfono</p>
              <p className="font-medium">{userProfile?.nro || "-"}</p>
            </div>
            {/* Registration date not in legacy model */}
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
            <button className="w-full px-5 py-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors group text-left">
              <Bell className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium">Notificaciones</p>
                <p className="text-xs text-muted-foreground font-medium">Gestiona alertas</p>
              </div>
              <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button 
            onClick={handleSignOut}
            className="w-full bg-destructive/15 hover:bg-destructive/25 text-destructive py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
