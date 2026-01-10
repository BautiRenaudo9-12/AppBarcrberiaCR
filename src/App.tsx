import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Turnos from "./pages/Turnos";
import Historial from "./pages/Historial";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Configuracion from "./pages/Configuracion";
import Clientes from "./pages/Clientes";
import ListaTurnos from "./pages/ListaTurnos";
import NotFound from "./pages/NotFound";
import { UIProvider } from "@/context/UIContext";
import { UserProvider, useUser } from "@/context/UserContext";

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
  return (
    <Routes>
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
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UIProvider>
        <UserProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </BrowserRouter>
        </UserProvider>
      </UIProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
