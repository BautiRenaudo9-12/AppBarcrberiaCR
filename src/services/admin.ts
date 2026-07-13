import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createSearchKeywords } from "@/lib/keywords";

// Backfill del índice de búsqueda: recomputa `keywords` (nombre + email + teléfono) de todos
// los clientes. Se ejecuta una vez tras cambiar la generación de keywords. Chunkeado en lotes
// de 500 porque es el máximo de operaciones por writeBatch de Firestore.
export const migrateClientsKeywords = async () => {
  const clientsSnap = await getDocs(collection(db, "clientes"));
  const docs = clientsSnap.docs;
  const CHUNK = 500;
  let count = 0;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + CHUNK)) {
      const data = d.data();
      const keywords = createSearchKeywords(data.name || "", data.email || "", data.nro || "");
      batch.update(doc(db, "clientes", d.id), { keywords });
      count++;
    }
    await batch.commit();
  }

  return count;
};
