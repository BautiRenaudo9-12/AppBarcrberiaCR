import { useState, useEffect } from "react"
import { HomePage } from "./HomePage"
import { AsidePage } from "./AsidePage"
import { useConfirmTurnoModal } from "../../hooks/hooks"
import { ConfirmTurnoModal } from "./modals/ConfirmTurnoModal"
import moment from "moment"
import { getReserve } from "../../services/initializeFirebase"

export function ClientPage({ isAdmin }) {
    const [asideStyle, setAsideStyle] = useState({ translate: "120% 0" })
    const [homeStyle, setHomeStyle] = useState({ translate: "0 0" })
    const [reservaDate, setReservaDate] = useState(null)
    const modalConfirmTurnoModal = useConfirmTurnoModal();

    useEffect(() => {
        let reserve = localStorage.getItem("RESERVE")
        if (reserve)
            setReservaDate(isReserveAfterNow(reserve) ? reserve : null)
        else
            getReserve(isReserveAfterNow).then(result => setReservaDate(result))

    }, []);

    function isReserveAfterNow(reservaDate) {
        const now = moment().utcOffset("-03:00")
        const reserve = moment(reservaDate)
        const minutesDifference = now.diff(reserve, "m")

        return minutesDifference <= 30
    }

    return (
        <>
            <div className="page client-page">
                {modalConfirmTurnoModal.confirmTurnoModal.open && <ConfirmTurnoModal modalConfirmTurnoModal={modalConfirmTurnoModal} />}

                <HomePage homeStyle={homeStyle} isAdmin={isAdmin} setReservaDate={setReservaDate} reservaDate={reservaDate} />
                <AsidePage setReservaDate={setReservaDate} reservaDate={reservaDate} modalConfirmTurnoModal={modalConfirmTurnoModal} isAdmin={isAdmin} asideStyle={asideStyle} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
            </div>
        </>
    )
}