import { useEffect } from "react"
import { useConfirmTurnoModal } from "../../../../hooks/hooks"
import { useState } from "react"


const PickUpDate = () => {
    const [pickUpDate, setPickUpDate] = useState(new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }))

    return (
        <div className="pick-up-date">
            <span>
                <input onChange={(e) => {
                    setPickUpDate(new Date(e.target.value).toLocaleDateString('en-GB', { timeZone: 'UTC' }))
                }} type="date" name="" id="" icon="" pattern="\d{4}-\d{2}-\d{2}" />
                <div className="before">
                    {pickUpDate}
                </div>
            </span>
            <svg width="22" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.77778 13H1.22222C0.547207 13 0 12.418 0 11.7V2.6C0 1.88203 0.547207 1.3 1.22222 1.3H2.44444V0H3.66667V1.3H7.33333V0H8.55556V1.3H9.77778C10.4528 1.3 11 1.88203 11 2.6V11.7C11 12.418 10.4528 13 9.77778 13ZM1.22222 5.2V11.7H9.77778V5.2H1.22222ZM1.22222 2.6V3.9H9.77778V2.6H1.22222ZM8.55556 10.4H7.33333V9.1H8.55556V10.4ZM6.11111 10.4H4.88889V9.1H6.11111V10.4ZM3.66667 10.4H2.44444V9.1H3.66667V10.4ZM8.55556 7.8H7.33333V6.5H8.55556V7.8ZM6.11111 7.8H4.88889V6.5H6.11111V7.8ZM3.66667 7.8H2.44444V6.5H3.66667V7.8Z" fill="#2C682E"></path>
            </svg>
        </div>
    )
}

const Turno = ({ time, modalConfirmTurnoModal }) => {
    useEffect(() => {
        if (modalConfirmTurnoModal.confirmTurnoModal.confirm == true) {

        }
        //reservar turno
    }, [modalConfirmTurnoModal.confirmTurnoModal])

    return (
        <li className="turno">
            <div className="hour">{time.getHours()}</div>
            <div className="elements-div">
                <button className="reservar-button" onClick={() => {
                    modalConfirmTurnoModal.openModal()
                    modalConfirmTurnoModal.setInfo(time.toLocaleString().split(","))
                }}>RESERVAR</button>
                <button className="toggle"></button>
                <svg className="info" style={{ cursor: "pointer" }} width="23" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.5 13C2.91015 13 0 10.0899 0 6.5C0 2.91015 2.91015 0 6.5 0C10.0899 0 13 2.91015 13 6.5C12.9961 10.0882 10.0882 12.9961 6.5 13ZM1.3 6.6118C1.33076 9.47261 3.66672 11.7712 6.52765 11.7559C9.38858 11.7404 11.6997 9.41687 11.6997 6.5559C11.6997 3.69493 9.38858 1.37135 6.52765 1.3559C3.66672 1.3406 1.33076 3.63919 1.3 6.5V6.6118ZM7.8 9.75H5.85V7.15H5.2V5.85H7.15V8.45H7.8V9.75ZM7.15 4.55H5.85V3.25H7.15V4.55Z" fill="white"></path>
                </svg>
            </div>
        </li>
    )
}


export function TurnosPage({ modalConfirmTurnoModal, setPageName, setAsideStyle, setHomeStyle }) {
    useEffect(() => {
        setPageName("Turnos")
    }, [])

    useEffect(() => {
        setAsideStyle({ translate: "0 0" })
        setHomeStyle({ translate: "-20% 0" })

        return (() => {
            setAsideStyle({ translate: "120% 0" })
            setHomeStyle({ translate: "0 0" })
        })
    }, [])


    let turnosList = [
        {
            id: 1,
            time: new Date("2023-07-28T10:00")
        },
        {
            id: 2,
            time: new Date("2023-07-28T10:30")
        },
        {
            id: 3,
            time: new Date("2023-07-28T11:00")
        },

    ]
    useEffect(() => {
        //get turnos from db
    }, [])

    return (
        <div className="page turnos-page">
            <PickUpDate />
            <ul>
                {
                    turnosList.map((e) => <Turno key={e.id} time={e.time} modalConfirmTurnoModal={modalConfirmTurnoModal} />)
                }
            </ul>
        </div>
    )
}