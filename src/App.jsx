import { useState, useEffect } from 'react'
import './App.css'
import { SignPage } from "./pages/Sign/SignPage"
import { ClientPage } from "./pages/Client/ClientPage"
import { app, auth } from "./services/initializeFirebase"
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route } from "react-router-dom"


function App() {
  const [isSigned, setIsSigned] = useState(true)

  /*useEffect(() => {
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
     
      <Routes>
        <Route path="*" element={isSigned ? <ClientPage /> : <SignPage />} />
      </Routes>

    </>
  )
}

export default App
