import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { TurnosPage } from "../pages/Client/pages/Turnos/TurnosPage"
import { HistorialPage } from "../pages/Client/pages/Historial/HistorialPage"
import { PerfilPage } from "../pages/Client/pages/Perfil/PerfilPage"
import { ListaDeTurnosPage } from "../pages/Client/pages/ListaDeTurnos/ListaDeTurnosPage"
import { ClientesPage } from "../pages/Client/pages/Clientes/ClientesPage"
import { ConfiguracionPage } from "../pages/Client/pages/Configuracion/ConfiguracionPage"
import { useState } from "react"

const ProtectedAdminRoute = ({ children, isAdmin }) => {
    if (!isAdmin)
        return <Navigate to="/" />
    else
        return children
}

const ProtectedReservedRoute = ({ children, reserveDate }) => {
    if (reserveDate)
        return <Navigate to="/" />
    else
        return children
}

export function AsidePageRoutes({ setOpenLoading2, setOpenLoading, setReserveDate, reserveDate, modalConfirmTurnoModal, isAdmin, setPageName, setAsideStyle, setHomeStyle }) {
    const [userInfo, setUserInfo] = useState({})

    return (
        <Routes>
            <Route path="/turnos" element={
                <ProtectedReservedRoute reserveDate={reserveDate}>
                    <TurnosPage setOpenLoading2={setOpenLoading2} setOpenLoading={setOpenLoading} setReserveDate={setReserveDate} isAdmin={isAdmin} modalConfirmTurnoModal={modalConfirmTurnoModal} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedReservedRoute>
            } />
            <Route path="/historial" element={
                <ProtectedReservedRoute reserveDate={reserveDate}>
                    <HistorialPage setOpenLoading={setOpenLoading} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedReservedRoute>
            } />
            <Route path="/perfil" element={<PerfilPage userInfo={userInfo} setUserInfo={setUserInfo} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />} />

            <Route path="/lista-de-turnos" element={
                <ProtectedAdminRoute isAdmin={isAdmin}>
                    <ListaDeTurnosPage setOpenLoading={setOpenLoading} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRoute>
            } />
            <Route path="/clientes" element={
                <ProtectedAdminRoute isAdmin={isAdmin}>
                    <ClientesPage setOpenLoading={setOpenLoading} setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRoute>
            } />
            <Route path="/configuracion" element={
                <ProtectedAdminRoute isAdmin={isAdmin}>
                    <ConfiguracionPage setPageName={setPageName} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
                </ProtectedAdminRoute>
            } />
        </Routes>
    )
}