import { useEffect } from "react"
import { MenuItems } from "./components/MenuItems"
import { MenuReserva } from "./components/MenuReserva"
import { Link } from "react-router-dom"
import { ClientsIcon, ConfigurationsIcon, TurnosIcon, ListaDeTurnosIcon, PerfilIcon } from "../../../assets/PageIcons"


export function HomePage({ modalConfirmTurnoModal, setOpenLoading2, isAdmin, homeStyle, reserveDate, setReserveDate }) {

    const MENU_ITEMS_ARRAY =
        isAdmin
            ?
            [
                {
                    name: "RESERVA TU TURNO",
                    icon:
                        <TurnosIcon />,
                    path: "turnos"
                },
                {
                    name: "LISTA DE TURNOS",
                    icon:
                        <ListaDeTurnosIcon />,
                    path: "lista-de-turnos"
                },
                {
                    name: "CLIENTES",
                    icon:
                        <ClientsIcon />,
                    path: "clientes"
                },
                {
                    name: "CONFIGURACION",
                    icon:
                        <ConfigurationsIcon />,
                    path: "configuracion"
                }
            ]
            :
            [
                {
                    name: "RESERVA TU TURNO",
                    icon:
                        <TurnosIcon />,
                    path: "turnos"
                },
                {
                    name: "HISTORIAL",
                    icon:
                        <ListaDeTurnosIcon />,
                    path: "historial"
                }
            ]


    return (
        <div
            className="page home-page"
            style={homeStyle}
        >
            <nav>
                <h1>BARBERIA CLAUDIO RENAUDO</h1>
                <Link to={"/perfil"}>
                    <div className="profile-button">
                        <PerfilIcon />
                    </div>
                </Link>
            </nav>

            {
                reserveDate ? < MenuReserva modalConfirmTurnoModal={modalConfirmTurnoModal} setOpenLoading2={setOpenLoading2} reserveDate={reserveDate} setReserveDate={setReserveDate} /> : <MenuItems MENU_ITEMS_ARRAY={MENU_ITEMS_ARRAY} />
            }
        </div>
    )
}