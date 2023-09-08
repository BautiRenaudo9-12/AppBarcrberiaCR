import { useState, useEffect } from "react"
import { PickUpDate } from "../../components/PickUpDate"
import { Turno } from "./Turno"
import { getReserves } from "../../../../services/initializeFirebase"
import moment from "moment"



export function ListaDeTurnosPage({ setOpenLoading, setPageName, setAsideStyle, setHomeStyle }) {
    const [pickUpDate, setPickUpDate] = useState(moment().utcOffset("-03:00").format("DD/MM/YYYY"))
    const [reservesList, setReservesList] = useState([])
    const [count, setCount] = useState(0)

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

    useEffect(() => {
        getReservesFunction(pickUpDate)
    }, [])

    /*useEffect(() => {
        modalConfirmTurnoModal.confirmTurnoModal.confirm = false
    }, [])*/

    function getReservesFunction(date) {
        setReservesList([])
        getReserves(setOpenLoading, date)
            .then(query => setReservesList(query.docs), setCount(0))
    }

    return (
        <div className="page listaDeTurnos-page">
            <div className="conteiner">
                <PickUpDate isAdmin={true} getTurnosFunction={getReservesFunction} pickUpDate={pickUpDate} setPickUpDate={setPickUpDate} />
                <ul>
                    {
                        reservesList.length == 0 && <h3 style={{ translate: "0 180px", fontWeight: "300" }}>NO HAY RESERVAS PARA ESTE DIA</h3>
                    }
                    {
                        reservesList.map((doc, i) => {
                            const reserveTimeMoment = moment(doc.data().reserve.time.toDate())
                            const pickUpDateMoment = moment(pickUpDate.split("/").reverse().join("-"))
                            if (reserveTimeMoment.isSame(pickUpDateMoment, "d")) {
                                count == 0 && setCount(1)
                                return <Turno doc={doc} key={doc.id} />
                            }
                            if (i == reservesList.length - 1 && count == 0)
                                return <h3 key={doc.id} style={{ translate: "0 180px", fontWeight: "300" }}>NO HAY RESERVAS PARA ESTE DIA</h3>
                        })
                    }
                </ul>
            </div>
        </div>
    )
}