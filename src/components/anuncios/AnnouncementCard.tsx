import { memo, useRef, useEffect, useState, useCallback } from "react";
import { Trash2, Calendar } from "lucide-react";
import { Announcement } from "@/services/announcements";
import moment from "moment";
import gsap from "gsap";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [removing, setRemoving] = useState(false);
  const start = announcement.fechaInicio.toDate();
  const end = announcement.fechaFin.toDate();
  const isActive = new Date() >= start && new Date() <= end;

  useEffect(() => {
    if (!cardRef.current) return;

    if (isNew) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, scale: 0.96, y: 8 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power3.out" }
        );
        gsap.fromTo(
          cardRef.current,
          { boxShadow: "0 0 0 0px rgba(48,209,88,0)" },
          {
            boxShadow: "0 0 0 2px rgba(48,209,88,0.5)",
            duration: 0.3,
            repeat: 1,
            yoyo: true,
            ease: "power2.inOut",
          }
        );
      }, cardRef);
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
      );
    }, cardRef);
    return () => ctx.revert();
  }, [isNew]);

  useEffect(() => {
    if (isActive && badgeRef.current) {
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
    if (!cardRef.current) {
      onDelete(announcement.id!);
      return;
    }
    setRemoving(true);
    gsap.to(cardRef.current, {
      opacity: 0,
      y: -8,
      scale: 0.97,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        gsap.to(cardRef.current, {
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

  const setRefs = useCallback(
    (node: HTMLDivElement) => {
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
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
        className="bg-card border border-white/10 rounded-3xl overflow-hidden"
        style={{ opacity: 0 }}
      />
    );
  }

  return (
    <div
      ref={setRefs}
      className="bg-card border border-white/10 rounded-3xl p-5 flex items-start gap-4 group hover:border-white/20 transition-colors relative overflow-hidden"
    >
      {isActive && (
        <div
          ref={badgeRef}
          className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl"
          style={{ transform: "scale(0)", opacity: 0 }}
        >
          ACTIVO
        </div>
      )}
      <div className="text-3xl shrink-0 bg-secondary/30 w-14 h-14 rounded-2xl flex items-center justify-center">
        {announcement.icono}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg leading-tight mb-1">{announcement.texto}</h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Desde: {moment(start).format("DD/MM/YYYY HH:mm")}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Hasta: {moment(end).format("DD/MM/YYYY HH:mm")}
          </span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="p-2 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Eliminar anuncio"
            disabled={isDeleting}
          >
            <Trash2 className="w-5 h-5" />
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