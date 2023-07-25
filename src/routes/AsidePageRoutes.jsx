import { Routes, Route } from "react-router-dom"
import { TurnosPage } from "../components/ClientesPage/TurnosPage"
import { HistorialPage } from "../components/ClientesPage/HistorialPage"

export function AsidePageRoutes({setPageName, setAsideStyle, setHomeStyle }) {
    return (
        <Routes>
            <Route path="/" element={<p>No page selected</p>} />
            <Route path="/turnos" element={<TurnosPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
            <Route path="/historial" element={<HistorialPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
        </Routes>
    )
}