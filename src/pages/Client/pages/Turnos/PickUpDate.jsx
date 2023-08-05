import moment from "moment/moment"

export const PickUpDate = ({ pickUpDate, setPickUpDate }) => {
    return (
        <div className="pick-up-date">
            <span>
                <input onChange={(e) => {
                    const date = moment(e.target.value)
                    setPickUpDate(date.format("DD/MM/YYYY"))
                }}
                    type="date"
                    min={moment().utcOffset("-03:00").format("YYYY-MM-DD")}
                    max={moment().utcOffset("-03:00").add(6, 'd').format("YYYY-MM-DD")}
                />
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