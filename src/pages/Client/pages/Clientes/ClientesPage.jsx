import { useEffect, useState } from "react"
import { getClientes } from "../../../../services"
import { Cliente } from "./Cliente"
import { SearchBar } from "./SearchBar"

export function ClientesPage({ setOpenLoading, setPageName, setAsideStyle, setHomeStyle }) {
    const [clientesList, setClientesList] = useState([])
    const [serachBarValue, setSerachBarValue] = useState(null)

    useEffect(() => {
        setPageName("Clientes")
    }, [])

    useEffect(() => {
        setAsideStyle({ translate: "0 0" })
        setHomeStyle({ translate: "-100% 0" })

        return (() => {
            setAsideStyle({ translate: "120% 0" })
            setHomeStyle({ translate: "0 0" })
        })
    }, [])

    useEffect(() => {
        setOpenLoading(true)
        getClientes().then(query => {
            setClientesList(query.docs)
            setOpenLoading(false)
        })
    }, [])


    return (
        <div className="page clientes-page">
            <div className="conteiner">
                <SearchBar setSerachBarValue={setSerachBarValue} />
                <ul>
                    {
                        clientesList.map((doc) => {
                            const name = doc.data().name
                            const historySize = doc.data().historySize

                            return serachBarValue && serachBarValue !== ""
                                ? (
                                    name.toLowerCase().indexOf(serachBarValue) > -1
                                    && <Cliente key={doc.id} name={name} historySize={historySize} />
                                )
                                : <Cliente key={doc.id} name={name} historySize={historySize} />
                        })
                    }
                </ul>
            </div>
        </div>
    )
}