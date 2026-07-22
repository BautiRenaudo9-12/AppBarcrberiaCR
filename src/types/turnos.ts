import { BlockedSlot } from "@/services/blocks";

export interface Slot {
  time: string;
  status: 'free' | 'reserved' | 'blocked';
  appointment?: any;
  blockedRule?: BlockedSlot;
  isException?: boolean;
  /**
   * El turno existe pero su horario ya no cae en la grilla del día (el admin movió el
   * horario/intervalo, desactivó el día o lo tapó un cierre). La reserva sigue viva para
   * el cliente, así que se muestra igual en las vistas de admin en vez de desaparecer.
   */
  outOfSchedule?: boolean;
}
