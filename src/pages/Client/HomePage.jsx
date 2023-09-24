import { useEffect } from "react"
import { MenuItems } from "./components/MenuItems"
import { MenuReserva } from "./components/MenuReserva"
import { Link } from "react-router-dom"
import { ClientsIcon, ConfigurationsIcon, TurnosIcon, ListaDeTurnosIcon, PerfilIcon } from "../../../assets/Icons"
import moment from "moment"


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
                <h1 onClick={() => {
                    const fromDate = moment().minutes("00").format("YYYYMMDDTHHmmSSZ")
                    const toDate = moment().minutes("00").add(1, "h").format("YYYYMMDDTHHmmSSZ")
                    const title = "Turno+Barberia+CR"
                    const location = "Claudio+Renaudo%2C+Brown+2178%2C+S2000AFL+Rosario%2C+Santa+Fe%2C+Argentina"
                    const url = `https://calendar.google.com/calendar/u/0/r/eventedit?dates=${fromDate}/${toDate}&text=${title}&location=${location}`

                    window.open(url)
                }}>BARBERIA CLAUDIO RENAUDO</h1>
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