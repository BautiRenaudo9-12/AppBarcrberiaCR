import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import moment from "moment";
import { toast } from "sonner";
import { Slot } from "@/types/turnos";
import { useUser } from "@/context/UserContext";
import { getDayConfig, arrayDias } from "@/services/reservations";
import { generateVirtualSlots } from "@/lib/slots";
import { getAppointmentsByDate, createAppointment, cancelAppointment } from "@/services/appointments";
import { clearMyWaitlist, notifyWaitlist } from "@/services/waitlist";
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
import { subscribeToClosures, isDateInClosure, Closure } from "@/services/closures";

export function useTurnos() {
    const { user, isAdmin } = useUser();

    // Fecha inicial: si venimos de un deep-link del aviso de lista de espera (?date=YYYY-MM-DD)
    // la preseleccionamos; si no, hoy.
    const [searchParams] = useSearchParams();
    const paramDate = searchParams.get("date");
    const initialDate =
        paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate)
            ? paramDate
            : moment().format("YYYY-MM-DD");

    // Data State
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);
    // ¿El día seleccionado es un día laborable con horarios configurados? (para decidir si
    // ofrecer la lista de espera cuando no quedan turnos libres).
    const [dayActive, setDayActive] = useState(false);
    // ¿El día cae dentro de un cierre por rango (vacaciones)?
    const [closed, setClosed] = useState(false);

    // Internal subscriptions state
    const [allBlockedRules, setAllBlockedRules] = useState<BlockedSlot[]>([]);
    const [allExceptions, setAllExceptions] = useState<SlotException[]>([]);
    const [allClosures, setAllClosures] = useState<Closure[]>([]);
    const [subscriptionsReady, setSubscriptionsReady] = useState(false);

    // Subscriptions
    useEffect(() => {
        let blocksLoaded = false;
        let exceptionsLoaded = false;
        let closuresLoaded = false;

        const checkReady = () => {
            if (blocksLoaded && exceptionsLoaded && closuresLoaded) {
                setSubscriptionsReady(true);
            }
        };

        const unsubBlock = subscribeToBlockedSlots((data) => {
            setAllBlockedRules(data);
            blocksLoaded = true;
            checkReady();
        });

        const unsubExc = subscribeToExceptions((data) => {
            setAllExceptions(data);
            exceptionsLoaded = true;
            checkReady();
        });

        const unsubClosures = subscribeToClosures((data) => {
            setAllClosures(data);
            closuresLoaded = true;
            checkReady();
        });

        return () => { unsubBlock(); unsubExc(); unsubClosures(); };
    }, []);

    // Load Logic
    const loadSlots = useCallback(async () => {
        // Wait until subscriptions have fired at least once
        if (!subscriptionsReady) {
            setLoading(true); // Keep loading while waiting
            return;
        }

        setLoading(true);
        try {
            // Cierre por rango (vacaciones): el día está cerrado, no se genera ningún slot.
            if (isDateInClosure(selectedDate, allClosures)) {
                setSlots([]);
                setDayActive(false);
                setClosed(true);
                return;
            }
            setClosed(false);

            const dateMoment = moment(selectedDate);
            const rawDayName = arrayDias[Number(dateMoment.format("d"))].toLowerCase();
            // Normalizar el nombre del día (quitar tildes para coincidir con IDs de Firestore)
            const dayName = rawDayName
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const config = await getDayConfig(dayName);

            if (!config || !config.activo) {
                setSlots([]);
                setDayActive(false);
                return;
            }

            const virtualSlots = generateVirtualSlots(
                config.desde || "09:00",
                config.hasta || "18:00",
                config.intervalo || 30
            );

            // Día laborable con al menos un horario configurado.
            setDayActive(virtualSlots.length > 0);

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
    }, [selectedDate, isAdmin, allBlockedRules, allExceptions, allClosures, subscriptionsReady]);

    // Al cambiar de fecha, limpiamos los slots y marcamos cargando (antes del paint)
    // para mostrar el skeleton mientras llega la data de la nueva fecha. Los refrescos
    // de la misma fecha (suscripciones/acciones) no pasan por acá, así no parpadea.
    useLayoutEffect(() => {
        setSlots([]);
        setLoading(true);
    }, [selectedDate]);

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
                isAdmin // Force if admin
            );
            // Al reservar, el cliente sale de todas sus listas de espera (ya no debe recibir
            // avisos). Best-effort: no bloquea la confirmación si falla.
            if (!isAdmin && user.email) {
                clearMyWaitlist(user.email).catch((e) =>
                    console.error("No se pudo limpiar la lista de espera:", e)
                );
            }
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

    const cancelReservation = async (appointmentId: string) => {
        setLoading(true);
        try {
            await cancelAppointment(appointmentId);
            // Se liberó el turno: avisamos a la lista de espera de ese día (best-effort).
            // El ID es determinista "YYYY-MM-DD_HH-mm", así que la fecha sale del prefijo.
            const freedDate = appointmentId.split("_")[0];
            notifyWaitlist(freedDate);
            toast.success("Reserva cancelada");
            await loadSlots();
            return true;
        } catch (error) {
            console.error(error);
            toast.error("Error al cancelar la reserva");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const activateException = async (time: string) => {
        setLoading(true);
        try {
            const created = await addBlockException(selectedDate, time);
            // Un sobreturno abre un turno que antes no existía: avisamos a la lista de espera
            // de ese día, igual que en una cancelación (best-effort). Solo si se creó de verdad,
            // para que re-tocar un sobreturno ya existente no vuelva a disparar el aviso.
            if (created) notifyWaitlist(selectedDate);
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
        dayActive,
        closed,
        isAdmin,
        user, // Exposed for convenience
        
        // Actions
        reserveAppointment,
        blockSlot,
        unblockSlot,
        activateException,
        cancelReservation,
        refresh: loadSlots
    };
}
