import { useState, useEffect, useCallback } from "react";
import moment from "moment";
import { toast } from "sonner";
import { Slot } from "@/types/turnos";
import { useUser } from "@/context/UserContext";
import { getDayConfig, arrayDias } from "@/services/reservations";
import { generateVirtualSlots } from "@/lib/slots";
import { getAppointmentsByDate, createAppointment } from "@/services/appointments";
import {
    subscribeToBlockedSlots,
    subscribeToExceptions,
    getBlockedRule,
    isException,
    addBlockedRule,
    deleteBlockedRule,
    addBlockException,
    removeBlockException,
    BlockedSlot,
    SlotException
} from "@/services/blocks";

export function useTurnos() {
    const { user, isAdmin } = useUser();
    
    // Data State
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Internal subscriptions state
    const [allBlockedRules, setAllBlockedRules] = useState<BlockedSlot[]>([]);
    const [allExceptions, setAllExceptions] = useState<SlotException[]>([]);

    // Subscriptions
    useEffect(() => {
        const unsubBlock = subscribeToBlockedSlots(setAllBlockedRules);
        const unsubExc = subscribeToExceptions(setAllExceptions);
        return () => { unsubBlock(); unsubExc(); };
    }, []);

    // Load Logic
    const loadSlots = useCallback(async () => {
        setLoading(true);
        try {
            const dateMoment = moment(selectedDate);
            const dayName = arrayDias[Number(dateMoment.format("d"))].toLowerCase();

            const config = await getDayConfig(dayName);

            if (!config || !config.activo) {
                setSlots([]);
                return;
            }

            const virtualSlots = generateVirtualSlots(
                config.desde || "09:00",
                config.hasta || "18:00",
                config.intervalo || 30
            );

            const appointments = await getAppointmentsByDate(selectedDate);
            const now = moment();

            const mappedSlots: Slot[] = virtualSlots.map(time => {
                const appointment = appointments.find(a => a.time === time);
                const blockedRule = getBlockedRule(selectedDate, time, allBlockedRules);
                const exceptionExists = isException(selectedDate, time, allExceptions);

                let status: Slot['status'] = 'free';

                if (appointment) {
                    if (appointment.status === 'blocked') status = 'blocked';
                    else status = 'reserved';
                } else if (blockedRule) {
                    if (exceptionExists) {
                        status = 'free';
                    } else {
                        status = 'blocked';
                    }
                }

                return { time, status, appointment, blockedRule, isException: exceptionExists };
            });

            if (!isAdmin) {
                const filtered = mappedSlots.filter(slot => {
                    if (slot.status !== 'free') return false;
                    const slotMoment = moment(`${selectedDate} ${slot.time}`, "YYYY-MM-DD HH:mm");
                    if (slotMoment.isBefore(now)) return false;
                    return true;
                });
                setSlots(filtered);
            } else {
                setSlots(mappedSlots);
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al cargar horarios");
        } finally {
            setLoading(false);
        }
    }, [selectedDate, isAdmin, allBlockedRules, allExceptions]);

    // Reload when dependencies change
    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    // --- Actions ---

    const reserveAppointment = async (time: string, clientName?: string) => {
        if (!user) return false;
        
        let finalClientName = user.displayName || "Usuario";
        if (isAdmin && clientName) {
            finalClientName = clientName.trim();
        }

        setLoading(true);
        try {
            await createAppointment(
                selectedDate,
                time,
                user.email!,
                finalClientName,
                ""
            );
            toast.success("Reserva confirmada");
            if (isAdmin) await loadSlots();
            return true;
        } catch (error: any) {
            toast.error(error.message || "Error al reservar");
            await loadSlots(); // Refresh to show real status
            return false;
        } finally {
            setLoading(false);
        }
    };

    const blockSlot = async (slot: Slot, mode: 'day' | 'weeks' | 'forever', weeks: number) => {
        // Re-block exception logic
        if (slot.isException) {
            setLoading(true);
            try {
                await removeBlockException(selectedDate, slot.time);
                toast.success("Excepción eliminada, horario bloqueado nuevamente.");
                return true;
            } catch (error) {
                console.error(error);
                toast.error("Error al re-bloquear");
                return false;
            } finally {
                setLoading(false);
            }
        }

        // Normal block logic
        if (mode === 'weeks' && weeks < 1) {
            toast.error("La duración mínima es de 1 semana");
            return false;
        }

        setLoading(true);
        try {
            await addBlockedRule(mode, selectedDate, slot.time, weeks);
            toast.success("Horario bloqueado");
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Error al bloquear");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unblockSlot = async (ruleId: string) => {
        setLoading(true);
        try {
            await deleteBlockedRule(ruleId);
            toast.success("Regla eliminada");
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Error al desbloquear");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const activateException = async (time: string) => {
        setLoading(true);
        try {
            await addBlockException(selectedDate, time);
            toast.success("Horario activado para hoy");
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Error al activar");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        selectedDate,
        setSelectedDate,
        slots,
        loading,
        isAdmin,
        user, // Exposed for convenience
        
        // Actions
        reserveAppointment,
        blockSlot,
        unblockSlot,
        activateException,
        refresh: loadSlots
    };
}
