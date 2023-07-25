import { MenuItem } from "./MenuItem"

export function HomePage({ homeStyle }) {
    const MENU_ITEMS_ARRAY =
        false
            ?
            JSON.parse(import.meta.env.VITE_MENU_ITEMS_ARRAY_ADMIN)
            :
            JSON.parse(import.meta.env.VITE_MENU_ITEMS_ARRAY)

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