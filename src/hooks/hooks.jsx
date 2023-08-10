import { useEffect, useState } from "react"
import { putReserve } from "../services/initializeFirebase"

export const useConfirmTurnoModal = () => {
    const [confirmTurnoModal, setConfirmTurnoModal] = useState({ open: false, confirm: false })
    const [infoConfirmTurnoModal, setInfoConfirmTurnoModal] = useState("")

    const openModal = () => setConfirmTurnoModal({ open: true, confirm: false })
    const closeModal = () => setConfirmTurnoModal({ open: false, confirm: false })
    const confirmarModal = () => setConfirmTurnoModal({ open: false, confirm: true })
    const cancelarModal = () => setConfirmTurnoModal({ open: false, confirm: false })

    const setInfo = (info) => setInfoConfirmTurnoModal(info)

    const setReservePickedId = async (props) => {
        await putReserve(props)
    }

    return {
        confirmTurnoModal,
        openModal,
        closeModal,
        confirmarModal,
        cancelarModal,
        infoConfirmTurnoModal,
        setInfo,
        setReservePickedId
    }
}