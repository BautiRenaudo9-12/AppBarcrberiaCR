import { Routes, Route } from "react-router-dom"
import { TurnosPage } from "../pages/Client/pages/Turnos/TurnosPage"
import { HistorialPage } from "../pages/Client/pages/Historial/HistorialPage"
import { useNavigate } from "react-router-dom"

const ProtectedRouted = ({ children, isAdmin }) => {
    console.log(children)
    //const navigate = useNavigate()

    //!isAdmin ?? navigate(-1)

    return (
        <>
            {isAdmin ?? children}
        </>
    )
}

export function AsidePageRoutes({modalConfirmTurnoModal, isAdmin, setPageName, setAsideStyle, setHomeStyle }) {
    return (
        <Routes>
            <Route path="/turnos" element={<TurnosPage modalConfirmTurnoModal={modalConfirmTurnoModal} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
            <Route path="/historial" element={
                //<ProtectedRouted isAdmin={isAdmin}>
                <HistorialPage  setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                //</ProtectedRouted>
            } />
        </Routes>
    )
}