import { useEffect } from "react"

export function ClientesPage({ setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Clientes")
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
        <div className="page clientes-page">
            <h2>Clientes</h2>
        </div>
    )
}