import { useState, useEffect } from "react"

import { SignInPage } from "./SignInPage"
import { SignUpPage } from "./SignUpPage"

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