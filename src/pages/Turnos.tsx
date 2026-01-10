import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import moment from "moment";
import { getReserve, getTurnos, putReserve, arrayDias } from "@/services/reservations";
import { useUI } from "@/context/UIContext";
import { useUser } from "@/context/UserContext";
import { DocumentData, Timestamp } from "firebase/firestore";

export default function Turnos() {
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [turnosList, setTurnosList] = useState<DocumentData[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<any>(null); // For confirmation dialog
  const { setLoading, loading } = useUI();
  const { isAdmin, user } = useUser();
  const navigate = useNavigate();
  const [hasActiveReserve, setHasActiveReserve] = useState(false);

  // Helper for reserve check
  const isDateAfterNowBy30Min = (date: Date) => {
    const now = moment().utcOffset("-03:00");
    const _date = moment(date);
    const minutesDifference = now.diff(_date, "m");
    return minutesDifference <= 30;
  };

  const isDateAfterNow = (dateStr: string) => {
    const now = moment().utcOffset("-03:00");
    const _date = moment(dateStr);
    const minutesDifference = now.diff(_date, "m");
    return minutesDifference <= 0;
  };

  useEffect(() => {
    const checkUserReserve = async () => {
        // 1. Optimistic check with LocalStorage
        const cached = localStorage.getItem("RESERVE");
        if (cached) {
            const parsed = JSON.parse(cached);
            if (isDateAfterNowBy30Min(parsed.time)) {
                setHasActiveReserve(true);
            }
        }

        // 2. Authoritative check with Firestore
        try {
            const reserve = await getReserve(isDateAfterNowBy30Min);
            if (reserve) {
                setHasActiveReserve(true);
                localStorage.setItem("RESERVE", JSON.stringify(reserve));
            } else {
                // If firestore says no reserve, clear local state
                setHasActiveReserve(false);
                localStorage.removeItem("RESERVE");
            }
        } catch (error) {
            console.error("Error checking reserve:", error);
        }
    };
    checkUserReserve();
  }, []);

  useEffect(() => {
    // Convert YYYY-MM-DD to DD/MM/YYYY for legacy service compatibility
    const formattedDate = moment(selectedDate).format("DD/MM/YYYY");
    
    // getTurnos returns a promise that resolves to an unsubscribe function
    let unsub: () => void;
    getTurnos(setTurnosList, setLoading, formattedDate).then(u => unsub = u);

    return () => {
      if (unsub) unsub();
    };
  }, [selectedDate, setLoading]);

  const handleReserve = async () => {
    if (!selectedTurno) return;
    setLoading(true);
    
    const formattedDate = moment(selectedDate).format("DD/MM/YYYY");
    
    // Create a minimum delay of 2 seconds for better UX
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
    
    const processPromise = putReserve({
        isAdmin: false,
        arrayDias,
        pickUpDate: formattedDate,
        time: selectedTurno.timeStr,
        reserveId: selectedTurno.id
    });
    
    // Wait for both the process and the delay
    const [_, success] = await Promise.all([minDelay, processPromise]);
    
    setLoading(false);
    setSelectedTurno(null);
    
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="w-10 h-10 hover:bg-secondary/30 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Mis Turnos</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Date Selector */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Selecciona una fecha</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={moment().format("YYYY-MM-DD")}
            className="w-full bg-card border border-white/10 rounded-2xl px-4 py-3 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Available Slots */}
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium px-1">Horarios disponibles</p>
          <div className="space-y-2 pb-10">
            {turnosList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay horarios disponibles para esta fecha.
                </div>
            ) : (
             (() => {
                 const selectedDateMoment = moment(selectedDate);
                 
                 return turnosList
                    .map((doc) => {
                        const timeStr = doc.id.includes(":") ? doc.id : "00:00"; 
                        const [hour, minute] = timeStr.split(":").map(Number);
                        
                        const timeMoment = selectedDateMoment.clone().hour(hour).minute(minute);
                        const formattedTime = timeMoment.format("HH:mm");
                        const dateTransformed = timeMoment.format();
                        
                        const reserveData = doc.data().reserve;
                        let isReserved = false;
                        
                        if (reserveData && reserveData.time) {
                            const reservedDate = reserveData.time instanceof Timestamp 
                                ? reserveData.time.toDate() 
                                : null;
                                
                            if (reservedDate) {
                                 const reservedMoment = moment(reservedDate);
                                 if (reservedMoment.isSame(selectedDateMoment, 'day')) {
                                     isReserved = true;
                                 }
                            }
                        }

                        if (!isReserved && isDateAfterNow(dateTransformed)) {
                            return {
                                id: doc.id,
                                timeStr: dateTransformed,
                                formattedTime,
                                data: doc.data()
                            };
                        }
                        return null;
                    })
                    .filter(Boolean)
                    .sort((a, b) => a!.formattedTime.localeCompare(b!.formattedTime))
                    .map((slot: any) => (
                      <div
                        key={slot.id}
                        className="bg-card border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-accent" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{slot.formattedTime}</p>
                            <p className="text-xs text-muted-foreground font-medium">Disponible</p>
                          </div>
                        </div>
                        <button 
                            onClick={() => !hasActiveReserve && setSelectedTurno(slot)}
                            disabled={hasActiveReserve}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                                hasActiveReserve 
                                ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
                                : "bg-accent/20 text-accent hover:bg-accent/30"
                            }`}
                        >
                          {hasActiveReserve ? "Pendiente" : "Agendar"}
                        </button>
                      </div>
                    ));
             })()
            )}
            
             {turnosList.length > 0 && 
              turnosList.filter(doc => {
                  const timeStr = doc.id.includes(":") ? doc.id : "00:00"; 
                  const [hour, minute] = timeStr.split(":").map(Number);
                  const selectedDateMoment = moment(selectedDate);
                  const timeMoment = selectedDateMoment.clone().hour(hour).minute(minute);
                  const dateTransformed = timeMoment.format();
                  
                  const reserveData = doc.data().reserve;
                  let isReserved = false;
                  if (reserveData && reserveData.time) {
                      const reservedDate = reserveData.time instanceof Timestamp ? reserveData.time.toDate() : null;
                      if (reservedDate && moment(reservedDate).isSame(selectedDateMoment, 'day')) {
                          isReserved = true;
                      }
                  }
                  return !isReserved && isDateAfterNow(dateTransformed);
              }).length === 0 && (
                 <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay horarios disponibles para esta fecha (filtros aplicados).
                </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {selectedTurno && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-white/10 rounded-3xl p-6 w-full sm:w-auto sm:max-w-sm space-y-4 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-300">
              <h3 className="text-lg font-semibold">Confirmar Reserva</h3>
              <p className="text-sm text-muted-foreground">
                ¿Deseas agendar turno para el <strong>{moment(selectedDate).format("DD/MM")}</strong> a las <strong>{selectedTurno.formattedTime}</strong>?
              </p>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedTurno(null)}
                  disabled={loading}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl py-3 font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReserve}
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white rounded-xl py-3 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                      Procesando...
                    </>
                  ) : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}