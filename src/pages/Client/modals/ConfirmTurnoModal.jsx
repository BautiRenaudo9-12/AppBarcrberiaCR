export const ConfirmTurnoModal = ({ modalConfirmTurnoModal }) => {

    return (
        <div className="confirm-turno-modal modal">
            <div className="conteiner">
                <span>
                    <p>{modalConfirmTurnoModal.infoConfirmTurnoModal.day}</p>
                    <p>{modalConfirmTurnoModal.infoConfirmTurnoModal.hour}</p>
                </span>
                <footer>
                    <button className="cancelar" onClick={modalConfirmTurnoModal.cancelarModal}>CANCELAR</button>
                    <button className="confirmar" onClick={modalConfirmTurnoModal.confirmarModal}>CONFIRMAR</button>
                </footer>
            </div>
        </div>
    )
}