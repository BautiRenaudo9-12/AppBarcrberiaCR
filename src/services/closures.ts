import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import moment from "moment";

// Cierre por rango de fechas (ej. vacaciones): bloquea TODOS los horarios de los días
// comprendidos entre `startDate` y `endDate` (inclusive). A diferencia de `blocked_slots`
// —que matchea por horario puntual— un cierre cubre el día entero, por eso vive en su
// propia colección. El cartel visible al cliente ("Cerrado por vacaciones") se maneja con
// los anuncios, no acá.
export interface Closure {
  id?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  createdAt: number;
}

// Crea un cierre. Normaliza el orden por si vinieran invertidas las fechas.
export const addClosure = async (startDate: string, endDate: string) => {
  const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  await addDoc(collection(db, "closures"), {
    startDate: start,
    endDate: end,
    createdAt: Date.now(),
  });
};

export const deleteClosure = async (id: string) => {
  await deleteDoc(doc(db, "closures", id));
};

// Suscripción a los cierres vigentes (los que todavía no terminaron: endDate >= hoy).
// Ante error (ej. reglas de `closures` aún no deployadas) degradamos a "sin cierres" para
// no colgar los flujos que esperan esta suscripción (useTurnos gatea el loading en ella).
export const subscribeToClosures = (callback: (closures: Closure[]) => void) => {
  const today = moment().format("YYYY-MM-DD");
  const q = query(collection(db, "closures"), where("endDate", ">=", today));
  return onSnapshot(
    q,
    (snapshot) => {
      const closures = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Closure))
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      callback(closures);
    },
    (error) => {
      console.error("No se pudieron leer los cierres (¿reglas sin deployar?):", error);
      callback([]);
    }
  );
};

// ¿La fecha cae dentro de algún cierre? Comparación de strings ISO (YYYY-MM-DD), válida
// para ordenar fechas lexicográficamente.
export const isDateInClosure = (dateStr: string, closures: Closure[]) =>
  closures.some((c) => dateStr >= c.startDate && dateStr <= c.endDate);

// Chequeo puntual contra Firestore (defensa en profundidad al reservar). Firestore no
// permite rango sobre dos campos, así que filtramos `startDate` en el cliente.
export const isDateClosed = async (dateStr: string): Promise<boolean> => {
  const q = query(collection(db, "closures"), where("endDate", ">=", dateStr));
  const snap = await getDocs(q);
  return snap.docs.some((d) => (d.data().startDate as string) <= dateStr);
};
