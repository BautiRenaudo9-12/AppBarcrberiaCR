import { Link } from "react-router-dom";
import moment from "moment";
import { useMemo } from "react";

interface ActiveReservationProps {
    reserve: any; // Using any to match existing loose typing, ideally define Reservation interface
    isLoading: boolean;
    onCancel: () => void;
}

export default function ActiveReservation({ reserve, isLoading, onCancel }: ActiveReservationProps) {
    
    // Memoize date formatting to prevent recalculations on re-renders
    const { formattedDateCapitalized, formattedTime } = useMemo(() => {
        if (!reserve || !reserve.timestamp) return { formattedDateCapitalized: "", formattedTime: "" };
        
        // Safety check for toDate method in case of data corruption
        const dateObj = reserve.timestamp?.toDate ? reserve.timestamp.toDate() : null;
        
        if (!dateObj) return { formattedDateCapitalized: "", formattedTime: "" };

        const formattedDate = moment(dateObj).format("dddd, D [de] MMMM");
        const formattedTime = moment(dateObj).format("HH:mm");
        const formattedDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

        return { formattedDateCapitalized, formattedTime };
    }, [reserve]);

    if (isLoading) {
        return (
            <div className="bg-card/50 border border-white/5 rounded-3xl p-5 space-y-4 animate-pulse">
                <div className="h-3 w-24 bg-white/10 rounded-full" />
                <div className="h-8 w-48 bg-white/10 rounded-lg" />
                <div className="h-4 w-32 bg-white/10 rounded" />
            </div>
        );
    }

    if (!reserve) {
        return (
            <div className="relative bg-card/50 border border-white/5 rounded-3xl p-5 space-y-2 text-center py-8">
                <p className="text-muted-foreground text-sm">No tienes turnos próximos</p>
                <Link to="/turnos" className="text-accent text-sm font-medium hover:underline">
                    Reservar ahora
                </Link>
            </div>
        );
    }

    return (
        <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/30 to-accent/15 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Card */}
            <div className="relative bg-card border border-white/10 rounded-3xl p-5 space-y-4 z-10">
                <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Tu próximo turno</p>
                    <h2 className="text-xl font-semibold capitalize">{formattedDateCapitalized}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{formattedTime} - Corte de cabello</p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="text-sm text-destructive hover:text-destructive/80 transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
