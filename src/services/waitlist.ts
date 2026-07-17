import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import moment from "moment";

// Lista de espera por día: el cliente se anota a un día lleno para que se le avise (push)
// si se libera un turno ese día. Es solo-aviso, no una reserva (ver docs/adr/0001).
export interface WaitlistEntry {
  id: string;
  clientEmail: string;
  clientName: string;
  date: string; // "YYYY-MM-DD"
  createdAt: Timestamp;
  lastNotifiedAt?: Timestamp;
}

// Tope de días simultáneos en los que un cliente puede estar en lista de espera.
export const MAX_WAITLIST_DAYS = 3;

// ID determinista: una entrada por cliente y día.
const entryId = (email: string, date: string) => `${email}_${date}`;

// Entradas del cliente de hoy en adelante (las pasadas se ignoran/expiran).
export const getMyWaitlist = async (email: string): Promise<WaitlistEntry[]> => {
  const today = moment().format("YYYY-MM-DD");
  const q = query(collection(db, "waitlist"), where("clientEmail", "==", email));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as WaitlistEntry))
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Anota al cliente en la lista de espera de un día. Respeta el tope y evita duplicados.
export const joinWaitlist = async (email: string, name: string, date: string) => {
  const current = await getMyWaitlist(email);
  if (current.some((e) => e.date === date)) return; // ya anotado a ese día
  if (current.length >= MAX_WAITLIST_DAYS) {
    throw new Error(`Solo podés anotarte a ${MAX_WAITLIST_DAYS} días a la vez.`);
  }
  await setDoc(doc(db, "waitlist", entryId(email, date)), {
    clientEmail: email,
    clientName: name,
    date,
    createdAt: Timestamp.now(),
  });
};

export const leaveWaitlist = async (email: string, date: string) => {
  await deleteDoc(doc(db, "waitlist", entryId(email, date)));
};

// Borra todas las entradas del cliente. Se llama al reservar (por aviso o normal): quien ya
// tomó un turno no debe seguir recibiendo avisos.
export const clearMyWaitlist = async (email: string) => {
  const q = query(collection(db, "waitlist"), where("clientEmail", "==", email));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
};

// Dispara el fan-out de avisos a la lista de espera de un día (best-effort). La hace el
// browser cada vez que se libera un turno de ese día —una cancelación (cliente o admin) o
// un sobreturno del admin— llamando a la Netlify function con el ID token de Firebase
// (ver docs/adr/0002). Falla en silencio para no romper el flujo que la disparó.
export const notifyWaitlist = async (date: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !date) return;
    const token = await user.getIdToken();
    await fetch("/api/notify-waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ date }),
    });
  } catch (e) {
    console.error("notify-waitlist falló (best-effort):", e);
  }
};
