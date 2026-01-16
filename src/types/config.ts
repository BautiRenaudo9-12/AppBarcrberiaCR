export interface DayConfig {
  id: string; // "lunes", "martes", etc.
  dia: string;
  desde?: string;
  hasta?: string;
  intervalo?: number;
  activo?: boolean;
}
