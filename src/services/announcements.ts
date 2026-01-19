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
  doc,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Announcement {
  id?: string;
  texto: string;
  icono: string;
  fechaInicio: Timestamp; 
  fechaFin: Timestamp;   
  creadoEn: Timestamp;
  doc?: QueryDocumentSnapshot<DocumentData>; // Helper for pagination
}

export const createAnnouncement = async (text: string, icon: string, startDate: Date, endDate: Date) => {
    try {
        await addDoc(collection(db, "anuncios"), {
            texto: text,
            icono: icon,
            fechaInicio: Timestamp.fromDate(startDate),
            fechaFin: Timestamp.fromDate(endDate),
            creadoEn: Timestamp.now()
        });
    } catch (error) {
        console.error("Error creating announcement", error);
        throw error;
    }
};

export const deleteAnnouncement = async (id: string) => {
    try {
        await deleteDoc(doc(db, "anuncios", id));
    } catch (error) {
        console.error("Error deleting announcement", error);
        throw error;
    }
};

export const getActiveAnnouncement = async (): Promise<Announcement | null> => {
    try {
        // Query announcements that haven't ended yet
        // Note: This requires a single-field index on fechaFin (usually auto-created)
        const q = query(
            collection(db, "anuncios"),
            where("fechaFin", ">=", Timestamp.now()),
            orderBy("fechaFin", "asc") 
        );

        const snapshot = await getDocs(q);
        const now = new Date();

        // Filter client-side for those that have already started
        const active = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Announcement))
            .filter(a => a.fechaInicio.toDate() <= now);

        // Return the first one found
        return active.length > 0 ? active[0] : null;
    } catch (error) {
        console.error("Error getting active announcement", error);
        return null;
    }
};

export const getAllAnnouncements = async (lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
        let q = query(
            collection(db, "anuncios"), 
            orderBy("creadoEn", "desc"),
            limit(10)
        );

        if (lastDoc) {
            q = query(
                collection(db, "anuncios"), 
                orderBy("creadoEn", "desc"),
                startAfter(lastDoc),
                limit(10)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ 
            id: d.id, 
            ...d.data(),
            doc: d // Keep reference for next cursor
        } as Announcement));
    } catch (error) {
        console.error("Error getting announcements", error);
        return [];
    }
}