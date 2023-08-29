
export const Cliente = ({ name, historySize }) => {

    return (
        <li className="clientes-turno">
            <div className="hour">{name}</div>
            <div className="time">{historySize}</div>
        </li>
    )
}