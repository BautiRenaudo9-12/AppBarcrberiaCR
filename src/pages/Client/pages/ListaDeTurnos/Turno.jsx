import { useEffect, useState } from "react"
import moment from "moment/moment"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]


export const Turno = ({ doc }) => {
    const time = moment(doc.data().hora.toDate()).format()
    const name = doc.data().reserve.name

    return (
        <li className="turno">
            <div className="hour">{moment(time).format("HH:mm")}</div>
            <div className="elements-div">
                {name}
            </div>
        </li>
    )
}