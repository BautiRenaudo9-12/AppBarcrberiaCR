import { MenuItem } from "./components/MenuItem"

export function HomePage({ isAdmin, homeStyle }) {
    const MENU_ITEMS_ARRAY =
        isAdmin
            ?
            [
                { name: "RESERVA TU TURNO", "srcIcon": "IC", "path": "turnos" },
                { name: "LISTA DE TURNOS", "srcIcon": "IC", "path": "lista-de-turnos" },
                { name: "CLIENTES", "srcIcon": "IC", "path": "clientes" },
                { name: "CONFIGURACION", "srcIcon": "IC", "path": "configuracion" }
            ]
            :
            [
                { name: "RESERVA TU TURNO", "srcIcon": "IC", "path": "turnos" },
                { name: "HISTORIAL", "srcIcon": "IC", "path": "historial" }
            ]

    return (
        <div
            className="page home-page"
            style={homeStyle}
        >
            <nav>
                <h1>BARBERIA CLAUDIO RENAUDO</h1>
                <div className="profile-button">P</div>
            </nav>

            <div className="menu-conteiner">
                <ul>
                    {
                        MENU_ITEMS_ARRAY.map(e => {
                            return <MenuItem key={e.path} pageName={e.path} name={e.name} srcIcon={e.srcIcon} />
                        })
                    }
                </ul>
            </div>
        </div>
    )
}