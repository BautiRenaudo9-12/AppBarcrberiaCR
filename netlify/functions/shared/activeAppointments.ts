import type { Firestore } from "firebase-admin/firestore";

// Quién tiene un turno activo. Lo comparten las functions que no deben molestar a esos
// clientes: el aviso de lista de espera (no pueden reservar otro turno) y el recordatorio
// de re-reserva (ya volvieron).

// Gracia hacia el pasado para considerar "activo" un turno (consistente con el cliente).
const ACTIVE_GRACE_MINUTES = 30;

// Una sola query para todos los emails que haga falta chequear, en vez de una por cliente.
// Filtramos por rango de `timestamp` —que usa el índice de campo único automático— y
// descartamos por `status` en memoria: combinar ambos en la query exigiría un índice
// compuesto que firestore.indexes.json no declara. Al acotar por `timestamp` la lectura
// solo trae turnos de ahora en adelante, así que no crece con el histórico.
export async function emailsWithActiveAppointment(db: Firestore): Promise<Set<string>> {
  const floor = new Date(Date.now() - ACTIVE_GRACE_MINUTES * 60 * 1000);
  const snap = await db.collection("appointments").where("timestamp", ">=", floor).get();

  const emails = new Set<string>();
  for (const d of snap.docs) {
    const data = d.data();
    if (data.status === "confirmed" && data.clientEmail) emails.add(data.clientEmail);
  }
  return emails;
}
