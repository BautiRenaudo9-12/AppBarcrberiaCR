import { memo } from "react";
import { Trash2, Calendar } from "lucide-react";
import { Announcement } from "@/services/announcements";
import moment from "moment";
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
}

export const AnnouncementCard = memo(({ announcement, onDelete, isDeleting, innerRef }: AnnouncementCardProps) => {
  const start = announcement.fechaInicio.toDate();
  const end = announcement.fechaFin.toDate();
  const isActive = new Date() >= start && new Date() <= end;

  return (
    <div 
        ref={innerRef}
        className="bg-card border border-white/10 rounded-3xl p-5 flex items-start gap-4 group hover:border-white/20 transition-all relative overflow-hidden animate-in fade-in duration-500"
    >
        {isActive && (
            <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
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
                onClick={() => onDelete(announcement.id!)}
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
