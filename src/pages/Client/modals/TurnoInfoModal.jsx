import { useState, useEffect } from "react"
import "./modals.css"

export const TurnoInfoModal = ({ turnoInfoModal }) => {

    

    return (
        <div className="turno-state-modal modal">
            <div className="conteiner">
                <div className="nav">
                    <div className="date">
                        <div className="time">13:30</div>
                        <div className="day">Martes 09/12</div>
                    </div>
                    <div className="process-type">
                    {turnoStateModal.info.action=="activating" ? "ACTIVANDO..." : "DESACTIVANDO..."}
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