import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  Timestamp,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";

// --- 2. Data Model ---
export interface BlockedSlot {
  id?: string;
  type: 'single' | 'recurring';
  
  // Single Block
  date?: number; // Timestamp of the specific day (00:00:00)
  
  // Recurring Block
  dayOfWeek?: number; // 0=Monday ... 6=Sunday
  startDate?: number; // Start validity timestamp
  endDate?: number;   // End validity timestamp (optional/null = forever)
  
  startTime: string;  // "HH:mm"
  endTime?: string;   // Optional
  createdAt: number;
}

// --- 3. Creation Logic Helpers ---

// Helper to get the custom day index (Mon=0, Sun=6)
export const getCustomDayIndex = (date: Date): number => {
  const jsDay = date.getDay(); // Sun=0, Mon=1...
  return jsDay === 0 ? 6 : jsDay - 1;
};

// Helper to create a timestamp for midnight of a given date
export const getDayTimestamp = (dateStr: string): number => {
  return moment(dateStr, "YYYY-MM-DD").startOf('day').valueOf();
};

export const addBlockedRule = async (
  mode: 'day' | 'weeks' | 'forever',
  dateStr: string, // YYYY-MM-DD
  timeStr: string,
  weeksDuration: number = 0
) => {
  const dateObj = moment(dateStr, "YYYY-MM-DD").toDate();
  const dayTimestamp = getDayTimestamp(dateStr);
  
  const baseSlot: Omit<BlockedSlot, 'id'> = {
    type: 'single', // Default
    startTime: timeStr,
    createdAt: Date.now()
  };

  if (mode === 'day') {
    // 1. "Solo por hoy"
    baseSlot.type = 'single';
    baseSlot.date = dayTimestamp;
  } else {
    // Recurring logic
    baseSlot.type = 'recurring';
    baseSlot.dayOfWeek = getCustomDayIndex(dateObj);
    baseSlot.startDate = dayTimestamp;

    if (mode === 'weeks' && weeksDuration > 0) {
      // 2. "Por N semanas"
      // End date = Current + N weeks
      baseSlot.endDate = moment(dateStr).add(weeksDuration, 'weeks').endOf('day').valueOf();
    } 
    // 3. "Para siempre" -> endDate is undefined
  }

  await addDoc(collection(db, "blocked_slots"), baseSlot);
};

// --- 5. Unblocking Logic ---
export const deleteBlockedRule = async (id: string) => {
  await deleteDoc(doc(db, "blocked_slots", id));
};

// --- 6. Exceptions (Sobreturnos) Logic ---
// Allows "Freeing" a specific slot that is covered by a recurring block
export interface SlotException {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export const addBlockException = async (dateStr: string, timeStr: string) => {
  // Check if already exists to avoid duplicates
  const q = query(
    collection(db, "slot_exceptions"),
    where("date", "==", dateStr),
    where("time", "==", timeStr)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) return; // Already exempted

  await addDoc(collection(db, "slot_exceptions"), {
    date: dateStr,
    time: timeStr,
    createdAt: Date.now()
  });
};

export const removeBlockException = async (dateStr: string, timeStr: string) => {
   const q = query(
    collection(db, "slot_exceptions"),
    where("date", "==", dateStr),
    where("time", "==", timeStr)
  );
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "slot_exceptions", d.id)));
  await Promise.all(deletePromises);
};

export const subscribeToExceptions = (callback: (exceptions: SlotException[]) => void) => {
  // Performance: Only fetch exceptions from today onwards
  const today = moment().format("YYYY-MM-DD");
  const q = query(collection(db, "slot_exceptions"), where("date", ">=", today));
  return onSnapshot(q, (snapshot) => {
    const exceptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SlotException));
    callback(exceptions);
  });
};

export const isException = (dateStr: string, timeStr: string, exceptions: SlotException[]) => {
  return exceptions.some(ex => ex.date === dateStr && ex.time === timeStr);
};

// --- Subscriptions ---
export const subscribeToBlockedSlots = (callback: (slots: BlockedSlot[]) => void) => {
  const q = query(collection(db, "blocked_slots"));
  return onSnapshot(q, (snapshot) => {
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlockedSlot));
    callback(slots);
  });
};

// --- 4. Detection / Matching Logic ---
export const getBlockedRule = (
  dateStr: string, // YYYY-MM-DD
  timeStr: string,
  allRules: BlockedSlot[]
): BlockedSlot | undefined => {
  const checkDateMoment = moment(dateStr, "YYYY-MM-DD");
  const checkTimestamp = checkDateMoment.startOf('day').valueOf();
  const checkDayIndex = getCustomDayIndex(checkDateMoment.toDate());

  return allRules.find(rule => {
    // 1. Time Filter
    if (rule.startTime !== timeStr) return false;

    if (rule.type === 'single') {
      // 2. Case Single: Exact date match
      return rule.date === checkTimestamp;
    } else if (rule.type === 'recurring') {
      // 3. Case Recurring
      
      // Check Day of Week
      if (rule.dayOfWeek !== checkDayIndex) return false;

      // Check Start Date Validity
      if (rule.startDate && checkTimestamp < rule.startDate) return false;

      // Check End Date Validity (if exists)
      if (rule.endDate && checkTimestamp > rule.endDate) return false;

      return true;
    }
    return false;
  });
};
