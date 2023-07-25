import { useState, useEffect } from 'react'

import './App.css'

import { SignPage } from "./components/SignPage"
import { ClientPage } from "./components/ClientPage"

import app from "./services/initializeFirebase"
import { getAuth, onAuthStateChanged } from "firebase/auth";

function App() {
  const [isSigned, setIsSigned] = useState(true)

  /*useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        setIsSigned(true)
      } else {
        setIsSigned(false)
      }
    });
  }, [])*/

  return (
    <>
      {
        isSigned ? <ClientPage /> : <SignPage />
      }
    </>
  )
}

export default App
