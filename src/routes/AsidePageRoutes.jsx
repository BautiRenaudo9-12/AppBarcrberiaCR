import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { TurnosPage } from "../pages/Client/pages/Turnos/TurnosPage"
import { HistorialPage } from "../pages/Client/pages/Historial/HistorialPage"
import { ListaDeTurnosPage } from "../pages/Client/pages/ListaDeTurnos/ListaDeTurnosPage"
import { ClientesPage } from "../pages/Client/pages/Clientes/ClientesPage"
import { ConfiguracionPage } from "../pages/Client/pages/Configuracion/ConfiguracionPage"

const ProtectedAdminRouted = ({ children, isAdmin }) => {
    if (!isAdmin)
        return <Navigate to="/" />
    else
        return children
}

export function AsidePageRoutes({ modalConfirmTurnoModal, isAdmin, setPageName, setAsideStyle, setHomeStyle }) {
    return (
        <Routes>
            <Route path="/turnos" element={<TurnosPage isAdmin={isAdmin} modalConfirmTurnoModal={modalConfirmTurnoModal} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />
            <Route path="/historial" element={<HistorialPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />

            <Route path="/lista-de-turnos" element={
                <ProtectedAdminRouted isAdmin={isAdmin}>
                    <ListaDeTurnosPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRouted>
            } />
            <Route path="/clientes" element={
                <ProtectedAdminRouted isAdmin={isAdmin}>
                    <ClientesPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRouted>
            } />
            <Route path="/configuracion" element={
                <ProtectedAdminRouted isAdmin={isAdmin}>
                    <ConfiguracionPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRouted>
            } />
        </Routes>
    )
}