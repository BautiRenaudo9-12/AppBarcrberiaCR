import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Nombres de día indexados por moment().format("d") (0 = Domingo). Se mantiene sin tildes
// para que coincida con los IDs de los docs de `turnos/{dia}`.
export const arrayDias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

// Config de todos los días (panel de Configuración), ordenada por `index`.
export const getDays = async () => {
  const q = query(collection(db, "turnos"), orderBy("index"));
  return await getDocs(q);
};

// Config de un día puntual (horario desde/hasta, intervalo, activo). La usa useTurnos
// para generar los slots virtuales.
export const getDayConfig = async (dayName: string) => {
  const docSnap = await getDoc(doc(db, "turnos", dayName.toLowerCase()));
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

// NOTA: el flujo de reserva real vive en `src/services/appointments.ts` (colección
// `appointments` con transacción + ID determinista). Las funciones legacy que escribían
// en `turnos/{dia}/turnos/{id}` y `clientes/{email}.reserve` (putReserve, removeReserve,
// getReserve, getTurnos, getReserves) se eliminaron por estar sin uso.
