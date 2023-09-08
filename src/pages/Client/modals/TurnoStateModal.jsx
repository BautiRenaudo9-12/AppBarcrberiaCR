import { useState, useEffect } from "react"
import "./modals.css"
import moment from "moment/moment"

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

export const TurnoStateModal = ({ turnoStateModal }) => {
    const [inputNumberValue, setInputNumberValue] = useState(1)
    const [inputRadioId, setInputRadioId] = useState("")

    const handleInputNumberRangeChange = (e) => {
        const value = parseInt(e.target.value)
        const min = parseInt(e.target.min)
        const max = parseInt(e.target.max)

        if (value < min)
            setInputNumberValue(min)
        else if (value > max)
            setInputNumberValue(max)
        else
            setInputNumberValue(value)
    }

    const handleInputRadioChange = (e) => setInputRadioId(e.target.id)

    useEffect(() => {
        turnoStateModal.setInfo({
            ...turnoStateModal.info,
            type: inputRadioId,
            weeksAmount: inputRadioId == "semana" && inputNumberValue,
        })
    }, [inputRadioId, inputNumberValue])


    return (
        <div className="turno-state-modal modal">
            <div className="conteiner">
                <div className="nav">
                    <div className="date">
                        <div className="time">
                            {
                                moment(turnoStateModal.info.pickUpDate).format("HH:mm")
                            }</div>
                        <div className="day">
                            {
                                arrayDias[moment(turnoStateModal.info.pickUpDate).format("d")]
                                + " " +
                                moment(turnoStateModal.info.pickUpDate).format("DD/MM")
                            }</div>
                    </div>
                    <div className="process-type">
                        {turnoStateModal.info.action == "activating" ? "ACTIVANDO..." : "DESACTIVANDO..."}
                    </div>
                </div>
                <ul>
                    <li>
                        <label htmlFor="una">
                            <input
                                type="radio"
                                name="radio"
                                id="una"
                                defaultChecked={false}
                                onChange={handleInputRadioChange} />
                            <i></i>
                            <p>Solo una vez</p>
                        </label>
                    </li>
                    <li>
                        <label htmlFor="siempre">
                            <input
                                type="radio"
                                name="radio"
                                id="siempre"
                                defaultChecked={false}
                                onChange={handleInputRadioChange} />
                            <i></i>
                            <p>Para siempre</p>
                        </label>
                    </li>
                    <li>
                        <label htmlFor="semana">
                            <input
                                type="radio"
                                name="radio"
                                id="semana"
                                defaultChecked={false}
                                onChange={handleInputRadioChange} />
                            <i></i>
                            <p>Unas semanas</p>
                        </label>
                        <input type="number" value={inputNumberValue} max="52" min="1" onChange={handleInputNumberRangeChange} />
                    </li>
                </ul>
                <footer>
                    <button className="cancelar" onClick={turnoStateModal.cancelarModal}>CANCELAR</button>
                    <button className="confirmar" onClick={turnoStateModal.confirmarModal}>CONFIRMAR</button>
                </footer>
            </div>
        </div>
    )
}