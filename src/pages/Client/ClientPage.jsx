import { useState, useEffect } from "react"
import { HomePage } from "./HomePage"
import { AsidePage } from "./AsidePage"
import { useConfirmTurnoModal } from "../../hooks/hooks"

const ConfirmTurnoModal = ({ modalConfirmTurnoModal }) => {

    console.log(modalConfirmTurnoModal.infoConfirmTurnoModal)
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

export function ClientPage() {
    const [asideStyle, setAsideStyle] = useState({ translate: "120% 0" })
    const [homeStyle, setHomeStyle] = useState({ translate: "0 0" })

    const [isAdmin, setIsAdmin] = useState(true)

    const modalConfirmTurnoModal = useConfirmTurnoModal();

    return (
        <>
            <div className="page client-page">
                {modalConfirmTurnoModal.confirmTurnoModal.open && <ConfirmTurnoModal modalConfirmTurnoModal={modalConfirmTurnoModal} />}

                <HomePage homeStyle={homeStyle} isAdmin={isAdmin} />
                <AsidePage modalConfirmTurnoModal={modalConfirmTurnoModal} isAdmin={isAdmin} asideStyle={asideStyle} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
            </div>
        </>
    )
}