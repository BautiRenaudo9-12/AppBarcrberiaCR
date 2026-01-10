import { doc, getDoc, getDocs, collection, query, orderBy } from "firebase/firestore";
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
      nro: data.nro
    }));
    return {
      name: data.name,
      email: data.email,
      nro: data.nro
    };
  }
  return null;
};

export const getClientes = async () => {
  const docsSnap = await getDocs(collection(db, "clientes"));
  return docsSnap;
};

export const getHistory = async () => {
  if (!auth.currentUser?.email) return { docs: [] };
  const q = query(collection(db, "clientes", auth.currentUser.email, "history"), orderBy("time", "desc"));
  const docsSnap = await getDocs(q);
  return docsSnap;
};
