import { Link } from "react-router-dom";
import { Calendar, CalendarCheck, History, Settings, Users, Megaphone } from "lucide-react";
import { useMenuHover } from "@/hooks/useMenuHover";
import { useUser } from "@/context/UserContext";

interface HomeMenuProps {
    isAdmin: boolean;
}

export default function HomeMenu({ isAdmin }: HomeMenuProps) {
    const menuRef = useMenuHover();
    const { activeAppointment } = useUser();

    // El cliente con un turno activo no puede reservar otro: ocultamos el acceso (el widget
    // ActiveReservation ya muestra su turno y permite cancelarlo). El admin siempre lo ve.
    const canReserve = isAdmin || !activeAppointment;

    return (
        <div className="space-y-3">
            <div ref={menuRef} className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
                {/* Reservar Turno */}
                {canReserve && (
                    <Link
                        to="/turnos"
                        data-menu-item
                        className="relative flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group overflow-hidden"
                    >
                        <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                        <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                            <Calendar className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">Reservar Turno</p>
                            <p className="text-xs text-muted-foreground font-medium">Ver disponibilidad</p>
                        </div>
                        <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                    </Link>
                )}

                {/* Historial */}
                {!isAdmin && (
                    <Link
                        to="/historial"
                        data-menu-item
                        className="relative flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group overflow-hidden"
                    >
                        <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                        <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                            <History className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">Historial</p>
                            <p className="text-xs text-muted-foreground font-medium">Tu historial de visitas</p>
                        </div>
                        <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                    </Link>
                )}

                {/* Admin Section */}
                {isAdmin && (
                    <>
                        <Link
                            to="/lista-turnos"
                            data-menu-item
                            className="relative w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left overflow-hidden"
                        >
                            <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                            <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                                <CalendarCheck className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Lista de Turnos</p>
                                <p className="text-xs text-muted-foreground font-medium">Turnos reservados por fecha</p>
                            </div>
                            <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                        </Link>

                        <Link
                            to="/configuracion"
                            data-menu-item
                            className="relative w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left overflow-hidden"
                        >
                            <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                            <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                                <Settings className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Configuración</p>
                                <p className="text-xs text-muted-foreground font-medium">Panel de administración</p>
                            </div>
                            <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                        </Link>

                        <Link
                            to="/admin-anuncios"
                            data-menu-item
                            className="relative w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left overflow-hidden"
                        >
                            <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                            <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                                <Megaphone className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Anuncios</p>
                                <p className="text-xs text-muted-foreground font-medium">Gestionar campañas</p>
                            </div>
                            <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                        </Link>

                        <Link
                            to="/clientes"
                            data-menu-item
                            className="relative w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left overflow-hidden"
                        >
                            <div data-shimmer className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none opacity-0" />
                            <div data-menu-icon className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                                <Users className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Clientes</p>
                                <p className="text-xs text-muted-foreground font-medium">Gestión de usuarios</p>
                            </div>
                            <span data-menu-arrow className="text-muted-foreground font-medium">→</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}