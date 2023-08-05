import { useState, useEffect } from 'react'
import './App.css'
import { SignPage } from "./pages/Sign/SignPage"
import { ClientPage } from "./pages/Client/ClientPage"
import { app, auth } from "./services/initializeFirebase"
import { onAuthStateChanged } from "firebase/auth";
import { Routes, Route } from "react-router-dom"
import { Loading } from "./components/Loading"


function App() {
  const [isSigned, setIsSigned] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [openLoading, setOpenLoading] = useState(false)

  useEffect(() => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    setOpenLoading(true)
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const uid = user.uid;
        const isadmin = user.email === adminEmail;
        //setIsAdmin(isadmin)
        setIsSigned(true)
      } else {
        setIsSigned(false)
      }
      setOpenLoading(false)
    });
  }, [])

  return (
    <>
      {
        openLoading && <Loading />
      }
      <Routes>
        <Route path="*" element={
          isSigned != null && 
          (isSigned == true ? <ClientPage isAdmin={isAdmin} setOpenLoading={setOpenLoading} /> : <SignPage setOpenLoading={setOpenLoading} />)
        } />
      </Routes>

    </>
  )
}

export default App
