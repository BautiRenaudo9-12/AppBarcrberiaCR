import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { getHistory } from "@/services/users";
import { gsap } from "gsap";
import moment from "moment";
import HistorialSkeleton from "@/components/historial/HistorialSkeleton";
import { DocumentData } from "firebase/firestore";

export default function Historial() {
  const [visits, setVisits] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const hasAnimatedList = useRef(false);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    getHistory().then((snap) => {
      setVisits(snap.docs);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!countRef.current || visits.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        countRef.current,
        { textContent: 0 },
        {
          textContent: visits.length,
          duration: 0.8,
          ease: "power2.out",
          snap: { textContent: 1 },
        }
      );
    }, countRef.current);

    return () => ctx.revert();
  }, [visits.length]);

  useLayoutEffect(() => {
    if (!listRef.current || loading) return;

    const cards = Array.from(listRef.current.children);
    if (cards.length === 0) return;

    const isUpdate = prevLengthRef.current > 0;
    prevLengthRef.current = cards.length;

    if (hasAnimatedList.current && !isUpdate) return;
    hasAnimatedList.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.04,
          delay: 0.05,
          ease: "power2.out",
        }
      );
    }, listRef.current);

    return () => ctx.revert();
  }, [visits, loading]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Historial</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6">
        <div className="bg-accent/15 border border-accent/30 rounded-2xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total de visitas</p>
          <p ref={countRef} className="text-3xl font-bold text-accent">
            {visits.length}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Mis visitas</p>

          {loading ? (
            <HistorialSkeleton />
          ) : visits.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8 bg-card/30 rounded-2xl border border-white/5 animate-in fade-in-0 zoom-in-95 duration-300">
              No tienes visitas registradas.
            </div>
          ) : (
            <div ref={listRef} className="space-y-2 pb-10">
              {visits.map((doc) => {
                const date = doc.data().time.toDate();
                const formattedDate = moment(date).format("D [de] MMMM, YYYY");
                const formattedTime = moment(date).format("HH:mm");

                return (
                  <div
                    key={doc.id}
                    className="bg-card border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm capitalize">{formattedDate}</p>
                        <p className="text-xs text-muted-foreground font-medium">{formattedTime}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm">Turno completado</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}