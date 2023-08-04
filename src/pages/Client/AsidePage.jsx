import { useState } from "react"
import { AsidePageRoutes } from "../../routes/AsidePageRoutes"
import { useNavigate } from 'react-router-dom';



export function AsidePage({ setReservaDate, reservaDate, modalConfirmTurnoModal, isAdmin, asideStyle, setAsideStyle, setHomeStyle }) {
    const [pageName, setPageName] = useState(null)
    const navigate = useNavigate();

    return (
        <div className="page aside-page" style={asideStyle}>

            <nav>
                <button onClick={() => { navigate(-1) }}>
                    <svg className="icon" width="30" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 16V13L22 13V11L6 11L6 8L2 12L6 16Z" fill="#fff" />
                    </svg>
                    <span className="page-name">{pageName}</span>
                </button>
            </nav>

            <AsidePageRoutes setReservaDate={setReservaDate} reservaDate={reservaDate} modalConfirmTurnoModal={modalConfirmTurnoModal} isAdmin={isAdmin} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
        </div>
    )
}