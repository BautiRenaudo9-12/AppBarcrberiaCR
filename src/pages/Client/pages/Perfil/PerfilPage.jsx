import { useEffect } from "react"

export function PerfilPage({ setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Perfil")
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
        <div className="page perfil-page">
            <h2>Perfil</h2>
        </div>
    )
}