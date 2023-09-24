

export const ReserveInfoAdmin = ({ reserveInfoAdmin }) => {

    const handleChange = (e) => {
        const value = e.target.value
        Object.assign(reserveInfoAdmin.infoConfirmReserve, { reserveName: value });
        reserveInfoAdmin.setInfo(reserveInfoAdmin.infoConfirmReserve)
    }

    return (
        <div className="confirm-turno-modal reserve-info-admin modal">
            <div className="conteiner" style={{ height: "250px" }}>
                <span style={{ translate: "0 -20px" }}>
                    <p>{reserveInfoAdmin.infoConfirmReserve.day}</p>
                    <p>{reserveInfoAdmin.infoConfirmReserve.time}</p>
                </span>
                <input type="text" placeholder="Nombre y apellido" onChange={handleChange} />
                <footer>
                    <button className="cancelar" onClick={reserveInfoAdmin.cancelarModal}>CANCELAR</button>
                    <button className="confirmar" onClick={reserveInfoAdmin.confirmarModal}>CONFIRMAR</button>
                </footer>
            </div>
        </div>
    )
}