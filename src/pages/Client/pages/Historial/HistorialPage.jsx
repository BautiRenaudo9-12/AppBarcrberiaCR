import { useEffect, useState } from "react"
import { TurnoHistorial } from "./TurnoHistorial"
import { getHistory } from "../../../../services/initializeFirebase"
import moment from "moment"


export function HistorialPage({ setOpenLoading, setPageName, setAsideStyle, setHomeStyle }) {
    const [turnosHistorialList, setTurnosHistorialList] = useState([])

    useEffect(() => {
        setPageName("Historial")
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
        getHistory().then(query => setTurnosHistorialList(query.docs))
    }, [])


    return (
        <div className="page historial-page">
            <div className="conteiner">
            <div className="visitas-conteiner">
                <p>Visitas: </p>
                <div className="visitas">{turnosHistorialList.length}</div>
            </div>
            <ul>
                {
                    turnosHistorialList.map(doc => {
                        const time = doc.data().time.toDate()
                        return <TurnoHistorial key={doc.id} date={time} />
                    })
                }
            </ul>
            </div>
        </div>
    )
}