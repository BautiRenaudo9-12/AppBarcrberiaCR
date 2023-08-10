import { useEffect } from "react"
import { MenuItems } from "./components/MenuItems"
import { MenuReserva } from "./components/MenuReserva"
import { Link } from "react-router-dom"

export function HomePage({ isAdmin, homeStyle, reservaDate, setReservaDate }) {
    useEffect(() => {

    }, [reservaDate])

    const MENU_ITEMS_ARRAY =
        isAdmin
            ?
            [
                { name: "RESERVA TU TURNO", icon: <p>IC</p>, path: "turnos" },
                { name: "LISTA DE TURNOS", icon: <p>IC</p>, path: "lista-de-turnos" },
                { name: "CLIENTES", icon: <p>IC</p>, path: "clientes" },
                { name: "CONFIGURACION", icon: <p>IC</p>, path: "configuracion" }
            ]
            :
            [
                { name: "RESERVA TU TURNO", icon: <p>IC</p>, path: "turnos" },
                { name: "HISTORIAL", icon: <p>IC</p>, path: "historial" }
            ]


    return (
        <div
            className="page home-page"
            style={homeStyle}
        >
            <nav>
                <h1>BARBERIA CLAUDIO RENAUDO</h1>
                <Link to={"/perfil"}><div className="profile-button">P</div></Link>
            </nav>

            {
                reservaDate ? < MenuReserva reservaDate={reservaDate} /> : <MenuItems MENU_ITEMS_ARRAY={MENU_ITEMS_ARRAY} />
            }
        </div>
    )
}