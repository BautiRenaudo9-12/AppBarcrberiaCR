import { useEffect } from "react"
import { Turno } from "./Turno"
import { PickUpDate } from "../../components/PickUpDate"
import { useState } from "react"
import moment from "moment/moment"
import { getTurnos } from "../../../../services/initializeFirebase"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]


export function TurnosPage({ setOpenLoading2, setOpenLoading, setReserveDate, isAdmin, modalConfirmTurnoModal, reserveInfoAdmin, turnoStateModal, setPageName, setAsideStyle, setHomeStyle }) {
    const [pickUpDate, setPickUpDate] = useState(moment().utcOffset("-03:00").format("DD/MM/YYYY"))
    const [turnosList, setTurnosList] = useState([])
    const [unsub, setUnsub] = useState(null)


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
        const unsub = getTurnosFunction(pickUpDate)
        return () => {
            unsub.then(unsub => unsub())
        }
    }, [])

    useEffect(() => {
        modalConfirmTurnoModal.confirmTurnoModal.confirm = false
        reserveInfoAdmin.confirmReserve.confirm == false
        turnoStateModal.confirmState.confirm == false
    }, [])

    useEffect(() => {
        if (modalConfirmTurnoModal.confirmTurnoModal.confirm == true || reserveInfoAdmin.confirmReserve.confirm == true) {
            //reservar turno
            reserveTurno()
        }
    }, [modalConfirmTurnoModal.confirmTurnoModal, reserveInfoAdmin.confirmReserve])

    useEffect(() => {
        if (turnoStateModal.confirmState.confirm == true) {
            //update state turno
            updateTurnoState()
        }
    }, [turnoStateModal.confirmState])

    function updateTurnoState() {
        setOpenLoading2(true)
        const props = {
            arrayDias,
            pickUpDate,
            reserveId: turnoStateModal.info.reserveId,
            stateInfo: {
                type: turnoStateModal.info.type,
                weeksAmount: turnoStateModal.info.weeksAmount
            },
            action: turnoStateModal.info.action,
            oldState: turnoStateModal.info.oldState
        }

        turnoStateModal.putStateSelected(props).then(() => setOpenLoading2(false))
    }

    function reserveTurno() {
        setOpenLoading2(true)
        const props = {
            isAdmin,
            arrayDias,
            pickUpDate,
            time: modalConfirmTurnoModal.infoConfirmTurnoModal.time,
            reserveId: isAdmin ? reserveInfoAdmin.infoConfirmReserve.reserveId : modalConfirmTurnoModal.infoConfirmTurnoModal.reserveId,
            reserveInfoAdmin,
        }

        if (isAdmin)
            reserveInfoAdmin.putReservePicked(props).then(() => setOpenLoading2(false))
        else {
            modalConfirmTurnoModal.putReservePicked(props).then(() => {
                const date = moment(pickUpDate.split("/").reverse().join("-"))
                const hour = moment(props.time).format("HH")
                const minute = moment(props.time).format("mm")
                const dateTransformed = moment(date).hours(hour).minutes(minute).format()
                const reserveObj = {
                    time: dateTransformed,
                    id: modalConfirmTurnoModal.infoConfirmTurnoModal.reserveId,
                }
                setReserveDate(reserveObj)
                setOpenLoading2(false)
            })
        }
    }

    function getTurnosFunction(date) {
        setTurnosList([])
        const unsub = getTurnos(setTurnosList, setOpenLoading, date)
        unsub.then(unsub => setUnsub(() => unsub))
        return unsub
    }

    function isDateAfterNow(date) {
        const now = moment().utcOffset("-03:00")
        const _date = moment(date)
        const minutesDifference = now.diff(_date, "m")

        return minutesDifference <= 0
    }

    const stateTurnoAdmin = (doc) => {
        let _state = {
            reserved: {
                state: null,
                name: "",
                email: "",
            },
            state: null
        }

        const pickUpDateMoment = moment(pickUpDate.split("/").reverse().join("-"))

        //reservado
        const reservadoFecha = moment(doc.data().reserve.time.toDate())
        if (reservadoFecha.isSame(pickUpDateMoment, "d")) {
            _state.reserved.state = true
            _state.reserved.name = doc.data().reserve.name
            _state.reserved.email = doc.data().reserve.email
        } else {
            _state.reserved.state = false
        }

        //activado - desactivado
        const activadoArray = doc.data().state.active
        if (activadoArray[0] != "siempre") {
            _state.state = "desactive";
            for (let i = 0; i < activadoArray.length; i++) {
                const date = moment(activadoArray[i].toDate())
                if (date.isSame(pickUpDateMoment, "d")) {
                    _state.state = "active";
                    i = activadoArray.length
                }
            }
        }
        else {
            const desactivadoArray = doc.data().state.desactive;
            _state.state = "active";
            for (let i = 0; i < desactivadoArray.length; i++) {
                const date = moment(desactivadoArray[i].toDate())
                if (date.isSame(pickUpDateMoment, "d")) {
                    _state.state = "desactive";
                    i = desactivadoArray.length
                }
            }
        }

        return _state;
    }

    const showTurno = (doc) => {
        let show;
        const now = moment().utcOffset("-03:00")
        const pickUpDateMoment = moment(pickUpDate.split("/").reverse().join("-"))

        //reservado
        const reservadoFecha = moment(doc.data().reserve.time.toDate())
        if (reservadoFecha.isSame(pickUpDateMoment, "d")) return false
        else {
            //activado - desactivado
            const activadoArray = doc.data().state.active
            if (activadoArray[0] != "siempre") {
                show = false;
                for (let i = 0; i < activadoArray.length; i++) {
                    const date = moment(activadoArray[i].toDate())
                    if (date.isSame(now, "d")) {
                        show = true;
                        i = activadoArray.length
                    }
                }
            }
            else {
                const desactivadoArray = doc.data().state.desactive;
                show = true;
                for (let i = 0; i < desactivadoArray.length; i++) {
                    const date = moment(desactivadoArray[i].toDate())
                    if (date.isSame(now, "d")) {
                        show = false;
                        i = desactivadoArray.length
                    }
                }
            }
        }
        return show;
    }

    return (
        <div className="page turnos-page">
            <div className="conteiner">
                <PickUpDate isAdmin={isAdmin} unsub={unsub} getTurnosFunction={getTurnosFunction} pickUpDate={pickUpDate} setPickUpDate={setPickUpDate} />
                <ul>
                    {
                        turnosList.length == 0 && <h3 style={{ translate: "0 180px", fontWeight: "300" }}>NO HAY TURNOS DISPONIBLES</h3>
                    }
                    {
                        turnosList.map((doc) => {
                            const date = moment(pickUpDate.split("/").reverse().join("-"))
                            const hour = moment(doc.data().hora.toDate()).format("HH")
                            const minute = moment(doc.data().hora.toDate()).format("mm")
                            const dateTransformed = moment(date).hours(hour).minutes(minute).format()

                            if (isAdmin) {
                                const state = stateTurnoAdmin(doc)
                                return <Turno stateComplete={doc.data().state} state={state} setOpenLoading={setOpenLoading} setReserveDate={setReserveDate} key={doc.id} reserveId={doc.id} isAdmin={isAdmin} time={moment(doc.data().hora.toDate()).format()} reserveInfoAdmin={reserveInfoAdmin} turnoStateModal={turnoStateModal} pickUpDate={pickUpDate} />
                            } else if (showTurno(doc) && isDateAfterNow(dateTransformed)) {
                                return (
                                    <Turno setOpenLoading={setOpenLoading} setReserveDate={setReserveDate} key={doc.id} reserveId={doc.id} isAdmin={isAdmin} time={moment(doc.data().hora.toDate()).format()} modalConfirmTurnoModal={modalConfirmTurnoModal} pickUpDate={pickUpDate} />
                                )
                            }
                        })
                    }
                </ul>
            </div>

        </div>
    )
}