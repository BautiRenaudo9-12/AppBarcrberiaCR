import { useState, useEffect } from "react"

import { SignInPage } from "../components/SignInPage"
import { SignUpPage } from "../components/SignUpPage"

export function SignPage() {
    const [isSignInPageOpen, setIsSignInPageOpen] = useState(true)

    return (
        <>
            <div className="page sign-page">
                <SignInPage isSignInPageOpen={isSignInPageOpen} setIsSignInPageOpen={setIsSignInPageOpen} />
                <SignUpPage isSignInPageOpen={isSignInPageOpen} setIsSignInPageOpen={setIsSignInPageOpen} />
            </div>
        </>
    )
}