import { useEffect } from "react"
import { Turno } from "../../components/Turno"
import { PickUpDate } from "./PickUpDate"
import { useState } from "react"
import moment from "moment/moment"
import { getTurnos } from "../../../../services/initializeFirebase"


export function TurnosPage({ setOpenLoading, setReservaDate, isAdmin, modalConfirmTurnoModal, setPageName, setAsideStyle, setHomeStyle }) {
    const [pickUpDate, setPickUpDate] = useState(moment().format("DD/MM/YYYY"))
    const [turnosList, setTurnosList] = useState([])

    useEffect(() => {
        setPageName("Turnos")
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
        const unsub = getTurnos(setTurnosList, setOpenLoading)

        return () => {
            unsub.then(unsub => unsub())
        }
    }, [])

    function isDateAfterNowBy(date) {
        const now = moment().utcOffset("-03:00")
        const _date = moment(date)
        const minutesDifference = now.diff(_date, "m")

        return minutesDifference <= 0
    }

    const conditionShowTurnoAdmin = (time) => {

    }

    const conditionShowTurno = (time) => {
        return isDateAfterNowBy(time)
    }

    return (
        <div className="page turnos-page">
            <PickUpDate pickUpDate={pickUpDate} setPickUpDate={setPickUpDate} />
            <ul>
                {
                    turnosList.length == 0 && <h3 style={{ translate: "0 180px", fontWeight: "300" }}>NO HAY TURNOS DISPONIBLES</h3>
                }
                {
                    turnosList.map((doc) => {
                        const hour = moment(doc.data().hora.toDate()).format("HH")
                        const minute = moment(doc.data().hora.toDate()).format("mm")
                        const time = moment(pickUpDate.split("/").toReversed().join("-"))
                            .hours(hour)
                            .minutes(minute)
                            .format()
                        const state = isAdmin ? conditionShowTurnoAdmin(time) : conditionShowTurno(time)
                        return state && <Turno setOpenLoading={setOpenLoading}setReservaDate={setReservaDate} key={doc.id} reserveId={doc.id} isAdmin={isAdmin} time={moment(doc.data().hora.toDate()).format()} modalConfirmTurnoModal={modalConfirmTurnoModal} pickUpDate={pickUpDate} />
                    })
                }
            </ul>
        </div>
    )
}