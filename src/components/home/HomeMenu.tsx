import { Link } from "react-router-dom";
import { Calendar, History, Settings, Users, Megaphone } from "lucide-react";

interface HomeMenuProps {
    isAdmin: boolean;
}

export default function HomeMenu({ isAdmin }: HomeMenuProps) {
    return (
        <div className="space-y-3">
            <div className="bg-card border border-white/10 rounded-3xl overflow-hidden divide-y divide-white/10">
                {/* Reservar Turno */}
                <Link
                    to="/turnos"
                    className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
                >
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                        <Calendar className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium">Reservar Turno</p>
                        <p className="text-xs text-muted-foreground font-medium">Ver disponibilidad</p>
                    </div>
                    <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                {/* Historial */}
                {!isAdmin && (
                    <Link
                        to="/historial"
                        className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group"
                    >
                        <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                            <History className="w-6 h-6 text-accent" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">Historial</p>
                            <p className="text-xs text-muted-foreground font-medium">Tu historial de visitas</p>
                        </div>
                        <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                )}

                {/* Admin Section */}
                {isAdmin && (
                    <>


                        <Link
                            to="/configuracion"
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                                <Settings className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Configuración</p>
                                <p className="text-xs text-muted-foreground font-medium">Panel de administración</p>
                            </div>
                            <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                        </Link>

                        <Link
                            to="/admin-anuncios"
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                                <Megaphone className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Anuncios</p>
                                <p className="text-xs text-muted-foreground font-medium">Gestionar campañas</p>
                            </div>
                            <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                        </Link>

                        <Link
                            to="/clientes"
                            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors group text-left"
                        >
                            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:bg-accent/30 group-hover:scale-110 transition-all">
                                <Users className="w-6 h-6 text-accent" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">Clientes</p>
                                <p className="text-xs text-muted-foreground font-medium">Gestión de usuarios</p>
                            </div>
                            <span className="text-muted-foreground font-medium group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
