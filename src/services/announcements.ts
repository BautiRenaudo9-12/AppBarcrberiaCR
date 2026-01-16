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

// ... (createAnnouncement, getActiveAnnouncement, deleteAnnouncement remain the same)

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
