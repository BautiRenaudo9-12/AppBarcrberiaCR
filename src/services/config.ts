import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookingConfig, DEFAULT_MAX_DAYS } from "@/types/config";

const bookingRef = () => doc(db, "config", "booking");

// Lee la config global de reservas. Si el doc no existe o el valor es inválido,
// cae al default histórico (6 días) para no romper el flujo de reserva.
export const getBookingConfig = async (): Promise<BookingConfig> => {
  try {
    const snap = await getDoc(bookingRef());
    const raw = snap.exists() ? snap.data()?.maxDays : undefined;
    const maxDays = Number(raw);
    if (!Number.isFinite(maxDays) || maxDays < 0) {
      return { maxDays: DEFAULT_MAX_DAYS };
    }
    return { maxDays: Math.floor(maxDays) };
  } catch (e) {
    console.error("Error leyendo config/booking:", e);
    return { maxDays: DEFAULT_MAX_DAYS };
  }
};

// Guarda el rango máximo de días (solo admin, ver firestore.rules). `merge` para no
// pisar futuros campos de config global.
export const updateBookingConfig = async (maxDays: number) => {
  await setDoc(bookingRef(), { maxDays: Math.floor(maxDays) }, { merge: true });
};
