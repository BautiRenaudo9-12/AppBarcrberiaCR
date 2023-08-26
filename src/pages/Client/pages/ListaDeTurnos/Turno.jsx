import { useEffect, useState } from "react"
import moment from "moment/moment"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]


export const Turno = ({ time, info }) => {
    //si existe info es porque lo renderiza turnos  
    return (
        <li className="turno">
            <div className="hour">{moment(time).format("HH:mm")}</div>
            <div className="elements-div">
                Bautista Renaudo
            </div>
        </li>
    )
}