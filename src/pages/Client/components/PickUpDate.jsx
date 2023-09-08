import moment from "moment/moment"
import { TurnosIcon } from "../../../../assets/Icons"

export const PickUpDate = ({ isAdmin, unsub, getTurnosFunction, pickUpDate, setPickUpDate }) => {
    const handleOnchange = (e) => {
        const date = moment(e.target.value).format("DD/MM/YYYY")
        setPickUpDate(date)
        if (unsub) unsub()
        getTurnosFunction(date)
    }


    return (
        <div className="pick-up-date">
            <span>
                <input onChange={(e) => {
                    handleOnchange(e)
                }}
                    type="date"
                    min={!isAdmin && moment().utcOffset("-03:00").format("YYYY-MM-DD")}
                    max={!isAdmin && moment().utcOffset("-03:00").add(6, 'd').format("YYYY-MM-DD")}
                />
                <div className="before">
                    {pickUpDate}
                </div>
            </span>
            <TurnosIcon />

        </div>
    )
}