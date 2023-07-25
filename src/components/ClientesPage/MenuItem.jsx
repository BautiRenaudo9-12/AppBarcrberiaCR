export function MenuItem({ pageName, name, srcIcon, setOpenedPage }) {

    return (
        <li onClick={() => { setOpenedPage(pageName) }}>{name} {<span>{srcIcon}</span>} </li>
    )
}