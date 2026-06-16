import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Edit2, Bell } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { useHistoryCount, useUserInfo } from "@/hooks/useUserQuery";
import { useProfileAnimations } from "@/hooks/useProfileAnimations";
import { useCounter } from "@/hooks/useCounter";
import { useQueryClient } from "@tanstack/react-query";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import NotificationsDialog from "@/components/profile/NotificationsDialog";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";

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
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pageRef = useProfileAnimations();

  const { data: visitCount = 0 } = useHistoryCount();
  const visitCountRef = useCounter(visitCount);
  const { data: fetchedProfile } = useUserInfo();

  const logoutBtnRef = useRef<HTMLButtonElement>(null);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const notifBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
      if (fetchedProfile && !userProfile) {
          setUserProfile(fetchedProfile);
      }
  }, [fetchedProfile, userProfile, setUserProfile]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const buttons = [
      { ref: editBtnRef, hasArrow: true },
      { ref: notifBtnRef, hasArrow: true },
    ];

    const cleanups: (() => void)[] = [];

    buttons.forEach(({ ref, hasArrow }) => {
      const btn = ref.current;
      if (!btn) return;

      const icon = btn.querySelector("[data-btn-icon]");
      const arrow = hasArrow ? btn.querySelector("[data-btn-arrow]") : null;

      const onEnter = () => {
        if (icon) gsap.to(icon, { scale: 1.15, duration: 0.25, ease: "back.out(2)" });
        if (arrow) gsap.to(arrow, { x: 6, duration: 0.25, ease: "power2.out" });
      };

      const onLeave = () => {
        if (icon) gsap.to(icon, { scale: 1, duration: 0.25, ease: "power2.out" });
        if (arrow) gsap.to(arrow, { x: 0, duration: 0.25, ease: "power2.in" });
      };

      btn.addEventListener("mouseenter", onEnter);
      btn.addEventListener("mouseleave", onLeave);

      cleanups.push(() => {
        btn.removeEventListener("mouseenter", onEnter);
        btn.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => cleanups.forEach(fn => fn());
  }, []);

  useEffect(() => {
    const btn = logoutBtnRef.current;
    if (!btn) return;
    if (prefersReducedMotion()) return;

    // Sólo transform (GPU); la sombra de hover la maneja CSS.
    const onEnter = () => {
      gsap.to(btn, { scale: 1.02, duration: 0.3, ease: "power2.out" });
    };
    const onLeave = () => {
      gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.in" });
    };

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);

    return () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(btn);
    };
  }, []);

  const handleLogoutClick = useCallback(() => {
    if (!logoutBtnRef.current || prefersReducedMotion()) return;
    gsap.fromTo(logoutBtnRef.current, { x: 0 }, { x: 3, duration: 0.05, yoyo: true, repeat: 3, ease: "power2.inOut" });
  }, []);

  const handleSignOut = async () => {
    localStorage.removeItem("USER_INFO");
    localStorage.removeItem("RESERVE");
    localStorage.removeItem("IS_ADMIN");
    await signOut(auth);
    navigate("/");
  };

  const displayProfile = userProfile || fetchedProfile;

  const initials = displayProfile?.name
    ? displayProfile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const notifBlocked =
    typeof Notification !== "undefined" && Notification.permission === "denied";
  const notifEnabled =
    !!displayProfile?.fcmToken && displayProfile?.notifEnabled !== false && !notifBlocked;
  const notifStatusLabel = notifBlocked
    ? "Bloqueadas"
    : notifEnabled
    ? "Activadas"
    : "Desactivadas";

  const handleProfileSaved = ({ name, nro }: { name: string; nro: string }) => {
    setUserProfile({ ...displayProfile, name, nro });
    queryClient.invalidateQueries({ queryKey: ["user", "info"] });
  };

  const handleNotifChanged = ({
    fcmToken,
    notifEnabled: enabled,
  }: {
    fcmToken: string | null;
    notifEnabled: boolean;
  }) => {
    setUserProfile({ ...displayProfile, fcmToken, notifEnabled: enabled });
    queryClient.invalidateQueries({ queryKey: ["user", "info"] });
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to="/"
            data-header-stagger
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 data-header-stagger className="text-2xl font-bold">Mi Perfil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-4 sm:px-6 space-y-4">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-2">
          <div data-avatar-circle className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
            <span data-avatar-text className="text-2xl font-bold text-accent">{initials}</span>
          </div>
          <div className="text-center">
            <h2 data-profile-name className="text-lg font-bold">{displayProfile?.name || "Cargando..."}</h2>
            <p data-profile-role className="text-xs text-muted-foreground font-medium">{isAdmin ? "Administrador" : "Cliente"}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div data-section>
          <p data-section-label className="text-xs text-muted-foreground font-medium px-1 mb-2">Información de contacto</p>
          <div data-section-card className="bg-card border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10">
            <div data-section-item className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Correo Electrónico</p>
              <p className="font-medium">{displayProfile?.email || "-"}</p>
            </div>
            <div data-section-item className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Teléfono</p>
              <p className="font-medium">{displayProfile?.nro || "-"}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div data-section>
          <p data-section-label className="text-xs text-muted-foreground font-medium px-1 mb-2">Estadísticas</p>
          <div data-section-card className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-accent mb-1"><span ref={visitCountRef}>{visitCount}</span></p>
              <p className="text-xs text-muted-foreground font-medium">Visitas</p>
            </div>
            <div className="bg-card border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-accent mb-1">5.0</p>
              <p className="text-xs text-muted-foreground font-medium">Calificación</p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div data-section>
          <p data-section-label className="text-xs text-muted-foreground font-medium px-1 mb-2">Configuración de cuenta</p>
          <div data-section-card className="bg-card border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10">
            <button
              ref={editBtnRef}
              onClick={() => setEditOpen(true)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors group text-left"
            >
              <Edit2 data-btn-icon className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium">Editar Perfil</p>
                <p className="text-xs text-muted-foreground font-medium">Actualiza tu información</p>
              </div>
              <span data-btn-arrow className="text-muted-foreground font-medium">→</span>
            </button>
            <button
              ref={notifBtnRef}
              onClick={() => setNotifOpen(true)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors group text-left"
            >
              <Bell
                data-btn-icon
                className={`w-5 h-5 ${notifBlocked ? "text-destructive" : "text-accent"}`}
              />
              <div className="flex-1">
                <p className="font-medium">Notificaciones</p>
                <p className="text-xs text-muted-foreground font-medium">{notifStatusLabel}</p>
              </div>
              <span data-btn-arrow className="text-muted-foreground font-medium">→</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              ref={logoutBtnRef}
              data-logout-btn
              onClick={handleLogoutClick}
              className="w-full bg-destructive/20 hover:bg-destructive/30 text-red-100 border border-destructive/30 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-shadow hover:shadow-lg hover:shadow-destructive/20"
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

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        email={displayProfile?.email || ""}
        currentName={displayProfile?.name || ""}
        currentPhone={displayProfile?.nro || ""}
        onSaved={handleProfileSaved}
      />

      <NotificationsDialog
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        email={displayProfile?.email || ""}
        enabled={notifEnabled}
        onChanged={handleNotifChanged}
      />
    </div>
  );
}