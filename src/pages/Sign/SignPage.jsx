import { useState, useEffect } from "react"

import { SignInPage } from "./SignInPage"
import { SignUpPage } from "./SignUpPage"

export function SignPage({ setOpenLoading }) {
    const [isSignInPageOpen, setIsSignInPageOpen] = useState(true)

    return (
        <>
            <div className="page sign-page">
                <SignInPage isSignInPageOpen={isSignInPageOpen} setIsSignInPageOpen={setIsSignInPageOpen} setOpenLoading={setOpenLoading} />
                <SignUpPage isSignInPageOpen={isSignInPageOpen} setIsSignInPageOpen={setIsSignInPageOpen} setOpenLoading={setOpenLoading} />
            </div>
        </>
    )
}