import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, getAdditionalUserInfo } from "firebase/auth";
import {
  getFirestore, Timestamp,
  collection, doc, getDoc, getDocs, query, onSnapshot, updateDoc, setDoc, addDoc, deleteDoc,
  orderBy, where,
} from "firebase/firestore";
import moment from "moment";
import { TurnoHistorial } from "../pages/Client/pages/Historial/TurnoHistorial";

const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]


const firebaseConfig = {
  apiKey: "AIzaSyCEvPU8AVRTP436__VucfKIh2sKeff8ewY",
  authDomain: "react-appbarberiacr.firebaseapp.com",
  projectId: "react-appbarberiacr",
  storageBucket: "react-appbarberiacr.appspot.com",
  messagingSenderId: "461314344648",
  appId: "1:461314344648:web:8d5752cefcedebed9547fd",
  measurementId: "G-L0F8BL59VQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    return alert(error.message);
  }
}

const _setUserProperties = async ({ nameValue, nroValue }) => {
  console.log(nameValue, nroValue)
  updateProfile(auth.currentUser, {
    displayName: nameValue,
  })
}


const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    return userCredential.user;
  } catch (error) {
    return alert(error.message);
  }
}

//signOut(auth)

const getUserInfo = async () => {
  const userInfo = JSON.parse(localStorage.getItem("USER_INFO"))
  if (userInfo)
    return {
      name: userInfo.name,
      email: userInfo.email,
      nro: userInfo.nro
    }

  const docSnap = await getDoc(doc(db, "clientes", auth.currentUser.email))
  localStorage.setItem("USER_INFO", JSON.stringify({
    name: docSnap.data().name,
    email: docSnap.data().email,
    nro: docSnap.data().nro
  }))
  return {
    name: docSnap.data().name,
    email: docSnap.data().email,
    nro: docSnap.data().nro
  }
}

const getReserve = async (isDateAfterNowBy30Min) => {
  const docSnap = await getDoc(doc(db, "clientes", auth.currentUser.email))
  if (docSnap.exists) {
    const docTime = {
      time: docSnap.data().reserve.time.toDate(),
      id: docSnap.data().reserve.id
    }
    if (isDateAfterNowBy30Min(docTime.time))
      return docTime
    else
      return null
  }
}

const getHistory = async () => {
  const q = query(collection(db, "clientes", auth.currentUser.email, "history"), orderBy("time", "desc"))
  const docQuery = await getDocs(q)
  return docQuery
}

const getTurnos = async (setTurnosList, setOpenLoading, pickUpDate) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d")].toLowerCase()
  setOpenLoading(true)
  const unsub = onSnapshot(collection(db, "turnos", dayNamePicked, "turnos"), query => {
    setTurnosList(query.docs)
    setOpenLoading(false)
  })

  return unsub
}

const getReserves = async (setOpenLoading, pickUpDate) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d")].toLowerCase()
  setOpenLoading(true)
  const docsSnap = await getDocs(collection(db, "turnos", dayNamePicked, "turnos"))
  setOpenLoading(false)
  return docsSnap
}

const putReserve = async ({ isAdmin, arrayDias, pickUpDate, time, reserveId }) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d")].toLowerCase()
  const hour = moment(time).format("HH")
  const minute = moment(time).format("mm")
  const timeMoment = moment(pickUpDate.split("/").toReversed().join("-"))
    .hours(hour)
    .minutes(minute)
    .format()
  const recipientEmail = isAdmin ? /*infoModal.email*/ "renaudobautista@gmail.com" : auth.currentUser.email
  const timestamp = Timestamp.fromDate(new Date(timeMoment))
  const reserveObj =
    isAdmin
      ? {
        reserve: {
          email: /*infoModal.email*/ "renaudobautista@gmail.com",
          name: /*infoModal.name*/"Bauti",
          time: Timestamp.fromDate(new Date(
            moment(pickUpDate.split("/").toReversed().join("-"))
              .hours(hour)
              .minutes(minute)
              .format()
          ))
        }
      }
      : {
        reserve: {
          email: auth.currentUser.email,
          name: auth.currentUser.displayName,
          time: Timestamp.fromDate(new Date(timeMoment))
        }
      }
  const localStorageReserveObj = JSON.stringify({
    time: timeMoment,
    id: reserveId
  })

  try {
    await updateDoc(doc(db, "turnos", dayNamePicked, "turnos", reserveId), reserveObj)
    await updateDoc(doc(db, "clientes", recipientEmail), {
      reserve: {
        time: timestamp,
        id: reserveId
      },
    })
    await setDoc(doc(db, "clientes", recipientEmail, "history", reserveId), {
      time: timestamp,
      id: reserveId
    })
    localStorage.setItem("RESERVE", localStorageReserveObj)
  }
  catch (error) {
    console.log(error)
  }
}

const removeReserve = async ({ arrayDias, reserveDate }) => {
  const dayNamePicked = arrayDias[moment(reserveDate.time.split("/").reverse().join("-")).format("d")].toLowerCase()
  const timeMoment = moment().utcOffset("-03:00").subtract(1, 'days').format()

  await updateDoc(doc(db, "turnos", dayNamePicked, "turnos", reserveDate.id), {
    reserve: {
      time: Timestamp.fromDate(new Date(timeMoment))
    }
  })
  await updateDoc(doc(db, "clientes", auth.currentUser.email), {
    reserve: {},
  })
  await deleteDoc(doc(db, "clientes", auth.currentUser.email, "history", reserveDate.id))
  localStorage.setItem("RESERVE", JSON.stringify({
    time: timeMoment,
    id: null
  }))
}



export {
  app, db, auth,
  signIn, signUp,
  _setUserProperties,
  getReserve, removeReserve, getTurnos, getReserves, putReserve, getUserInfo, getHistory
}