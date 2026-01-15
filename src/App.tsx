import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Turnos from "./pages/Turnos";
import Historial from "./pages/Historial";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Configuracion from "./pages/Configuracion";
import Clientes from "./pages/Clientes";
import ListaTurnos from "./pages/ListaTurnos";
import Anuncios from "./pages/Anuncios";
import NotFound from "./pages/NotFound";
import { UIProvider } from "@/context/UIContext";
import { UserProvider, useUser } from "@/context/UserContext";
import InstallPrompt from "@/components/InstallPrompt";
import { useEffect } from "react";
import { onMessageListener, showNotification } from "@/services/notifications";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isSigned } = useUser();

  if (isSigned === null) return null; // Or loading spinner
  if (isSigned === false) return <Navigate to="/login" replace />;

  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isSigned, isAdmin } = useUser();

  if (isSigned === null) return null;
  if (isSigned === false) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turnos"
          element={
            <ProtectedRoute>
              <Turnos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/historial"
          element={
            <ProtectedRoute>
              <Historial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracion"
          element={
            <AdminRoute>
              <Configuracion />
            </AdminRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <AdminRoute>
              <Clientes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-turnos"
          element={
            <AdminRoute>
              <ListaTurnos />
            </AdminRoute>
          }
        />
        <Route
          path="/admin-anuncios"
          element={
            <AdminRoute>
              <Anuncios />
            </AdminRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  useEffect(() => {
    const unsubscribe = onMessageListener((payload: any) => {
      const body = payload.notification?.body || payload.data?.body || "Tienes un nuevo mensaje";
      const title = payload.notification?.title || payload.data?.title || "Notificación";

      showNotification({ 
        text: `${title}: ${body}`,
        duration: 5000
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UIProvider>
          <UserProvider>
            <Toaster />
            <Sonner />
            <InstallPrompt />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppRoutes />
            </BrowserRouter>
          </UserProvider>
        </UIProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
