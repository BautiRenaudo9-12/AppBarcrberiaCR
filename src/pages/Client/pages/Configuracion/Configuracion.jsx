import moment from "moment/moment"

export const Configuracion = ({ data }) => {

    console.log(data.dia)

    return (
        <div className="configuracion">
            <div className="dayName">{data.dia.toUpperCase()}</div>
            <div className="elements">
                <div className="element">
                    <p>Desde</p>
                    <input type="time" name="" id="" value={moment().format("HH:mm")} />
                </div>
                <div className="element">
                    <p>Hasta</p>
                    <input type="time" name="" id="" />
                </div>
                <div className="element">
                    <p>Int(min)</p>
                    <input type="number" name="" id="" />
                </div>
            </div>
            <button>GUARDAR</button>
        </div>
    )
}