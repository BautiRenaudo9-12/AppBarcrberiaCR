import { useEffect, useState } from "react"
import { putReserve, putState } from "../services/initializeFirebase"

export const useConfirmTurnoModal = () => {
    const [confirmTurnoModal, setConfirmTurnoModal] = useState({ open: false, confirm: false })
    const [infoConfirmTurnoModal, setInfoConfirmTurnoModal] = useState("")

    const openModal = () => setConfirmTurnoModal({ open: true, confirm: false })
    const closeModal = () => setConfirmTurnoModal({ open: false, confirm: false })
    const confirmarModal = () => setConfirmTurnoModal({ open: false, confirm: true })
    const cancelarModal = () => setConfirmTurnoModal({ open: false, confirm: false })

    const setInfo = (info) => setInfoConfirmTurnoModal(info)

    const putReservePicked = async (props) => {
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
        putReservePicked
    }
}

export const useReserveInfoAdmin = () => {
    const [confirmReserve, setConfirmReserve] = useState({ open: false, confirm: false })
    const [infoConfirmReserve, setInfoConfirmReserve] = useState("")

    const openModal = () => setConfirmReserve({ open: true, confirm: false })
    const closeModal = () => setConfirmReserve({ open: false, confirm: false })
    const confirmarModal = () => setConfirmReserve({ open: false, confirm: true })
    const cancelarModal = () => setConfirmReserve({ open: false, confirm: false })

    const setInfo = (info) => setInfoConfirmReserve(info)

    const putReservePicked = async (props) => {
        await putReserve(props)
    }

    return {
        confirmReserve,
        openModal,
        closeModal,
        confirmarModal,
        cancelarModal,
        infoConfirmReserve,
        setInfo,
        putReservePicked
    }
}

export const useTurnoStateModal = () => {
    const [confirmState, setConfirmState] = useState({ open: false, confirm: false })
    const [info, setInfo] = useState("")

    const openModal = () => setConfirmState({ open: true, confirm: false })
    const closeModal = () => setConfirmState({ open: false, confirm: false })
    const confirmarModal = () => setConfirmState({ open: false, confirm: true })
    const cancelarModal = () => setConfirmState({ open: false, confirm: false })

    const putStateSelected = async (props) => {
        await putState(props)
    }

    return {
        confirmState,
        openModal,
        closeModal,
        confirmarModal,
        cancelarModal,
        info,
        setInfo,
        putStateSelected
    }
}