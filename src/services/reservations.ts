import {
  collection, doc, getDoc, getDocs, query, onSnapshot, updateDoc, setDoc, deleteDoc,
  orderBy, Timestamp,
  DocumentData,
  Unsubscribe,
  QuerySnapshot
} from "firebase/firestore";
import moment from "moment";
import { db, auth } from "@/lib/firebase";
import { showNotification } from "./notifications";

export const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export const getReserve = async (isDateAfterNowBy30Min: (date: Date) => boolean) => {
  if (!auth.currentUser?.email) return null;
  const docSnap = await getDoc(doc(db, "clientes", auth.currentUser.email));
  if (docSnap.exists() && docSnap.data().reserve && docSnap.data().reserve.time) {
    const docTime = {
      time: docSnap.data().reserve.time.toDate(),
      id: docSnap.data().reserve.id
    };
    if (isDateAfterNowBy30Min(docTime.time))
      return docTime;
    else
      return null;
  }
  return null;
};

export const getTurnos = async (
  setTurnosList: (docs: DocumentData[]) => void,
  setOpenLoading: (loading: boolean) => void,
  pickUpDate: string
): Promise<Unsubscribe> => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d") as unknown as number].toLowerCase();
  setOpenLoading(true);
  const unsub = onSnapshot(collection(db, "turnos", dayNamePicked, "turnos"), (querySnap) => {
    setTurnosList(querySnap.docs);
    setOpenLoading(false);
  });

  return unsub;
};

export const getReserves = async (setOpenLoading: (loading: boolean) => void, pickUpDate: string) => {
  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d") as unknown as number].toLowerCase();
  setOpenLoading(true);
  const docsSnap = await getDocs(collection(db, "turnos", dayNamePicked, "turnos"));
  setOpenLoading(false);
  return docsSnap;
};

export const getDays = async () => {
  const localDays = localStorage.getItem("DAYS_INFO");
  const q = query(collection(db, "turnos"), orderBy("index"));
  // Return typed mock or query result
  // Note: legacy code returned string from localStorage OR QuerySnapshot. This is messy.
  // For now let's assume we fetch fresh.
  return await getDocs(q);
};

export const getDayConfig = async (dayName: string) => {
  const docSnap = await getDoc(doc(db, "turnos", dayName.toLowerCase()));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

interface PutReserveProps {
  isAdmin: boolean;
  arrayDias: string[];
  pickUpDate: string;
  time: string; // ISO string or formatted string
  reserveId: string;
  reserveInfoAdmin?: any;
}

export const putReserve = async ({ isAdmin, arrayDias, pickUpDate, time, reserveId, reserveInfoAdmin }: PutReserveProps) => {
  if (!auth.currentUser) return false;

  const dayNamePicked = arrayDias[moment(pickUpDate.split("/").reverse().join("-")).format("d") as unknown as number].toLowerCase();
  const hour = moment(time).format("HH");
  const minute = moment(time).format("mm");
  const timeMoment = moment(pickUpDate.split("/").toReversed().join("-")).hours(Number(hour)).minutes(Number(minute)).format();
  const recipientEmail = isAdmin ? (reserveInfoAdmin?.infoConfirmReserve?.reserveEmail || "") : auth.currentUser.email || "";
  const timestamp = Timestamp.fromDate(new Date(timeMoment));
  
  const reserveObj =
    isAdmin
      ? {
        reserve: {
          email: recipientEmail, // Can be empty
          name: reserveInfoAdmin?.infoConfirmReserve.reserveName || "Admin Reserva",
          time: Timestamp.fromDate(new Date(timeMoment))
        }
      }
      : {
        reserve: {
          email: auth.currentUser.email,
          name: auth.currentUser.displayName,
          time: Timestamp.fromDate(new Date(timeMoment))
        }
      };
      
  const localStorageReserveObj = JSON.stringify({
    time: timeMoment,
    id: reserveId
  });

  try {
    if (isAdmin) {
      // Admin just blocks the slot in 'turnos'
      await updateDoc(doc(db, "turnos", dayNamePicked, "turnos", reserveId), reserveObj);
      
      // Optionally update user history if an email was provided
      if (recipientEmail) {
         try {
           await updateDoc(doc(db, "clientes", recipientEmail), {
             reserve: { time: timestamp, id: reserveId },
           });
           await setDoc(doc(db, "clientes", recipientEmail, "history", reserveId), {
             time: timestamp,
             id: reserveId
           });
         } catch (e) {
           console.log("Could not update client history (user might not exist)", e);
         }
      }
      showNotification({ text: "Reservado por Admin" });
    } else {
      if (!recipientEmail) return false;
      await updateDoc(doc(db, "turnos", dayNamePicked, "turnos", reserveId), reserveObj);
      await updateDoc(doc(db, "clientes", recipientEmail), {
        reserve: {
          time: timestamp,
          id: reserveId
        },
      });
      await setDoc(doc(db, "clientes", recipientEmail, "history", reserveId), {
        time: timestamp,
        id: reserveId
      });
      localStorage.setItem("RESERVE", localStorageReserveObj);
      showNotification({ text: "Turno reservado exitosamente" });
    }
    return true;
  }
  catch (error) {
    console.log(error);
    return false;
  }
};

// ... putState removed for brevity if not used in User flow immediately, 
// or I can add it if Admin features are needed now. 
// I'll skip it for now to focus on User flow.

export const removeReserve = async ({ arrayDias, reserveDate, clientEmail }: { arrayDias: string[], reserveDate: { time: string, id: string }, clientEmail?: string }) => {
  const targetEmail = clientEmail || auth.currentUser?.email;
  if (!targetEmail) return;

  const dayNamePicked = arrayDias[moment(reserveDate.time.split("/").reverse().join("-")).format("d") as unknown as number].toLowerCase();
  const timeMoment = moment().utcOffset("-03:00").subtract(1, 'days').format();

  try {
    // We must send a complete object to satisfy validation rules
    await updateDoc(doc(db, "turnos", dayNamePicked, "turnos", reserveDate.id), {
      reserve: {
        time: Timestamp.fromDate(new Date(timeMoment)),
        email: "",
        name: ""
      }
    });
    
    // Remove from client's profile
    await updateDoc(doc(db, "clientes", targetEmail), {
      reserve: {},
    });
    
    // Remove from client's history
    await deleteDoc(doc(db, "clientes", targetEmail, "history", reserveDate.id));

    // Only update local storage if user is cancelling their own
    if (!clientEmail) {
      localStorage.setItem("RESERVE", JSON.stringify({
        time: timeMoment,
        id: null
      }));
    }

    showNotification({ text: "Reserva Cancelada", duration: 2500 });
  }
  catch (error) {
    console.log(error);
  }
};
