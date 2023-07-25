import { useEffect } from "react"

export function TurnosPage({ setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Turnos")
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
        <div className="page turnos-page">
            <h1>TURNOS PAGE</h1>
        </div>
    )
}