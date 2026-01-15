import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp, 
  orderBy, 
  limit,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Announcement {
  id?: string;
  texto: string;
  icono: string;
  fechaInicio: Timestamp; // Store as Firestore Timestamp
  fechaFin: Timestamp;   // Store as Firestore Timestamp
  creadoEn: Timestamp;
}

export const createAnnouncement = async (
  texto: string, 
  icono: string, 
  inicio: Date, 
  fin: Date
) => {
  try {
    // Optional: Clean up old announcements or ensure only one is active if desired.
    // For now, we just add a new one.
    
    await addDoc(collection(db, "anuncios"), {
      texto,
      icono,
      fechaInicio: Timestamp.fromDate(inicio),
      fechaFin: Timestamp.fromDate(fin),
      creadoEn: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error creating announcement:", error);
    return false;
  }
};

export const getActiveAnnouncement = async (): Promise<Announcement | null> => {
  try {
    const now = new Date();
    const tsNow = Timestamp.fromDate(now);

    // Firestore queries with multiple inequality filters on different fields are tricky.
    // Strategy: Get recent announcements and filter in client (simpler for small dataset).
    // Or: Query for announcements where fechaFin >= now, then filter fechaInicio <= now.
    
    const q = query(
      collection(db, "anuncios"),
      where("fechaFin", ">=", tsNow),
      orderBy("fechaFin", "asc") // Order by closest end date or created date
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;

    // Client-side filter for start date and pick the most relevant one (e.g. most recently created)
    const active = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Announcement))
      .filter(a => a.fechaInicio.toDate() <= now)
      .sort((a, b) => b.creadoEn.seconds - a.creadoEn.seconds); // Newest first

    return active.length > 0 ? active[0] : null;
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return null;
  }
};

export const deleteAnnouncement = async (id: string) => {
    try {
        await deleteDoc(doc(db, "anuncios", id));
        return true;
    } catch (error) {
        console.error("Error deleting announcement", error);
        return false;
    }
}

export const getAllAnnouncements = async () => {
    try {
        const q = query(collection(db, "anuncios"), orderBy("creadoEn", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
    } catch (error) {
        return [];
    }
}
