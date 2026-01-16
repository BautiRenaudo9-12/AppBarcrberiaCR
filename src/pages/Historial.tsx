import { Link } from "react-router-dom";
import { ArrowLeft, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getHistory } from "@/services/users";
import { useUser } from "@/context/UserContext";
import { Timestamp, DocumentData } from "firebase/firestore";
import AnimatedLayout from "@/components/AnimatedLayout";
import moment from "moment";

export default function Historial() {
  const [visits, setVisits] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then((snap) => {
      setVisits(snap.docs);
      setLoading(false);
    });
  }, []);

  return (
    <AnimatedLayout className="min-h-screen bg-background text-foreground">
      {/* Header */}
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

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Summary Badge */}
        <div className="bg-accent/15 border border-accent/30 rounded-2xl px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total de visitas</p>
          <p className="text-3xl font-bold text-accent">{visits.length}</p>
        </div>

        {/* History List */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Mis visitas</p>
          <div className="space-y-2 pb-10">
            {loading ? (
                <p className="text-center text-sm text-muted-foreground py-4">Cargando...</p>
            ) : visits.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No tienes visitas registradas.</p>
            ) : (
                visits.map((doc) => {
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
                              {/* Service/Barber not stored in legacy history */}
                            </div>
                          </div>
                        </div>
                      </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </AnimatedLayout>
  );
}
