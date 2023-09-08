import "./modals.css"

export const ConfirmTurnoModal = ({ modalConfirmTurnoModal }) => {


    const p =
        typeof modalConfirmTurnoModal.infoConfirmTurnoModal == "string"
            ?
            <p>{modalConfirmTurnoModal.infoConfirmTurnoModal}</p>
            :
            <>
                <p>{modalConfirmTurnoModal.infoConfirmTurnoModal.day}</p>
                <p>{modalConfirmTurnoModal.infoConfirmTurnoModal.time}</p>
            </>

    return (
        <div className="confirm-turno-modal modal">
            <div className="conteiner">
                <span>
                    {p}
                </span>
                <footer>
                    <button className="cancelar" onClick={modalConfirmTurnoModal.cancelarModal}>CANCELAR</button>
                    <button className="confirmar" onClick={modalConfirmTurnoModal.confirmarModal}>CONFIRMAR</button>
                </footer>
            </div>
        </div>
    )
}