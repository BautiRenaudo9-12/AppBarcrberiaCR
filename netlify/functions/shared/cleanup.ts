import type { Firestore } from "firebase-admin/firestore";

// Barrido de datos que ya vencieron. Ni la lista de espera ni los sobreturnos se borran solos:
// las queries de la app los filtran por fecha, así que nadie los ve, pero los docs quedan para
// siempre acumulando lecturas y peso. Esto los limpia desde el cron diario.
//
// Solo toca fechas ESTRICTAMENTE anteriores a hoy: las de hoy siguen vivas hasta que termine
// el día (un turno que se libera a la tarde todavía tiene que avisarle a quien espera).

// Tope por corrida: mantiene acotado el costo del cron. Lo que sobre se limpia mañana; no hay
// apuro y la cola no se tapa, porque los vencidos nunca vuelven a ser candidatos a nada.
const SWEEP_LIMIT = 300;

// Colecciones con un campo `date` string "YYYY-MM-DD" que expiran al pasar el día.
const EXPIRING_COLLECTIONS = ["waitlist", "slot_exceptions"] as const;

/**
 * Hoy en horario de Argentina, como "YYYY-MM-DD". El cron corre en UTC, así que sin fijar la
 * zona el barrido se adelantaría tres horas y podría borrar entradas del día en curso.
 * `en-CA` es el locale que formatea nativamente en ISO.
 */
export function todayInArgentina(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export async function sweepExpiredDocs(
  db: Firestore,
  today: string = todayInArgentina()
): Promise<Record<string, number>> {
  const deleted: Record<string, number> = {};

  for (const name of EXPIRING_COLLECTIONS) {
    const snap = await db
      .collection(name)
      .where("date", "<", today)
      .limit(SWEEP_LIMIT)
      .get();

    if (snap.empty) {
      deleted[name] = 0;
      continue;
    }

    // Un batch por colección: el tope de Firestore es 500 operaciones y SWEEP_LIMIT es 300.
    const batch = db.batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    await batch.commit();

    deleted[name] = snap.size;
  }

  return deleted;
}
