import { useState, useEffect } from "react"
import { HomePage } from "./ClientesPage/HomePage"
import { AsidePage } from "./ClientesPage/AsidePage"

export function ClientPage() {
    const [asideStyle, setAsideStyle] = useState({ translate: "120% 0" })
    const [homeStyle, setHomeStyle] = useState({ translate: "0 0" })


    return (
        <>
            <div className="page client-page">

                <HomePage homeStyle={homeStyle} />
                <AsidePage asideStyle={asideStyle} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />

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