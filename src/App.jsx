import { useState, useEffect } from 'react'
import './App.css'
import { SignPage } from "./pages/Sign/SignPage"
import { ClientPage } from "./pages/Client/ClientPage"
import { app, auth } from "./services/initializeFirebase"
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route } from "react-router-dom"


function App() {
  const [isSigned, setIsSigned] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        const isadmin = user.email === adminEmail;
        //setIsAdmin(isadmin)
        setIsSigned(true)
      } else {
        setIsSigned(false)
      }
    });
  }, [])

  return (
    <>

      <Routes>
        <Route path="*" element={isSigned ? <ClientPage isAdmin={isAdmin} /> : <SignPage />} />
      </Routes>

    </>
  )
}

export default App
