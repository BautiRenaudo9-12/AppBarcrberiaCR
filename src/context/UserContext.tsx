import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUI } from "./UIContext";

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  isSigned: boolean | null;
  userProfile: any;
  setUserProfile: (profile: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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
  
  const [userProfile, setUserProfile] = useState(() => {
    const stored = localStorage.getItem("USER_INFO");
    return stored ? JSON.parse(stored) : null;
  });

  const [isSigned, setIsSigned] = useState<boolean | null>(null); // null = checking
  const { setLoading } = useUI();

  useEffect(() => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
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
        const normalizedEnv = adminEmail?.trim().toLowerCase();
        const adminStatus = normalizedUser === normalizedEnv || normalizedUser === "renaudobautista@gmail.com";
        
        setIsAdmin(adminStatus);
        localStorage.setItem("IS_ADMIN", String(adminStatus));
        
        // Note: User Profile (USER_INFO) is usually fetched by the Profile page or Login.
        // If we want to ensure it's here, we could fetch it, but existing logic does it on demand.
        // We just ensure the context state reflects what's in LS.
        
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

  // Sync userProfile state with LocalStorage manually if needed (e.g. after profile update)
  const updateUserProfile = (profile: any) => {
      setUserProfile(profile);
      if (profile) {
          localStorage.setItem("USER_INFO", JSON.stringify(profile));
      } else {
          localStorage.removeItem("USER_INFO");
      }
  };

  return (
    <UserContext.Provider value={{ user, isSigned, isAdmin, userProfile, setUserProfile: updateUserProfile }}>
      {children}
    </UserContext.Provider>
  );
};
