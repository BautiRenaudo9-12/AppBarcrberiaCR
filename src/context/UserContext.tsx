import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { ensureClientProfile } from "@/services/users";
import { getGoogleRedirectResult } from "@/services/auth";
import { subscribeToUserActiveAppointment, Appointment } from "@/services/appointments";
import { useUI } from "./UIContext";

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  isSigned: boolean | null;
  userProfile: any;
  setUserProfile: (profile: any) => void;
  needsPhone: boolean;
  activeAppointment: Appointment | null;
  isLoadingAppointment: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Lee y parsea un valor JSON de localStorage de forma segura: si está corrupto
// (p. ej. editado a mano) devuelve null en vez de tirar y romper el montaje de la app.
const safeParse = (key: string) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Initialize from LocalStorage for immediate UI feedback
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("IS_ADMIN") === "true";
  });
  
  const [userProfile, setUserProfile] = useState(() => safeParse("USER_INFO"));

  const [isSigned, setIsSigned] = useState<boolean | null>(null); // null = checking
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);
  const { setLoading } = useUI();

  // Resuelve el resultado del login con Google (signInWithRedirect) al volver.
  // El alta del doc la maneja onAuthStateChanged; acá solo capturamos errores.
  useEffect(() => {
    getGoogleRedirectResult().catch((error: any) => {
      if (error?.code === "auth/account-exists-with-different-credential") {
        toast.error("Ya existe una cuenta con ese correo. Ingresá con tu contraseña.");
      } else if (error) {
        toast.error("No se pudo iniciar sesión con Google. Intentá de nuevo.");
      }
    });
  }, []);

  useEffect(() => {
    const adminEmails: string[] = JSON.parse(import.meta.env.VITE_ADMIN_EMAILS || "[]");
    // Only set loading if we don't have cached data to show
    if (!userProfile && !isAdmin) {
      setLoading(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsSigned(true);

        // Calculate Admin Status
        const normalizedUser = currentUser.email?.trim().toLowerCase();
        const adminStatus = adminEmails.map(e => e.trim().toLowerCase()).includes(normalizedUser || "");

        setIsAdmin(adminStatus);
        localStorage.setItem("IS_ADMIN", String(adminStatus));

        // Aseguramos el doc clientes/{email} (crea el perfil para usuarios nuevos
        // de Google, que llegan sin teléfono). Se omite para admins para no crear
        // un doc de cliente para el barbero.
        if (!adminStatus) {
          ensureClientProfile(currentUser)
            .then((profile) => {
              if (profile) updateUserProfile(profile);
            })
            .catch((err) => console.error("Error ensuring client profile:", err));
        }

      } else {
        setUser(null);
        setIsSigned(false);
        setIsAdmin(false);
        setUserProfile(null);
        
        // Clear sensitive session data on explicit logout/null auth
        localStorage.removeItem("IS_ADMIN");
        // We might want to keep USER_INFO for "Remember me" UX, but for security let's clear if auth is gone
        // However, onAuthStateChanged fires on refresh too. If no user, clear.
        localStorage.removeItem("USER_INFO"); 
        localStorage.removeItem("USER_SESSION");
        localStorage.removeItem("RESERVE");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setLoading]);

  // Suscripción al turno activo del cliente (única fuente de verdad para el guard de
  // /turnos, el menú del home y el widget de reserva). Los admins no se suscriben: pueden
  // reservar para varios clientes y no deben quedar bloqueados.
  useEffect(() => {
    if (isSigned !== true || isAdmin || !user?.email) {
      setActiveAppointment(null);
      setIsLoadingAppointment(false);
      return;
    }

    setIsLoadingAppointment(true);
    const unsubscribe = subscribeToUserActiveAppointment(user.email, (app) => {
      setActiveAppointment(app);
      setIsLoadingAppointment(false);
    });

    return () => unsubscribe();
  }, [isSigned, isAdmin, user?.email]);

  // Sync userProfile state with LocalStorage manually if needed (e.g. after profile update)
  const updateUserProfile = useCallback((profile: any) => {
      setUserProfile(profile);
      if (profile) {
          localStorage.setItem("USER_INFO", JSON.stringify(profile));
      } else {
          localStorage.removeItem("USER_INFO");
      }
  }, []);

  // El usuario (no admin) ya autenticado pero sin teléfono debe completarlo
  // antes de poder usar la app (paso obligatorio del login con Google).
  const needsPhone =
    isSigned === true && !isAdmin && !!userProfile && !String(userProfile.nro || "").trim();

  // Memoizamos el value para no re-renderizar a todos los consumidores de useUser
  // en cada render del provider.
  const value = useMemo<UserContextType>(
    () => ({ user, isSigned, isAdmin, userProfile, setUserProfile: updateUserProfile, needsPhone, activeAppointment, isLoadingAppointment }),
    [user, isSigned, isAdmin, userProfile, updateUserProfile, needsPhone, activeAppointment, isLoadingAppointment]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
