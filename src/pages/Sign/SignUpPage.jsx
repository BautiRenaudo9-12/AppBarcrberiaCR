import { useEffect, useState } from "react"
import greenArrow from "../../../assets/green-arrow.svg"
import { signUp, db, _setUserProperties } from "../../services/initializeFirebase"
import { doc, setDoc } from "firebase/firestore";

export function SignUpPage({ isSignInPageOpen, setIsSignInPageOpen, setOpenLoading }) {
    const [emailValue, setEmailValue] = useState("")
    const [passValue, setPassValue] = useState("")
    const [nameValue, setNameValue] = useState("")
    const [nroValue, setNroValue] = useState("")

    const handleFooterClick = () => {
        setIsSignInPageOpen(!isSignInPageOpen)
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setOpenLoading(true)
        const user = await signUp(emailValue, passValue)
        const userInfo = JSON.stringify({
            email: emailValue,
            name: nameValue,
            nro: nroValue
        })
        await _setUserProperties({ nameValue, nroValue })
        user && await setDoc(doc(db, "clientes", emailValue), userInfo)
        localStorage.setItem("USER_INFO", userInfo)

        setOpenLoading(false)
        e.target.reset()
    }

    return (
        <div
            className="sign-up-page sign-conteiner"
            style={
                isSignInPageOpen ? { transform: "translateX(100%)" } : { transform: "translateX(0%)" }
            }
        >
            <form action="" onSubmit={handleFormSubmit}>
                <h2>CREAR CUENTA</h2>
                <div className="inputs-div">
                    <input type="email" placeholder="Email:" onChange={(e) => { setEmailValue(e.target.value) }} required />
                    <input type="text" placeholder="Nombre y apellido:" onChange={(e) => { setNameValue(e.target.value) }} required />
                    <input type="number" placeholder="Nro. de tel.:" onChange={(e) => { setNroValue(e.target.value) }} required />
                    <input type="password" placeholder="Contraseña:" onChange={(e) => { setPassValue(e.target.value) }} required />
                </div>
                <button type="submit">
                    <img style={{ width: 30 }} src={greenArrow} alt="Flecha verde para boton de formulario" />
                </button>
            </form>
            <div className="footer" onClick={handleFooterClick}>
                <p className="p1">Ya tienes una cuenta ?</p>
                <p className="p2">Iniciar sesión</p>
            </div>
        </div>
    )
}