import { MenuItem } from "./MenuItem"

export function HomePage({ openedPage, setOpenedPage }) {
    const MENU_ITEMS_ARRAY =
        false
            ?
            JSON.parse(import.meta.env.VITE_MENU_ITEMS_ARRAY_ADMIN)
            :
            JSON.parse(import.meta.env.VITE_MENU_ITEMS_ARRAY)

            console.log(MENU_ITEMS_ARRAY)

    return (
        <div
            className="page home-page"
            style={
                openedPage
                    ?
                    { translate: "-20% 0" }
                    :
                    { translate: "0 0" }
            }
        >
            <nav>
                <h1>BARBERIA CLAUDIO RENAUDO</h1>
                <div className="profile-button">P</div>
            </nav>

            <div className="menu-conteiner">
                <ul>
                    {
                        MENU_ITEMS_ARRAY.map(e => {
                            return <MenuItem key={e.pageName} pageName={e.pageName} name={e.name} srcIcon={e.srcIcon} setOpenedPage={setOpenedPage} />
                        })
                    }
                </ul>
            </div>
        </div>
    )
}