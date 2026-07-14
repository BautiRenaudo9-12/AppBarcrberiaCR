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
  getCountFromServer,
  setDoc
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { createSearchKeywords, searchTokens } from "@/lib/keywords";

export const getUserInfo = async () => {
  const stored = localStorage.getItem("USER_INFO");
  const userInfo = stored ? JSON.parse(stored) : null;
  if (userInfo && userInfo.name) {
    return {
      name: userInfo.name,
      email: userInfo.email,
      nro: userInfo.nro,
      photoURL: userInfo.photoURL,
      fcmToken: userInfo.fcmToken,
    };
  }

  if (!auth.currentUser?.email) return null;

  const docSnap = await getDoc(doc(db, "clientes", auth.currentUser.email));
  if (docSnap.exists()) {
    const data = docSnap.data();
    const info = {
      name: data.name,
      email: data.email,
      nro: data.nro,
      photoURL: data.photoURL,
      fcmToken: data.fcmToken
    };
    localStorage.setItem("USER_INFO", JSON.stringify(info));
    return info;
  }
  return null;
};

// Asegura que exista el doc `clientes/{email}` tras un login (esp. con Google,
// que no provee teléfono). Crea el perfil si falta y hace backfill de `photoURL`
// / `keywords` si ya existe. Devuelve el perfil y cachea USER_INFO.
export const ensureClientProfile = async (user: User) => {
  const email = user.email;
  if (!email) return null;

  const ref = doc(db, "clientes", email);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const name = user.displayName || "";
    const profile = {
      email,
      name,
      nro: "",
      photoURL: user.photoURL || "",
      keywords: createSearchKeywords(name, email, ""),
    };
    await setDoc(ref, profile);
    const info = { name, email, nro: "", photoURL: profile.photoURL, fcmToken: undefined };
    localStorage.setItem("USER_INFO", JSON.stringify(info));
    return info;
  }

  const data = snap.data();

  // Backfill no destructivo de campos derivados del proveedor.
  const patch: DocumentData = {};
  if (!data.photoURL && user.photoURL) patch.photoURL = user.photoURL;
  if (!data.keywords) patch.keywords = createSearchKeywords(data.name || "", email, data.nro || "");
  if (Object.keys(patch).length > 0) {
    await setDoc(ref, patch, { merge: true });
  }

  const info = {
    name: data.name,
    email,
    nro: data.nro,
    photoURL: data.photoURL || user.photoURL || "",
    fcmToken: data.fcmToken,
  };
  localStorage.setItem("USER_INFO", JSON.stringify(info));
  return info;
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

// B\u00fasqueda unificada (nombre + email + tel\u00e9fono) sobre el \u00edndice `keywords`. Normaliza el
// t\u00e9rmino (trim, min\u00fasculas, sin tildes) en `searchTokens`, hace UN `array-contains-any` (OR)
// y filtra el AND multi-palabra en el cliente: cada token del t\u00e9rmino debe estar en el doc.
export const searchClientes = async (term: string) => {
  const tokens = searchTokens(term);
  if (tokens.length === 0) return { docs: [] };

  const q = query(
    collection(db, "clientes"),
    where("keywords", "array-contains-any", tokens),
    limit(30)
  );

  const snap = await getDocs(q);

  const docs = snap.docs.filter((doc) => {
    const kws: string[] = doc.data().keywords || [];
    const kwSet = new Set(kws);
    return tokens.every((t) => kwSet.has(t));
  });

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

// Historial de un cliente arbitrario (uso admin). Solo admin puede leer la subcolección
// history de otro cliente según firestore.rules.
export const getClientHistory = async (email: string) => {
  if (!email) return { docs: [] };
  const q = query(collection(db, "clientes", email, "history"), orderBy("time", "desc"));
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
