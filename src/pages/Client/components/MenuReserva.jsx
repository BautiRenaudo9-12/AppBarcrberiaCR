import moment from "moment"
import pinSvg from "../../../../assets/Iconpin.svg"
import { removeReserve } from "../../../services/initializeFirebase"
import { useEffect } from "react"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

export const MenuReserva = ({ modalConfirmTurnoModal, setOpenLoading, reserveDate, setReserveDate }) => {

    const dayName = arrayDias[moment(reserveDate.time).format("d")]
    const date = moment(reserveDate.time).format("DD/MM")
    const hour = moment(reserveDate.time).format("HH:mm")

    useEffect(() => {
        modalConfirmTurnoModal.confirmTurnoModal.confirm = false
    }, [])

    useEffect(() => {
        if (modalConfirmTurnoModal.confirmTurnoModal.confirm == true) {
            //remove reserve
            removeReserveFunction()
        }
    }, [modalConfirmTurnoModal.confirmTurnoModal])

    const removeReserveFunction = () => {
        setOpenLoading(true)
        removeReserve({ arrayDias, reserveDate }).then(() => {
            console.log(reserveDate)
            setReserveDate(null)
            setOpenLoading(false)
        })
    }

    return (
        <div className="menu-reserva">
            <div className="info-conteiner">
                <div className="day">{dayName + " " + date}</div>
                <div className="hour">{hour}</div>
                <span>
                    <img src={pinSvg} alt="" />
                </span>
            </div>
            <button onClick={() => {
                modalConfirmTurnoModal.openModal()
                modalConfirmTurnoModal.setInfo("¿Estas seguro de cancelar la reserva?")
            }}>CANCELAR RESERVA</button>
        </div>
    )
}