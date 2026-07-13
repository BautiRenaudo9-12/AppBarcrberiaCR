export interface DayConfig {
  id: string; // "lunes", "martes", etc.
  dia: string;
  desde?: string;
  hasta?: string;
  intervalo?: number;
  activo?: boolean;
}

// Config global de reservas (doc `config/booking`).
export interface BookingConfig {
  // Cuántos días hacia adelante (además de hoy) puede reservar un cliente.
  maxDays: number;
}

// Ventana de reserva por defecto si el doc no existe (equivale al hardcode histórico).
export const DEFAULT_MAX_DAYS = 6;
