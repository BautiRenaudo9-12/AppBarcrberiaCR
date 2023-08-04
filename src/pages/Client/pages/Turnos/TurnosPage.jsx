import { useEffect } from "react"
import { Turno } from "../../components/Turno"
import { PickUpDate } from "./PickUpDate"
import { useState } from "react"
import moment from "moment/moment"
import { db } from "../../../../services/initializeFirebase"
import { collection, onSnapshot } from "firebase/firestore";


export function TurnosPage({ setReservaDate, isAdmin, modalConfirmTurnoModal, setPageName, setAsideStyle, setHomeStyle }) {
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
        const unsub = getTurnos()

        return () => {
            unsub.then(unsub => unsub())
        }
    }, [])

    const getTurnos = async () => {
        let turnosArray = []
        const unsub = onSnapshot(collection(db, "turnos", "lunes", "turnos"), query => {
            query.forEach((doc) => {
                turnosArray.push(doc)
            });
            setTurnosList(turnosArray)
        });

        return unsub
    }

    return (
        <div className="page turnos-page">
            <PickUpDate pickUpDate={pickUpDate} setPickUpDate={setPickUpDate} />
            <ul>
                {
                    turnosList.map((doc) => <Turno setReservaDate={setReservaDate} key={doc.id} isAdmin={isAdmin} time={moment(doc.data().hora.toDate()).format()} modalConfirmTurnoModal={modalConfirmTurnoModal} pickUpDate={pickUpDate} />)
                }
            </ul>
        </div>
    )
}