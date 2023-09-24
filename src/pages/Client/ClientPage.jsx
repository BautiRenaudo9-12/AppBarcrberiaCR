import { useState, useEffect } from "react"
import { HomePage } from "./HomePage"
import { AsidePage } from "./AsidePage"
import { useConfirmTurnoModal, useReserveInfoAdmin, useTurnoStateModal } from "../../hooks/hooks"
import { ConfirmTurnoModal } from "./modals/ConfirmTurnoModal"
import { TurnoStateModal } from "./modals/TurnoStateModal"
import moment from "moment"
import { getReserve } from "../../services"
import { ReserveInfoAdmin } from "./modals/ReserveInfoAdmin"


export function ClientPage({ isAdmin, setOpenLoading, setOpenLoading2 }) {
    const [asideStyle, setAsideStyle] = useState({ translate: "120% 0" })
    const [homeStyle, setHomeStyle] = useState({ translate: "0 0" })
    const [reserveDate, setReserveDate] = useState(null)
    const modalConfirmTurnoModal = useConfirmTurnoModal()
    const reserveInfoAdmin = useReserveInfoAdmin()
    const turnoStateModal = useTurnoStateModal()

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
                {reserveInfoAdmin.confirmReserve.open && <ReserveInfoAdmin reserveInfoAdmin={reserveInfoAdmin} />}
                {turnoStateModal.confirmState.open && <TurnoStateModal turnoStateModal={turnoStateModal} />}

                <HomePage
                    modalConfirmTurnoModal={modalConfirmTurnoModal}
                    setOpenLoading2={setOpenLoading2}
                    homeStyle={homeStyle}
                    isAdmin={isAdmin}
                    reserveDate={reserveDate}
                    setReserveDate={setReserveDate} />

                <AsidePage
                    turnoStateModal={turnoStateModal}
                    reserveInfoAdmin={reserveInfoAdmin}
                    modalConfirmTurnoModal={modalConfirmTurnoModal}
                    setOpenLoading2={setOpenLoading2}
                    setOpenLoading={setOpenLoading}
                    setReserveDate={setReserveDate}
                    reserveDate={reserveDate}
                    isAdmin={isAdmin}
                    asideStyle={asideStyle}
                    setAsideStyle={setAsideStyle}
                    setHomeStyle={setHomeStyle} />
            </div>
        </>
    )
}