import { useRef, useState, useEffect, useLayoutEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { gsap } from "gsap";

const routeDepth: Record<string, number> = {
  "/login": 0,
  "/": 1,
  "/turnos": 2,
  "/historial": 2,
  "/profile": 2,
  "/configuracion": 3,
  "/clientes": 3,
  "/admin-anuncios": 3,
};

type Direction = "forward" | "backward";

function getDirection(from: string, to: string): Direction {
  const fromDepth = routeDepth[from] ?? 0;
  const toDepth = routeDepth[to] ?? 0;
  return toDepth >= fromDepth ? "forward" : "backward";
}

export function TransitionManager({ children }: { children: ReactNode }) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayChildren, setDisplayChildren] = useState<ReactNode>(children);
  const prevPathname = useRef(location.pathname);
  const directionRef = useRef<Direction>("forward");
  const exitAnimRef = useRef<gsap.core.Tween | null>(null);
  const isFirstRender = useRef(true);
  const needsEntrance = useRef(false);
  const pendingChildren = useRef<ReactNode>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0, y: 14, scale: 0.995 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
        );
      }, containerRef);
      ctxRef.current = ctx;
      return () => ctx.revert();
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) return;
    if (prevPathname.current === location.pathname) return;

    directionRef.current = getDirection(prevPathname.current, location.pathname);
    const dir = directionRef.current;

    if (exitAnimRef.current) {
      exitAnimRef.current.kill();
    }

    document.body.style.overflow = "hidden";

    exitAnimRef.current = gsap.to(containerRef.current, {
      opacity: 0,
      x: dir === "forward" ? -40 : 40,
      scale: 0.98,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        pendingChildren.current = children;
        needsEntrance.current = true;
        prevPathname.current = location.pathname;
        setDisplayChildren(children);
      },
    });

    return () => {
      exitAnimRef.current?.kill();
    };
  }, [location.pathname]);

  useLayoutEffect(() => {
    if (!needsEntrance.current) return;
    needsEntrance.current = false;

    if (ctxRef.current) {
      ctxRef.current.revert();
    }

    // Reset scroll con la página nueva ya montada e invisible (antes del paint),
    // así el "scroll to top" queda oculto bajo la animación de entrada.
    window.scrollTo(0, 0);

    const dir = directionRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, x: dir === "forward" ? 40 : -40, scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.35,
          ease: "power3.out",
          onComplete: () => {
            document.body.style.overflow = "";
          },
        }
      );
    }, containerRef);
    ctxRef.current = ctx;

    return () => ctx.revert();
  }, [displayChildren]);

  return (
    <div ref={containerRef} className="will-change-transform">
      {displayChildren}
    </div>
  );
}