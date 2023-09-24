import { useState, useEffect } from "react"
import { Configuracion } from "./Configuracion"
import { getDays } from "../../../../services"

export function ConfiguracionPage({ setPageName, setAsideStyle, setHomeStyle }) {
    const [daysList, setDaysList] = useState([])

    useEffect(() => {
        setPageName("Configuracion")
    }, [])

    useEffect(() => {
        setAsideStyle({ translate: "0 0" })
        setHomeStyle({ translate: "-100% 0" })

        return (() => {
            setAsideStyle({ translate: "120% 0" })
            setHomeStyle({ translate: "0 0" })
        })
    }, [])

    useEffect(() => {
        getDays().then(query => setDaysList(query.docs))
    }, [])


    return (
        <div className="page configuracion-page">
            <div className="conteiner">
                <ul>
                    {
                        daysList.map(doc => <Configuracion key={doc.data().dia} data={doc.data()} />)
                    }
                </ul>
            </div>
        </div>
    )
}