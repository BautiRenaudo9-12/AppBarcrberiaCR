import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-accent">404</h1>
        <div className="space-y-2">
          <p className="text-xl font-semibold">Página no encontrada</p>
          <p className="text-muted-foreground">
            La página que buscas no existe.
          </p>
        </div>
        <Link
          to="/"
          className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 rounded-xl font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
