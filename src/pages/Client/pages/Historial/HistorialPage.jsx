import { useEffect } from "react"

export function HistorialPage({setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Historial")
    }, [])

    useEffect(() => {
        setAsideStyle({ translate: "0 0" })
        setHomeStyle({ translate: "-20% 0" })

        return (() => {
            setAsideStyle({ translate: "120% 0" })
            setHomeStyle({ translate: "0 0" })
        })
    }, [])

    return (
        <div className="page historial-page">
            <h1>HISTORIAL PAGE</h1>
        </div>
    )
}