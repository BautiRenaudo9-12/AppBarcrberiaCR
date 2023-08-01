import { useEffect } from "react"


export function ListaDeTurnosPage({ setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Lista de turnos")
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
        <div className="page listaDeTurnos-page">
            <h1>Lista de turnos</h1>
        </div>
    )
}