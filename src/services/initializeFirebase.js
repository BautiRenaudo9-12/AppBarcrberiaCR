import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, getAdditionalUserInfo } from "firebase/auth";
import {
  getFirestore, Timestamp,
  collection, orderBy, where, doc, getDoc, getDocs, query, onSnapshot, updateDoc, setDoc, addDoc
} from "firebase/firestore";
import moment from "moment";

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

const getTurnos = async (setTurnosList, setOpenLoading, pickUpDate) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d").toLowerCase()]
  setOpenLoading(true)
  const unsub = onSnapshot(collection(db, "turnos",/*dayNamePicked*/ "lunes", "turnos"), query => {
    setTurnosList(query.docs)
    setOpenLoading(false)
  })

  return unsub
}

const putReserve = async ({ isAdmin, arrayDias, pickUpDate, time, reserveId }) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d")]
  const hour = moment(time).format("HH")
  const minute = moment(time).format("mm")
  const reserveObj =
    isAdmin
      ? {
        reserve: {
          email: /*infoModal.email*/ "baurenaudo@gmail.com",
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
          time: Timestamp.fromDate(new Date(
            moment(pickUpDate.split("/").toReversed().join("-"))
              .hours(hour)
              .minutes(minute)
              .format()
          ))
        }
      }
  await updateDoc(doc(db, "turnos", /*dayNamePicked*/ "lunes", "turnos", reserveId), reserveObj)

  const recipientEmail =
    isAdmin
      ? //infoModal.email
      "baurenaudo@gmail.com"
      : auth.currentUser.email

  await updateDoc(doc(db, "clientes", recipientEmail), {
    reserve: {
      time: Timestamp.fromDate(new Date(
        moment(pickUpDate.split("/").toReversed().join("-"))
          .hours(hour)
          .minutes(minute)
          .format()
      ))
    }
  })

  console.log("ok")
}



/*prueba*/
const prueba = () => {

  getDocs(collection(db, "turnos",/*dayNamePicked*/ "lunes", "turnos"))
    .then(query => {
      const obj = query.docs[0].data()
      addDoc(collection(db, "turnos", "lunes", "turnos"), obj)
    })

}

//prueba()


export { app, db, auth, signIn, signUp, _setUserProperties, getReserve, getTurnos, putReserve }