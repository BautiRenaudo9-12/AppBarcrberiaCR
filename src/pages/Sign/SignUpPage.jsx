import greenArrow from "../../../assets/green-arrow.svg"

export function SignUpPage({ isSignInPageOpen, setIsSignInPageOpen }) {
    const handleFooterClick = () => {
        setIsSignInPageOpen(!isSignInPageOpen)
    }

    return (
        <div
            className="sign-up-page sign-conteiner"
            style={
                isSignInPageOpen ? { transform: "translateX(100%)" } : { transform: "translateX(0%)" }
            }
        >
            <form action="">
                <h2>CREAR CUENTA</h2>
                <div className="inputs-div">
                    <input type="email" placeholder="Email:" />
                    <input type="text" placeholder="Nombre y apellido:" />
                    <input type="number" placeholder="Nro. de tel.:" />
                    <input type="password" placeholder="Contraseña:" />
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