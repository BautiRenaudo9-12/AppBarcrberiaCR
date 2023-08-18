import { useEffect, useState } from "react"
import { auth, getUserInfo } from "../../../../services/initializeFirebase"
import { signOut } from "firebase/auth";

export function PerfilPage({ userInfo, setUserInfo, setPageName, setAsideStyle, setHomeStyle }) {

    useEffect(() => {
        setPageName("Perfil")
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
        JSON.stringify(userInfo) == JSON.stringify({})
            && getUserInfo().then(userInfo => setUserInfo(userInfo))
    }, [])



    return (
        <div className="page perfil-page">
            <div className="field">
                <span>Nombre y apellido: </span>
                <div className="value">{userInfo.name}</div>
            </div>
            <div className="field">
                <span>Email: </span>
                <div className="value">{userInfo.email}</div>
            </div>
            <div className="field">
                <span>Nro. de telefono: </span>
                <div className="value">{userInfo.nro}</div>
            </div>




            <button onClick={() => {
                signOut(auth)
            }}>CERRAR SESION</button>
        </div>
    )
}