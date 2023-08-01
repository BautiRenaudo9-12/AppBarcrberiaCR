import { useEffect } from "react"
import { TurnoHistorial } from "./TurnoHistorial"
import moment from "moment"


export function HistorialPage({ setPageName, setAsideStyle, setHomeStyle }) {
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

    const turnosHistorialList = [
        {
            id: 1,
            date: moment().format()
        },
        {
            id: 2,
            date: moment().format()
        }
    ]

    turnosHistorialList.map(turno => {
        console.log(turno.id, turno.date)

    })
    return (
        <div className="page historial-page">
            <div className="visitas-conteiner">
                <p>Visitas: </p>
                <div className="visitas">3</div>
            </div>
            <ul>
                {
                    turnosHistorialList.map(turno => {
                        return <TurnoHistorial key={turno.id} date={turno.date} />
                    })
                }
            </ul>
        </div>
    )
}