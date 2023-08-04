import moment from "moment"
import pinSvg from "../../../../assets/Iconpin.svg"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

export const MenuReserva = ({ reservaDate }) => {

    const dayName = arrayDias[moment(reservaDate).format("d")]
    const date = moment(reservaDate).format("DD/MM")
    const hour = moment(reservaDate).format("hh:mm")

    return (
        <div className="menu-reserva">
            <div className="info-conteiner">
                <div className="day">{dayName + " " + date}</div>
                <div className="hour">{hour}</div>
                <span>
                    <img src={pinSvg} alt="" />
                </span>
            </div>
            <button>CANCELAR RESERVA</button>
        </div>
    )
}