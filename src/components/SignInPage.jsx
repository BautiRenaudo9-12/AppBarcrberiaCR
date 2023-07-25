import greenArrow from "../../assets/green-arrow.svg"

export function SignInPage({ isSignInPageOpen, setIsSignInPageOpen }) {
    const handleFooterClick = () => {
        setIsSignInPageOpen(!isSignInPageOpen)
    }

    return (
        <div
            className="sign-in-page sign-conteiner"
            style={
                isSignInPageOpen ? { transform: "translateX(0%)" } : { transform: "translateX(-100%)" }
            }
        >
            <form action="">
                <h2>INICIAR SESION</h2>
                <div className="inputs-div">
                    <input type="email" placeholder="Email:" />
                    <input type="password" placeholder="Contraseña:" />
                </div>
                <button type="submit">
                    <img style={{width:30}} src={greenArrow} alt="Flecha verde para boton de formulario" />
                </button>
            </form>
            <div className="footer" onClick={handleFooterClick}>
                <p className="p1">No tienes una cuenta ?</p>
                <p className="p2">Crear cuenta</p>
            </div>
        </div>
    )
}