import { TurnosPage } from "./TurnosPage"
import { HistorialPage } from "./HistorialPage"
import { useEffect } from "react"
import { useState } from "react"

export function AsidePage({ openedPage, setOpenedPage }) {

    const renderPageComponent = () => {
        switch (openedPage) {
            case "TurnosPage":
                return <TurnosPage />
                break;
            case "HistorialPage":
                return <HistorialPage />
                break;
            case "ProfilePage":
                return <ProfilePage />
                break;
            case "ListaDeTurnosPage":
                return <ListaDeTurnosPage />
                break;
            case "ClientesPage":
                return <ClientesPage />
                break;
            case "ConfiguracionPage":
                return <ConfiguracionPage />
                break;

            default:
                break;
        }
    }

    return (
        <div
            className="page aside-page"
            style={
                //asideStyle
                openedPage
                    ?
                    { translate: "0 0" }
                    :
                    { translate: "120% 0" }
            }
        >
            <nav>
                <button onClick={() => { setOpenedPage(null) }}>ATRAS</button>
            </nav>
            {
                /*<Routes>
                    <Route path="/turnos" element={<TurnosPage openedPage={openedPage} setOpenedPage={setOpenedPage} />} />
                </Routes>*/
            }
            {renderPageComponent()}
        </div>
    )
}