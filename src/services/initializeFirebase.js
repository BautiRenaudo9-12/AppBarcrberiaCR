import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import {
  getFirestore, Timestamp,
  collection, orderBy, where, doc, getDoc, getDocs, query, onSnapshot, updateDoc
} from "firebase/firestore";
import moment from "moment";


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

const _updateProfile = async ({ nameValue }) => {
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

const getReserve = async (isDateAfterNowBy30Min) => {
  const q = query(collection(db, "clientes", /*auth.currentUser.email*/ "baurenaudo@gmail.com", "reserves"), orderBy("time"))
  const querySnapshot = await getDocs(q)
  if (querySnapshot.size) {
    const docTime = querySnapshot.docs[querySnapshot.size - 1].data().time.toDate()
    if (isDateAfterNowBy30Min(docTime)) {
      return docTime
    } else {
      return null
    }
  }
}

const getTurnos = async (setTurnosList, setOpenLoading) => {
  setOpenLoading(true)
  const unsub = onSnapshot(collection(db, "turnos", "lunes", "turnos"), query => {
    setTurnosList(query.docs)
    setOpenLoading(false)
  })

  return unsub
}

const putReserve = async ({ arrayDias, pickUpDate, time, reserveId }) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d")]
  const hour = moment(time).format("HH")
  const minute = moment(time).format("mm")
  await updateDoc(doc(db, "turnos", /*dayNamePicked*/ "lunes", "turnos", reserveId), {
    reserve: {
      email: auth.currentUser.email,
      name: auth.currentUser.displayName,
      time: Timestamp.fromDate(new Date(
        moment(pickUpDate.split("/").toReversed().join("-"))
          .hours(hour)
          .minutes(minute)
          .format()
      ))
    }
  })
}

export { app, db, auth, signIn, signUp, _updateProfile, getReserve, getTurnos, putReserve }