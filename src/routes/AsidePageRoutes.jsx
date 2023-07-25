import { Routes, Route } from "react-router-dom"
import { TurnosPage } from "../pages/Client/pages/Turnos/TurnosPage"
import { HistorialPage } from "../pages/Client/pages/Historial/HistorialPage"

export function AsidePageRoutes({setPageName, setAsideStyle, setHomeStyle }) {
    return (
        <Routes>
            <Route path="/turnos" element={<TurnosPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
            <Route path="/historial" element={<HistorialPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
        </Routes>
    )
}