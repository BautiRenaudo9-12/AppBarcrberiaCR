import { useEffect } from "react"
import moment from "moment/moment"
const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]


export const Turno = ({ setOpenLoading, reserveId, setReservaDate, isAdmin, time, modalConfirmTurnoModal, pickUpDate }) => {

    useEffect(() => {
        if (modalConfirmTurnoModal.confirmTurnoModal.confirm == true) {
            //reservar turno
            setOpenLoading(true)
            const props = {
                arrayDias,
                pickUpDate,
                time,
                reserveId,
                setOpenLoading
            }
            modalConfirmTurnoModal.setReservePickedId(props).then(()=>{
                setOpenLoading(false)
                setReservePicked()
            })
        }
    }, [modalConfirmTurnoModal.confirmTurnoModal])

    const setReservePicked = () => {
        const date = moment(pickUpDate.split("/").reverse().join("-"))
        const hour = moment(time).format("HH")
        const minute = moment(time).format("mm")
        const dateTransformed = moment(date).hours(hour).minutes(minute).format()
        setReservaDate(dateTransformed)
    }

    return (
        <li className="turno">
            <div className="hour">{moment(time).format("HH:mm")}</div>
            <div className="elements-div">
                <button className="reservar-button" onClick={() => {
                    const date = moment(pickUpDate.split("/").reverse().join("-"))
                    modalConfirmTurnoModal.openModal()
                    modalConfirmTurnoModal.setInfo({
                        day: arrayDias[date.day()] + " " + date.format("DD/MM"),
                        hour: moment(time).format("HH:mm")
                    })
                }}>RESERVAR</button>
                {
                    isAdmin &&
                    (<>
                        <button className="toggle"></button>
                        <svg className="info" style={{ cursor: "pointer" }} width="23" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.5 13C2.91015 13 0 10.0899 0 6.5C0 2.91015 2.91015 0 6.5 0C10.0899 0 13 2.91015 13 6.5C12.9961 10.0882 10.0882 12.9961 6.5 13ZM1.3 6.6118C1.33076 9.47261 3.66672 11.7712 6.52765 11.7559C9.38858 11.7404 11.6997 9.41687 11.6997 6.5559C11.6997 3.69493 9.38858 1.37135 6.52765 1.3559C3.66672 1.3406 1.33076 3.63919 1.3 6.5V6.6118ZM7.8 9.75H5.85V7.15H5.2V5.85H7.15V8.45H7.8V9.75ZM7.15 4.55H5.85V3.25H7.15V4.55Z" fill="white"></path>
                        </svg>
                    </>
                    )
                }
            </div>
        </li>
    )
}