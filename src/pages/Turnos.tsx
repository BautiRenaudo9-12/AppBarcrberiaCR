import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import moment from "moment";
import { getDayConfig, arrayDias } from "@/services/reservations";
import { generateVirtualSlots } from "@/lib/slots";
import { getAppointmentsByDate, createAppointment } from "@/services/appointments";
import { useUI } from "@/context/UIContext";
import { useUser } from "@/context/UserContext";
import AnimatedLayout from "@/components/AnimatedLayout";
import { toast } from "sonner";

export default function Turnos() {
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [availableSlots, setAvailableSlots] = useState<{ time: string }[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<any>(null);
  const { setLoading, loading } = useUI();
  const { user } = useUser();
  const navigate = useNavigate();
  const [hasActiveReserve, setHasActiveReserve] = useState(false);

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const dateMoment = moment(selectedDate);
      const dayName = arrayDias[Number(dateMoment.format("d"))].toLowerCase();
      
      // 1. Get Config for the day (e.g. "lunes")
      const config = await getDayConfig(dayName);
      
      if (!config || !config.activo) {
        setAvailableSlots([]);
        return;
      }

      // 2. Generate Virtual Slots
      const virtualSlots = generateVirtualSlots(
        config.desde || "09:00", 
        config.hasta || "18:00", 
        config.intervalo || 30
      );

      // 3. Get Occupied Slots (Appointments)
      const appointments = await getAppointmentsByDate(selectedDate);
      const occupiedTimes = appointments.map(a => a.time);

      // 4. Filter Available Slots
      const now = moment();
      const slots = virtualSlots.filter(time => {
        // Remove occupied
        if (occupiedTimes.includes(time)) return false;
        
        // Remove past times if today
        const slotMoment = moment(`${selectedDate} ${time}`, "YYYY-MM-DD HH:mm");
        if (slotMoment.isBefore(now)) return false;
        
        return true;
      }).map(time => ({ time }));

      setAvailableSlots(slots);

    } catch (error) {
      console.error(error);
      toast.error("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!selectedTurno || !user) return;
    setLoading(true);
    
    try {
      await createAppointment(
        selectedDate,
        selectedTurno.time,
        user.email!,
        user.displayName || "Usuario",
        "" // Phone optional
      );
      toast.success("Reserva confirmada");
      
      // Navigate to Home with state flag
      navigate("/", { state: { reservationSuccess: true } });

    } catch (error: any) {
      toast.error(error.message || "Error al reservar");
      loadSlots(); // Refresh to show taken
      setSelectedTurno(null);
    } finally {
      setLoading(false);
    }
  };

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
            {availableSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No hay horarios disponibles para esta fecha.
                </div>
            ) : (
              availableSlots.map((slot) => (
                <div
                  key={slot.time}
                  className="bg-card border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{slot.time}</p>
                      <p className="text-xs text-muted-foreground font-medium">Disponible</p>
                    </div>
                  </div>
                  <button 
                      onClick={() => setSelectedTurno(slot)}
                      className="px-5 py-2 rounded-full text-sm font-medium transition-colors bg-accent/20 text-accent hover:bg-accent/30"
                  >
                    Agendar
                  </button>
                </div>
              ))
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
                ¿Deseas agendar turno para el <strong>{moment(selectedDate).format("DD/MM")}</strong> a las <strong>{selectedTurno.time}</strong>?
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
    </AnimatedLayout>
  );
}