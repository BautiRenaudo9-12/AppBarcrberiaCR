import { Link } from "react-router-dom"

export function MenuItems({ MENU_ITEMS_ARRAY }) {
    return (
        <div className="menu-items">
            <ul>
                {
                    MENU_ITEMS_ARRAY.map((e, i) => {
                        return <Link key={i} to={e.path}><li>{e.name}<span>{e.icon}</span></li></Link>
                    })
                }
            </ul>
        </div>

    )
}