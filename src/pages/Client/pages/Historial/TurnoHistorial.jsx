import moment from "moment"

export const TurnoHistorial = ({ date }) => {
    const hour = moment(date).format("HH:mm")
    const day = moment(date).format("DD/MM/YYYY")

    return (
        <li className="historial-turno">
            <div className="hour">{hour}</div>
            <div className="time">{day}</div>
        </li>
    )
}