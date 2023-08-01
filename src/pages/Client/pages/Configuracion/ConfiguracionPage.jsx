import { useEffect } from "react"
import moment from "moment"


export function ConfiguracionPage({ setPageName, setAsideStyle, setHomeStyle }) {
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


    return (
        <div className="page configuracion-page">
            <h2>Configuracion</h2>
        </div>
    )
}