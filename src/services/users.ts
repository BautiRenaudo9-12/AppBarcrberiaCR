import { 
  doc, 
  updateDoc,
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  where,
  QueryDocumentSnapshot, 
  DocumentData,
  getCountFromServer
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export const getUserInfo = async () => {
  const stored = localStorage.getItem("USER_INFO");
  const userInfo = stored ? JSON.parse(stored) : null;
  if (userInfo && userInfo.name) {
    return {
      name: userInfo.name,
      email: userInfo.email,
      nro: userInfo.nro
    };
  }

  if (!auth.currentUser?.email) return null;

  const docSnap = await getDoc(doc(db, "clientes", auth.currentUser.email));
  if (docSnap.exists()) {
    const data = docSnap.data();
    localStorage.setItem("USER_INFO", JSON.stringify({
      name: data.name,
      email: data.email,
      nro: data.nro,
      fcmToken: data.fcmToken
    }));
    return {
      name: data.name,
      email: data.email,
      nro: data.nro,
      fcmToken: data.fcmToken
    };
  }
  return null;
};

// Legacy
export const getClientes = async () => {
  const docsSnap = await getDocs(collection(db, "clientes"));
  return docsSnap;
};

export const getClientesPaginated = async (lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
  let q = query(
    collection(db, "clientes"),
    orderBy("name"), 
    limit(10)
  );

  if (lastDoc) {
    q = query(
      collection(db, "clientes"),
      orderBy("name"),
      startAfter(lastDoc),
      limit(10)
    );
  }

  const docsSnap = await getDocs(q);
  return docsSnap;
};

export const getClientsCount = async () => {
    try {
        const coll = collection(db, "clientes");
        const snapshot = await getCountFromServer(coll);
        return snapshot.data().count;
    } catch (e) {
        console.error("Error getting count", e);
        return 0;
    }
};

export const searchClientes = async (term: string) => {
  if (!term) return { docs: [] };

  const termLower = term.toLowerCase();
  const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase(); // "juan" -> "Juan"

  // Limit per query to avoid exploding reads
  const QUERY_LIMIT = 10;

  // 1. Search by Email (prefix, usually lowercase)
  const qEmail = query(
    collection(db, "clientes"),
    where("email", ">=", termLower),
    where("email", "<=", termLower + "\uf8ff"),
    limit(QUERY_LIMIT)
  );

  // 2. Search by Phone (prefix)
  const qPhone = query(
    collection(db, "clientes"),
    where("nro", ">=", term),
    where("nro", "<=", term + "\uf8ff"),
    limit(QUERY_LIMIT)
  );

  // 3. Search by Name (Try exact casing entered + Capitalized version)
  // This is a workaround for Firestore's lack of case-insensitive search
  const qNameOriginal = query(
    collection(db, "clientes"),
    where("name", ">=", term),
    where("name", "<=", term + "\uf8ff"),
    limit(QUERY_LIMIT)
  );

  // 4. Search by Keywords (Suffix matches like "tista" -> "Bautista")
  const qKeywords = query(
    collection(db, "clientes"),
    where("keywords", "array-contains", termLower),
    limit(QUERY_LIMIT)
  );

  // Only run capitalized query if it's different from original (e.g. user typed "juan", we try "Juan")
  const queries = [getDocs(qEmail), getDocs(qPhone), getDocs(qNameOriginal), getDocs(qKeywords)];
  
  if (term !== termCapitalized) {
      const qNameCap = query(
        collection(db, "clientes"),
        where("name", ">=", termCapitalized),
        where("name", "<=", termCapitalized + "\uf8ff"),
        limit(QUERY_LIMIT)
      );
      queries.push(getDocs(qNameCap));
  }

  // Execute in parallel
  const snapshots = await Promise.all(queries);

  // Merge and Deduplicate
  const uniqueDocs = new Map();
  snapshots.forEach(snap => {
      snap.docs.forEach(doc => {
          uniqueDocs.set(doc.id, doc);
      });
  });

  const docs = Array.from(uniqueDocs.values());
  
  // Sort by name client-side since we have a small mixed batch
  docs.sort((a, b) => {
      const nameA = a.data().name || "";
      const nameB = b.data().name || "";
      return nameA.localeCompare(nameB);
  });

  return { docs };
}

export const updateUserProfile = async (email: string, data: Partial<DocumentData>) => {
    if (!email) throw new Error("Email required");
    await updateDoc(doc(db, "clientes", email), data);
};

export const getHistory = async () => {
  if (!auth.currentUser?.email) return { docs: [] };
  const q = query(collection(db, "clientes", auth.currentUser.email, "history"), orderBy("time", "desc"));
  const docsSnap = await getDocs(q);
  return docsSnap;
};

export const getHistoryCount = async () => {
    if (!auth.currentUser?.email) return 0;
    try {
        const coll = collection(db, "clientes", auth.currentUser.email, "history");
        const snapshot = await getCountFromServer(coll);
        return snapshot.data().count;
    } catch (e) {
        console.error("Error getting history count", e);
        return 0;
    }
};
