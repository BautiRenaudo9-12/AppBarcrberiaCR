import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";

export interface Appointment {
  id?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  timestamp: Timestamp;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  status: "confirmed" | "cancelled" | "completed";
  createdAd: Timestamp;
}

// Fetch appointments for a specific date range (or single date)
export const getAppointmentsByDate = async (dateStr: string) => {
  try {
    // dateStr format: YYYY-MM-DD
    const q = query(
      collection(db, "appointments"),
      where("date", "==", dateStr),
      where("status", "!=", "cancelled")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
};

// Check if a specific slot is available
export const isSlotAvailable = async (dateStr: string, timeStr: string) => {
  const q = query(
    collection(db, "appointments"),
    where("date", "==", dateStr),
    where("time", "==", timeStr),
    where("status", "==", "confirmed")
  );
  const snapshot = await getDocs(q);
  return snapshot.empty;
};

// Create a new appointment
export const createAppointment = async (
  dateStr: string, // YYYY-MM-DD
  timeStr: string, // HH:mm
  clientEmail: string,
  clientName: string,
  clientPhone: string = ""
) => {
  const isAvailable = await isSlotAvailable(dateStr, timeStr);
  if (!isAvailable) {
    throw new Error("El turno ya no está disponible.");
  }

  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  const timestamp = Timestamp.fromDate(new Date(dateTimeStr));

  const newAppointment: Omit<Appointment, "id"> = {
    date: dateStr,
    time: timeStr,
    timestamp,
    clientEmail,
    clientName,
    clientPhone,
    status: "confirmed",
    createdAd: Timestamp.now()
  };

  await addDoc(collection(db, "appointments"), newAppointment);
  return true;
};

// Cancel/Delete appointment
export const cancelAppointment = async (appointmentId: string) => {
    // We can either hard delete or soft delete (status=cancelled).
    // Soft delete is better for history.
    // But for this refactor, let's just delete to keep it simple or align with legacy "removeReserve".
    // Actually, legacy removed the data from the slot.
    // Let's hard delete for now to match "freeing up" logic simply.
    await deleteDoc(doc(db, "appointments", appointmentId));
};

export const getUserActiveAppointment = async (userEmail: string) => {
    const now = new Date();
    // We want appointments where status is confirmed and time is in the future.
    // Firestore composite queries with inequality on different fields are tricky.
    // Simpler: Query by email and status, then filter by date in client.
    
    const q = query(
        collection(db, "appointments"),
        where("clientEmail", "==", userEmail),
        where("status", "==", "confirmed")
    );
    
    const snapshot = await getDocs(q);
    
    // Filter for future appointments (allowing a 30min grace period into the past like before)
    const futureApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        .filter(app => {
            const appDate = app.timestamp.toDate();
            // isDateAfterNowBy30Min logic
            const momentApp = moment(appDate);
            const momentNow = moment().utcOffset("-03:00"); // consistent timezone
            const diff = momentNow.diff(momentApp, "minutes");
            return diff <= 30; 
        })
        .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
        
    return futureApps.length > 0 ? futureApps[0] : null;
};
