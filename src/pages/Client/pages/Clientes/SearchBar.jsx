import { SearchBarIcon } from "../../../../../assets/Icons"

export const SearchBar = ({ setSerachBarValue }) => {

    const handleChange = (e) => {
        setSerachBarValue(e.target.value.trim().toLowerCase())
    }

    return (
        <div className="search-bar">
            <input type="text" id="search-bar-input" onChange={handleChange} placeholder="Nombre y Apellido" />
            <label htmlFor="search-bar-input">
                <SearchBarIcon />
            </label>
        </div>

    )
}