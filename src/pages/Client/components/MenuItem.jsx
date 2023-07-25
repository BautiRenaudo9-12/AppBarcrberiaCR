import { Link } from "react-router-dom"

export function MenuItem({ pageName, name, srcIcon }) {
    return (
        <Link to={pageName}>
            <li>{name}<span>{srcIcon}</span></li>
        </Link>
    )
}