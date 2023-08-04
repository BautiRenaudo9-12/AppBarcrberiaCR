import { useState, useEffect } from "react"
import { HomePage } from "./HomePage"
import { AsidePage } from "./AsidePage"
import { useConfirmTurnoModal } from "../../hooks/hooks"
import { ConfirmTurnoModal } from "./modals/ConfirmTurnoModal"
import { db, auth } from "../../services/initializeFirebase"
import { collection, orderBy, where, doc, getDoc, getDocs, query, Timestamp } from "firebase/firestore";
import moment from "moment"

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
            getReserve().then(result => setReservaDate(result))

    }, []);

    const getReserve = async () => {
        const dateNow = moment().utcOffset("-03:00").format().toString()
        const q = query(collection(db, "clientes", /*auth.currentUser.email*/ "baurenaudo@gmail.com", "reserves"), orderBy("time"))
        const querySnapshot = await getDocs(q)
        if (querySnapshot.size) {
            const docTime = querySnapshot.docs[querySnapshot.size - 1].data().time.toDate()
            if (isReserveAfterNow(docTime)) {
                return docTime
            } else {
                return null
            }
        }
    }

    const isReserveAfterNow = (reservaDate) => {
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