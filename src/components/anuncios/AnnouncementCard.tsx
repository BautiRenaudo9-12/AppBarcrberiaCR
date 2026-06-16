import { memo, useRef, useEffect, useState, useCallback } from "react";
import { Trash2, Calendar } from "lucide-react";
import { Announcement } from "@/services/announcements";
import moment from "moment";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { useCardHover } from "@/hooks/useCardHover";
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

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
  isNew?: boolean;
}

export const AnnouncementCard = memo(({ announcement, onDelete, isDeleting, innerRef, isNew }: AnnouncementCardProps) => {
  const hoverRef = useCardHover();
  const badgeRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [removing, setRemoving] = useState(false);
  const start = announcement.fechaInicio.toDate();
  const end = announcement.fechaFin.toDate();
  const isActive = new Date() >= start && new Date() <= end;

  useEffect(() => {
    if (!hoverRef.current) return;

    if (prefersReducedMotion()) {
      gsap.set(hoverRef.current, { opacity: 1, scale: 1, y: 0, clearProps: "boxShadow" });
      return;
    }

    if (isNew) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          hoverRef.current,
          { opacity: 0, scale: 0.96, y: 8 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out" }
        );
        gsap.fromTo(
          hoverRef.current,
          { boxShadow: "0 0 0 0px rgba(48,209,88,0)" },
          {
            boxShadow: "0 0 0 2px rgba(48,209,88,0.5)",
            duration: 0.3,
            repeat: 1,
            yoyo: true,
            ease: "power2.inOut",
          }
        );
      }, hoverRef);
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        hoverRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }, hoverRef);
    return () => ctx.revert();
  }, [isNew]);

  useEffect(() => {
    if (isActive && badgeRef.current) {
      if (prefersReducedMotion()) {
        gsap.set(badgeRef.current, { scale: 1, opacity: 1 });
        return;
      }
      const ctx = gsap.context(() => {
        gsap.fromTo(
          badgeRef.current,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
      }, badgeRef.current);
      return () => ctx.revert();
    }
  }, [isActive]);

  const handleDelete = useCallback(() => {
    if (!hoverRef.current || prefersReducedMotion()) {
      onDelete(announcement.id!);
      return;
    }
    setRemoving(true);
    gsap.to(hoverRef.current, {
      opacity: 0,
      y: -8,
      scale: 0.97,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        gsap.to(hoverRef.current, {
          height: 0,
          marginTop: 0,
          marginBottom: 0,
          paddingTop: 0,
          paddingBottom: 0,
          duration: 0.2,
          ease: "power2.inOut",
          onComplete: () => onDelete(announcement.id!),
        });
      },
    });
  }, [onDelete, announcement.id]);

  const handleCardEnter = useCallback(() => {
    if (prefersReducedMotion()) return;
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1.15, duration: 0.3, ease: "back.out(2)" });
  }, []);

  const handleCardLeave = useCallback(() => {
    if (prefersReducedMotion()) return;
    if (iconRef.current) gsap.to(iconRef.current, { scale: 1, duration: 0.25, ease: "power2.out" });
  }, []);

  const setRefs = useCallback(
    (node: HTMLDivElement) => {
      (hoverRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof innerRef === "function") {
        innerRef(node);
      } else if (innerRef) {
        (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [innerRef]
  );

  if (removing) {
    return (
      <div
        ref={setRefs}
        className="bg-card border border-white/10 rounded-2xl overflow-hidden"
        style={{ opacity: 0 }}
      />
    );
  }

  return (
    <div
      ref={setRefs}
      data-announcement-card
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
      className="bg-card border border-white/10 rounded-2xl p-3 flex items-center gap-3 group hover:border-white/20 transition-colors relative overflow-hidden"
    >
      {isActive && (
        <div
          ref={badgeRef}
          className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-xl"
          style={{ transform: "scale(0)", opacity: 0 }}
        >
          ACTIVO
        </div>
      )}
      <div ref={iconRef} className="text-xl shrink-0 bg-secondary/30 w-10 h-10 rounded-xl flex items-center justify-center">
        {announcement.icono}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm leading-tight">{announcement.texto}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {moment(start).format("DD/MM/YYYY HH:mm")} → {moment(end).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Eliminar anuncio"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card border-white/10 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar anuncio?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. El anuncio dejará de ser visible para los usuarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary hover:bg-secondary/80 border-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

AnnouncementCard.displayName = "AnnouncementCard";