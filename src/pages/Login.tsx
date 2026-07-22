import { useState, useRef, useLayoutEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn, signUp, _setUserProperties, signInWithGoogle } from "@/services/auth";
import { useUI } from "@/context/UIContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createSearchKeywords } from "@/lib/keywords";
import PhoneInput from "@/components/PhoneInput";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    // El ID del doc en `clientes` ES el email, y firestore.rules lo compara contra
    // `request.auth.token.email`, que Firebase Auth normaliza a minúsculas. Si usáramos el
    // string tal cual se tipeó, un "Juan@Gmail.com" crearía un doc que las reglas rechazan:
    // la cuenta queda creada pero el perfil (nombre y teléfono) se pierde.
    const emailId = email.trim().toLowerCase();
    try {
      if (isLogin) {
        await signIn(emailId, password);

        // Update keywords on login (backfill strategy)
        try {
            const userRef = doc(db, "clientes", emailId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const keywords = createSearchKeywords(userData.name || "", userData.email || emailId, userData.nro || "");
                await setDoc(userRef, { keywords }, { merge: true });
            }
        } catch (err) {
            console.error("Error updating search keywords on login:", err);
            // Non-blocking error
        }

        toast.success("Bienvenido de nuevo");
      } else {
        const user = await signUp(emailId, password);
        if (user) {
          await _setUserProperties({ nameValue: name, nroValue: phone });

          // El email del credential es la fuente de verdad (es el que va en el token).
          const profileEmail = user.email || emailId;
          const keywords = createSearchKeywords(name, profileEmail, phone);

          await setDoc(doc(db, "clientes", profileEmail), {
            email: profileEmail,
            name,
            nro: phone,
            keywords,
            notifEnabled: true
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

  const handleGoogle = async () => {
    setLoading(true);
    try {
      // Popup: al resolver, onAuthStateChanged dispara el alta y PublicRoute
      // redirige a "/". Fallback redirect: la app se recarga al volver.
      await signInWithGoogle();
    } catch (error: any) {
      // El usuario cerró/canceló el popup: no es un error a mostrar.
      if (
        error?.code !== "auth/popup-closed-by-user" &&
        error?.code !== "auth/cancelled-popup-request"
      ) {
        toast.error("No se pudo iniciar sesión con Google. Intentá de nuevo.");
      }
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

        <div data-login-card className="bg-card border border-white/10 rounded-3xl px-8 py-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div data-login-field className="space-y-1">
                  <label className="text-sm font-medium leading-none">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div data-login-field className="space-y-1">
                  <label className="text-sm font-medium leading-none">Teléfono</label>
                  <PhoneInput value={phone} onChange={setPhone} required />
                </div>
              </>
            )}
            
            <div data-login-field className="space-y-1">
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
            
            <div data-login-field className="space-y-1">
              <label className="text-sm font-medium leading-none">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-input bg-background pl-3 pr-11 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              data-login-field
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 rounded-xl font-medium transition-colors mt-5"
            >
              {isLogin ? "Ingresar" : "Registrarse"}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Continuar con Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 rounded-xl font-medium flex items-center justify-center gap-3 bg-white text-zinc-900 hover:bg-white/90 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

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
