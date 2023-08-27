import { useState, useEffect } from "react"
import { HomePage } from "./HomePage"
import { AsidePage } from "./AsidePage"
import { useConfirmTurnoModal } from "../../hooks/hooks"
import { ConfirmTurnoModal } from "./modals/ConfirmTurnoModal"
import moment from "moment"
import { getReserve } from "../../services/initializeFirebase"


export function ClientPage({ isAdmin, setOpenLoading, setOpenLoading2 }) {
    const [asideStyle, setAsideStyle] = useState({ translate: "120% 0" })
    const [homeStyle, setHomeStyle] = useState({ translate: "0 0" })
    const [reserveDate, setReserveDate] = useState(null)
    const modalConfirmTurnoModal = useConfirmTurnoModal();
    // const

    useEffect(() => {
        if (isAdmin) return
        
        setOpenLoading(true)
        let reserve = localStorage.getItem("RESERVE")
        if (reserve) {
            const reserveParsed = JSON.parse(reserve)
            setReserveDate(isDateAfterNowBy30Min(reserveParsed.time) ? reserveParsed : null), setOpenLoading(false)
        }
        else
            getReserve(isDateAfterNowBy30Min).then(result => setReserveDate(result)).finally(() => setOpenLoading(false))

    }, []);

    function isDateAfterNowBy30Min(date) {
        const now = moment().utcOffset("-03:00")
        const _date = moment(date)
        const minutesDifference = now.diff(_date, "m")

        return minutesDifference <= 30
    }

    return (
        <>
            <div className="page client-page">
                {modalConfirmTurnoModal.confirmTurnoModal.open && <ConfirmTurnoModal modalConfirmTurnoModal={modalConfirmTurnoModal} />}
                <HomePage modalConfirmTurnoModal={modalConfirmTurnoModal} setOpenLoading2={setOpenLoading2} homeStyle={homeStyle} isAdmin={isAdmin} reserveDate={reserveDate} setReserveDate={setReserveDate} />
                <AsidePage setOpenLoading2={setOpenLoading2} setOpenLoading={setOpenLoading} setReserveDate={setReserveDate} reserveDate={reserveDate} modalConfirmTurnoModal={modalConfirmTurnoModal} isAdmin={isAdmin} asideStyle={asideStyle} setAsideStyle={setAsideStyle} setHomeStyle={setHomeStyle} />
            </div>
        </>
    )
}