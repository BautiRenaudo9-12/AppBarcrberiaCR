import { useState, useRef, useLayoutEffect } from "react";
import { signIn, signUp, _setUserProperties } from "@/services/auth";
import { useUI } from "@/context/UIContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createSearchKeywords } from "@/lib/keywords";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { setLoading } = useUI();
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Entrada al montar.
  useLayoutEffect(() => {
    if (!containerRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-login-head]", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
      gsap.fromTo("[data-login-card]", { opacity: 0, y: 16, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, delay: 0.1, ease: "power3.out" });
      gsap.fromTo("[data-login-field]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, delay: 0.25, ease: "power3.out" });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Re-stagger de los campos al alternar entre login y registro.
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!containerRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-login-field]", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" });
    }, containerRef);
    return () => ctx.revert();
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        
        // Update keywords on login (backfill strategy)
        try {
            const userRef = doc(db, "clientes", email);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const keywords = createSearchKeywords(userData.name || "", userData.email || email, userData.nro || "");
                await setDoc(userRef, { keywords }, { merge: true });
            }
        } catch (err) {
            console.error("Error updating search keywords on login:", err);
            // Non-blocking error
        }

        toast.success("Bienvenido de nuevo");
      } else {
        const user = await signUp(email, password);
        if (user) {
          await _setUserProperties({ nameValue: name, nroValue: phone });
          
          const keywords = createSearchKeywords(name, email, phone);
          
          await setDoc(doc(db, "clientes", email), {
            email,
            name,
            nro: phone,
            keywords
          });
          toast.success("Cuenta creada exitosamente");
        }
      }
      navigate("/");
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="w-full max-w-md space-y-8">
        <div data-login-head className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Barberia CR</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Inicia sesión para continuar" : "Crea tu cuenta para reservar"}
          </p>
        </div>

        <div data-login-card className="bg-card border border-white/10 rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div data-login-field className="space-y-2">
                  <label className="text-sm font-medium leading-none">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div data-login-field className="space-y-2">
                  <label className="text-sm font-medium leading-none">Teléfono</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="+54 9 ..."
                  />
                </div>
              </>
            )}
            
            <div data-login-field className="space-y-2">
              <label className="text-sm font-medium leading-none">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="juan@ejemplo.com"
              />
            </div>
            
            <div data-login-field className="space-y-2">
              <label className="text-sm font-medium leading-none">Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              data-login-field
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl font-medium transition-colors mt-6"
            >
              {isLogin ? "Ingresar" : "Registrarse"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-accent hover:underline"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
