import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";
import { getBlockedRule, BlockedSlot, getCustomDayIndex, getDayTimestamp } from "@/services/blocks";

export interface Appointment {
  id?: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  timestamp: Timestamp;
  clientEmail: string;
  clientName: string;
  clientPhone?: string;
  status: "confirmed" | "cancelled" | "completed" | "blocked";
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
  // 1. Check existing appointments (DB)
  const qApp = query(
    collection(db, "appointments"),
    where("date", "==", dateStr),
    where("time", "==", timeStr),
    where("status", "in", ["confirmed", "blocked"])
  );
  const appSnapshotPromise = getDocs(qApp);

  // 2. Check Blocks (DB) - Optimized Queries
  const targetTimestamp = getDayTimestamp(dateStr);
  const targetDayIndex = getCustomDayIndex(moment(dateStr, "YYYY-MM-DD").toDate());

  // Query A: Single Blocks for this specific date and time
  const qSingle = query(
    collection(db, "blocked_slots"),
    where("type", "==", "single"),
    where("date", "==", targetTimestamp),
    where("startTime", "==", timeStr)
  );

  // Query B: Recurring Blocks for this day of week and time
  const qRecurring = query(
    collection(db, "blocked_slots"),
    where("type", "==", "recurring"),
    where("dayOfWeek", "==", targetDayIndex),
    where("startTime", "==", timeStr)
  );

  // 3. Check Exceptions (DB) - Optimized
  const qExceptions = query(
    collection(db, "slot_exceptions"), 
    where("date", "==", dateStr), 
    where("time", "==", timeStr)
  );

  // Execute in parallel
  const [appSnap, singleSnap, recurringSnap, exceptionSnap] = await Promise.all([
    appSnapshotPromise,
    getDocs(qSingle),
    getDocs(qRecurring),
    getDocs(qExceptions)
  ]);

  // A. If real appointment exists -> NOT Available
  if (!appSnap.empty) return false;

  // B. If Exception exists -> Available (overrides blocks)
  if (!exceptionSnap.empty) return true;

  // C. Check Single Blocks
  if (!singleSnap.empty) return false; // Found a specific block for this slot

  // D. Check Recurring Blocks (validate start/end dates)
  const recurringRules = recurringSnap.docs.map(d => ({id: d.id, ...d.data()})) as BlockedSlot[];
  const activeRecurring = recurringRules.find(rule => {
      // We already matched dayOfWeek and startTime in the query
      // Just check date ranges
      if (rule.startDate && targetTimestamp < rule.startDate) return false;
      if (rule.endDate && targetTimestamp > rule.endDate) return false;
      return true;
  });

  if (activeRecurring) return false;

  return true;
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

export const blockSlot = async (dateStr: string, timeStr: string) => {
  const isAvailable = await isSlotAvailable(dateStr, timeStr);
  if (!isAvailable) {
    throw new Error("El turno no se puede bloquear porque ya está ocupado.");
  }

  const dateTimeStr = `${dateStr}T${timeStr}:00`;
  const timestamp = Timestamp.fromDate(new Date(dateTimeStr));

  const newAppointment: Omit<Appointment, "id"> = {
    date: dateStr,
    time: timeStr,
    timestamp,
    clientEmail: "admin@blocked",
    clientName: "BLOQUEADO",
    status: "blocked",
    createdAd: Timestamp.now()
  };

  await addDoc(collection(db, "appointments"), newAppointment);
};

export const unblockSlot = async (dateStr: string, timeStr: string) => {
  const q = query(
    collection(db, "appointments"),
    where("date", "==", dateStr),
    where("time", "==", timeStr),
    where("status", "==", "blocked")
  );
  const snapshot = await getDocs(q);
  
  const deletePromises = snapshot.docs.map(docSnapshot => 
    deleteDoc(doc(db, "appointments", docSnapshot.id))
  );
  
  await Promise.all(deletePromises);
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

export const subscribeToUserActiveAppointment = (userEmail: string, callback: (appointment: Appointment | null) => void) => {
    const q = query(
        collection(db, "appointments"),
        where("clientEmail", "==", userEmail),
        where("status", "==", "confirmed")
    );

    // Returns the unsubscribe function
    return onSnapshot(q, (snapshot) => {
        const futureApps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
            .filter(app => {
                const appDate = app.timestamp.toDate();
                const momentApp = moment(appDate);
                const momentNow = moment().utcOffset("-03:00");
                const diff = momentNow.diff(momentApp, "minutes");
                return diff <= 30;
            })
            .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);
        
        callback(futureApps.length > 0 ? futureApps[0] : null);
    }, (error) => {
        console.error("Error subscribing to appointments:", error);
        callback(null);
    });
};
