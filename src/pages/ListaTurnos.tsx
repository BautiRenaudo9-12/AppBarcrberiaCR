import { Link } from "react-router-dom";
import { ArrowLeft, CalendarCheck, User, XCircle, Mail, PlusCircle, Check } from "lucide-react";
import { useState, useEffect } from "react";
import moment from "moment";
import { getTurnos, removeReserve, putReserve, arrayDias } from "@/services/reservations";
import { useUI } from "@/context/UIContext";
import { DocumentData, Timestamp } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ListaTurnos() {
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [turnosList, setTurnosList] = useState<DocumentData[]>([]);
  
  const [cancelTurno, setCancelTurno] = useState<any>(null); 
  const [reserveTurno, setReserveTurno] = useState<any>(null);
  
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const { setLoading, loading } = useUI();

  useEffect(() => {
    const formattedDate = moment(selectedDate).format("DD/MM/YYYY");
    
    let unsub: () => void;
    getTurnos(setTurnosList, setLoading, formattedDate).then(u => unsub = u);

    return () => {
      if (unsub) unsub();
    };
  }, [selectedDate, setLoading]);

  const handleCancel = async () => {
    if (!cancelTurno) return;
    setLoading(true);
    
    const formattedDate = moment(selectedDate).format("DD/MM/YYYY");
    
    await removeReserve({
        arrayDias,
        reserveDate: { 
            time: formattedDate,
            id: cancelTurno.id 
        },
        clientEmail: cancelTurno.clientEmail
    });
    
    setLoading(false);
    setCancelTurno(null);
  };

  const handleAdminReserve = async () => {
    if (!reserveTurno || !adminName) return;
    setLoading(true);

    const formattedDate = moment(selectedDate).format("DD/MM/YYYY");

    await putReserve({
      isAdmin: true,
      arrayDias,
      pickUpDate: formattedDate,
      time: reserveTurno.timeStr, // Need to ensure timeStr is passed
      reserveId: reserveTurno.id,
      reserveInfoAdmin: {
        infoConfirmReserve: {
          reserveName: adminName,
          reserveEmail: adminEmail
        }
      }
    });

    setLoading(false);
    setReserveTurno(null);
    setAdminName("");
    setAdminEmail("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Agenda de Turnos</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Date Selector */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Selecciona una fecha</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-card border border-white/10 rounded-2xl px-4 py-3 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Slots */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Turnos</p>
          <div className="space-y-3 pb-10">
            {turnosList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay turnos configurados para esta fecha.
                </div>
            ) : (
             turnosList
                .map((doc) => {
                    const timeStr = doc.id.includes(":") ? doc.id : "00:00"; 
                    const [hour, minute] = timeStr.split(":").map(Number);
                    const timeMoment = moment(selectedDate).hour(hour).minute(minute);
                    const formattedTime = timeMoment.format("HH:mm");
                    const dateTransformed = timeMoment.format();
                    
                    const reserveData = doc.data().reserve;
                    let isReserved = false;
                    let clientName = "";
                    let clientEmail = "";
                    
                    if (reserveData && reserveData.time) {
                        const reservedDate = reserveData.time instanceof Timestamp ? reserveData.time.toDate() : null;
                        if (reservedDate && moment(reservedDate).isSame(moment(selectedDate), 'day')) {
                             isReserved = true;
                             clientName = reserveData.name || "Sin nombre";
                             clientEmail = reserveData.email || "";
                        }
                    }

                    return {
                        id: doc.id,
                        formattedTime,
                        timeStr: dateTransformed,
                        isReserved,
                        clientName,
                        clientEmail,
                        data: doc.data()
                    };
                })
                .sort((a, b) => a.formattedTime.localeCompare(b.formattedTime))
                .map((slot: any) => (
                  <div
                    key={slot.id}
                    className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                      slot.isReserved 
                        ? "bg-card border-white/10" 
                        : "bg-secondary/10 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        slot.isReserved ? "bg-accent/20 text-accent" : "bg-white/5 text-muted-foreground"
                      }`}>
                        {slot.isReserved ? <CalendarCheck className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-xl">{slot.formattedTime}</p>
                           {slot.isReserved ? (
                               <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">
                                  Ocupado
                               </span>
                           ) : (
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                                  Libre
                               </span>
                           )}
                        </div>
                        
                        {slot.isReserved && (
                            <div className="flex flex-col gap-0.5 mt-1">
                                <div className="flex items-center gap-1.5 text-foreground font-medium">
                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                    {slot.clientName}
                                </div>
                                {slot.clientEmail && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Mail className="w-3 h-3" />
                                        {slot.clientEmail}
                                    </div>
                                )}
                            </div>
                        )}
                      </div>
                    </div>
                    
                    {slot.isReserved ? (
                        <button 
                            onClick={() => setCancelTurno(slot)}
                            className="w-full sm:w-auto px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Liberar
                        </button>
                    ) : (
                        <button 
                            onClick={() => setReserveTurno(slot)}
                            className="w-full sm:w-auto px-6 py-2 bg-accent text-white hover:bg-accent/90 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          Reservar
                        </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <AlertDialog open={!!cancelTurno} onOpenChange={(open) => !open && setCancelTurno(null)}>
        <AlertDialogContent className="bg-card border-white/10 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Liberar Turno?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la reserva de las <strong>{cancelTurno?.formattedTime}</strong> a nombre de <strong>{cancelTurno?.clientName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary text-foreground hover:bg-secondary/80 border-none">Volver</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleCancel}
                className="bg-destructive text-white hover:bg-destructive/90"
            >
                Liberar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Reserve Dialog */}
      <Dialog open={!!reserveTurno} onOpenChange={(open) => !open && setReserveTurno(null)}>
        <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Reservar Turno ({reserveTurno?.formattedTime})</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre del Cliente *</label>
                    <input 
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                        placeholder="Ej: Juan Pérez"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email (Opcional)</label>
                    <input 
                        className="w-full bg-secondary/20 border border-white/10 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-accent"
                        placeholder="cliente@email.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Si ingresas un email registrado, se vinculará al historial del usuario.</p>
                </div>
            </div>
            <DialogFooter>
                <button 
                    onClick={() => setReserveTurno(null)}
                    className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    disabled={!adminName || loading}
                    onClick={handleAdminReserve}
                    className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? "Guardando..." : "Confirmar Reserva"}
                </button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}