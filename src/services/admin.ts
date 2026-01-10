import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";

interface DayConfig {
  id: string; // "lunes"
  desde: string; // "09:00"
  hasta: string; // "18:00"
  intervalo: number; // 30
  activo: boolean;
}

export const regenerateSlots = async (dayConfig: DayConfig) => {
  if (!dayConfig.activo) {
    // If day is inactive, we might want to disable all slots or delete empty ones.
    // For safety, we will currently just delete EMPTY slots.
    return await cleanEmptySlots(dayConfig.id);
  }

  const batch = writeBatch(db);
  const slotsRef = collection(db, "turnos", dayConfig.id, "turnos");
  
  // 1. Get existing slots
  const snapshot = await getDocs(slotsRef);
  const existingSlots = snapshot.docs.map(doc => ({
    id: doc.id,
    ref: doc.ref,
    data: doc.data()
  }));

  // 2. Generate desired time slots
  const desiredSlots = generateTimeSlots(dayConfig.desde, dayConfig.hasta, dayConfig.intervalo);
  
  let createdCount = 0;
  let deletedCount = 0;
  let skippedCount = 0;

  // 3. Create missing slots
  desiredSlots.forEach(timeLabel => {
    // Check if slot exists (by ID, assuming ID is the time like "09:00")
    // Normalizing time format to ensure match (e.g. "09:00")
    const exists = existingSlots.find(s => s.id === timeLabel);
    
    if (!exists) {
      // Create new slot
      const newDocRef = doc(slotsRef, timeLabel);
      batch.set(newDocRef, {
        time: timeLabel,
        reserve: {
          time: Timestamp.fromDate(new Date("2000-01-01T00:00:00")), // Placeholder past date
          email: "",
          name: ""
        }
      });
      createdCount++;
    }
  });

  // 4. Remove extra slots (ONLY if not reserved)
  existingSlots.forEach(slot => {
    // If this slot is NOT in our desired list
    if (!desiredSlots.includes(slot.id)) {
      // Check if it has an active reservation
      // We consider active if reserve.time is in the future relative to NOW (or a safety margin)
      // BUT, in this simple schema, 'reserve.time' is the timestamp of the APPOINTMENT.
      // Wait, let's check the schema in reservations.ts
      // In putReserve, 'reserve.time' is set to the specific appointment time.
      // If the slot is "free", it usually has a past date or null/empty fields.
      
      const reserveTime = slot.data.reserve?.time instanceof Timestamp 
        ? slot.data.reserve.time.toDate() 
        : null;
        
      const isReserved = reserveTime && reserveTime > new Date();
      
      if (isReserved) {
        console.warn(`Skipping deletion of reserved slot: ${dayConfig.id} ${slot.id}`);
        skippedCount++;
      } else {
        batch.delete(slot.ref);
        deletedCount++;
      }
    }
  });

  await batch.commit();
  
  return { created: createdCount, deleted: deletedCount, skipped: skippedCount };
};

const cleanEmptySlots = async (dayId: string) => {
  const batch = writeBatch(db);
  const slotsRef = collection(db, "turnos", dayId, "turnos");
  const snapshot = await getDocs(slotsRef);
  
  let deletedCount = 0;
  let skippedCount = 0;

  snapshot.docs.forEach(docSnap => {
    const data = docSnap.data();
    const reserveTime = data.reserve?.time instanceof Timestamp 
        ? data.reserve.time.toDate() 
        : null;
    const isReserved = reserveTime && reserveTime > new Date();

    if (!isReserved) {
      batch.delete(docSnap.ref);
      deletedCount++;
    } else {
      skippedCount++;
    }
  });

  await batch.commit();
  return { created: 0, deleted: deletedCount, skipped: skippedCount };
};

const generateTimeSlots = (start: string, end: string, interval: number): string[] => {
  const slots: string[] = [];
  let current = moment(start, "HH:mm");
  const endTime = moment(end, "HH:mm");

  while (current.isBefore(endTime)) {
    slots.push(current.format("HH:mm"));
    current.add(interval, "minutes");
  }
  
  return slots;
};
