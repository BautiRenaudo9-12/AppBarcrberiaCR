import { Calendar } from "lucide-react";
import moment from "moment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useClientHistory } from "@/hooks/useClients";

interface ClientHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName?: string;
}

export default function ClientHistoryDialog({
  open,
  onClose,
  clientEmail,
  clientName,
}: ClientHistoryDialogProps) {
  const { data: visits = [], isLoading } = useClientHistory(clientEmail, open);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Historial de {clientName || "cliente"}</DialogTitle>
          <DialogDescription>
            {isLoading
              ? "Cargando visitas..."
              : `${visits.length} ${visits.length === 1 ? "visita registrada" : "visitas registradas"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[72px] bg-card border border-white/10 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8 bg-card/30 rounded-2xl border border-white/5">
              Sin reservas registradas.
            </div>
          ) : (
            <div className="space-y-2">
              {visits.map((visit) => {
                const date = visit.time?.toDate();
                const formattedDate = date
                  ? moment(date).format("D [de] MMMM, YYYY")
                  : "Fecha desconocida";
                const formattedTime = date ? moment(date).format("HH:mm") : "";

                return (
                  <div
                    key={visit.id}
                    className="bg-card border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm capitalize">{formattedDate}</p>
                        {formattedTime && (
                          <p className="text-xs text-muted-foreground font-medium">{formattedTime}</p>
                        )}
                        <p className="text-sm mt-2">Turno reservado</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
