import { useEffect, useState } from "react"
import greenArrow from "../../../assets/green-arrow.svg"
import { signIn } from "../../services/initializeFirebase"

export function SignInPage({ isSignInPageOpen, setIsSignInPageOpen, setOpenLoading }) {
    const [emailValue, setEmailValue] = useState("")
    const [passValue, setPassValue] = useState("")

    const handleFooterClick = () => {
        setIsSignInPageOpen(!isSignInPageOpen)
    }

    const handleFormSubmit = async (e) => {
        e.preventDefault()
        setOpenLoading(true)
        try {
            const user = await signIn(emailValue, passValue)
            const userInfo = JSON.stringify({
                email: emailValue,
                name: nameValue,
                nro: nroValue
            })
            localStorage.setItem("USER_INFO", userInfo)
        }
        catch {
            console.log("error")
        }
        e.target.reset()
        setOpenLoading(false)
    }

    return (
        <div
            className="sign-in-page sign-conteiner"
            style={
                isSignInPageOpen ? { transform: "translateX(0%)" } : { transform: "translateX(-100%)" }
            }
        >
            <form action="" onSubmit={handleFormSubmit}>
                <h2>INICIAR SESION</h2>
                <div className="inputs-div">
                    <input type="email" placeholder="Email:" onChange={(e) => { setEmailValue(e.target.value) }} required />
                    <input type="password" placeholder="Contraseña:" onChange={(e) => { setPassValue(e.target.value) }} required />
                </div>
                <button type="submit">
                    <img style={{ width: 30 }} src={greenArrow} alt="Flecha verde para boton de formulario" />
                </button>
            </form>
            <div className="footer" onClick={handleFooterClick}>
                <p className="p1">No tienes una cuenta ?</p>
                <p className="p2">Crear cuenta</p>
            </div>
        </div>
    )
}