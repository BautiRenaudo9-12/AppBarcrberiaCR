import { useState, useEffect } from "react"
import {HomePage} from "./ClientesPage/HomePage"
import {AsidePage} from "./ClientesPage/AsidePage"

export function ClientPage() {
    const [openedPage, setOpenedPage] = useState(null)


    return (
        <>
            <div className="page client-page">

                <HomePage openedPage={openedPage} setOpenedPage={setOpenedPage} />
                <AsidePage openedPage={openedPage} setOpenedPage={setOpenedPage} />

                {
                    /*
                    <div className="page profile-page">
                        <h1>PROFILE PAGE</h1>
                    </div>
                    <div className="page turnos-page">
                        <h1>TURNOS PAGE</h1>
                    </div>
                    <div className="page listaDeTurnos-page">
                        <h1>LISTA DE TURNOS PAGE</h1>
                    </div>
                    <div className="page clientes-page">
                        <h1>CLIENTES PAGE</h1>
                    </div>
                    <div className="page configuracion-page">
                        <h1>CONFIGURACION PAGE</h1>
                    </div>
                    */
                }
            </div>
        </>
    )
}