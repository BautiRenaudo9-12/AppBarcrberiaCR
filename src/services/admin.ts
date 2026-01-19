import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createSearchKeywords } from "@/lib/keywords";

export const migrateClientsKeywords = async () => {
  const clientsSnap = await getDocs(collection(db, "clientes"));
  const batch = writeBatch(db);
  let count = 0;

  clientsSnap.docs.forEach((d) => {
    const data = d.data();
    // Only name as per request
    const keywords = createSearchKeywords(data.name || "", data.email || "", data.nro || "");
    
    // Actually, createSearchKeywords logic was updated to ONLY use name in lib/keywords.ts
    // But verify the call signature. It takes (name, email, phone).
    // The implementation inside lib/keywords.ts ignores email/phone as per user request.
    
    batch.update(doc(db, "clientes", d.id), { keywords });
    count++;
  });

  await batch.commit();
  return count;
};
