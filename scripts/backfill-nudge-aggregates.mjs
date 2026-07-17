// Backfill de los agregados de re-reserva (visitCount / firstVisit / lastVisit / nextNudgeAt)
// en clientes/{email}, recalculándolos desde la subcolección `history`, que es la fuente de
// verdad. Corrida única.
//
// Por qué hace falta: los agregados se agregaron el 2026-07-14 (commit a6dcde5) sin backfill,
// así que arrancaron en 0 para todos. `history`, en cambio, tiene el historial completo de
// siempre. Sin esto, el cron de re-reserva no le escribe a nadie hasta que un cliente acumule
// MIN_VISITS reservas *nuevas*, y el intervalo medio se calcula sobre una ventana falsa.
//
// Uso (las credenciales salen de .env):
//   node --env-file=.env scripts/backfill-nudge-aggregates.mjs           # dry-run, no escribe
//   node --env-file=.env scripts/backfill-nudge-aggregates.mjs --commit  # escribe
//
// OJO: al dejar nextNudgeAt en su valor real, los clientes que hace rato no vienen quedan
// vencidos y el cron diario les manda push. El dry-run reporta exactamente a cuántos.

import admin from "firebase-admin";

const COMMIT = process.argv.includes("--commit");

// Mismos valores que netlify/functions/nudge-reengagement.ts — solo para *reportar* el alcance.
const MIN_VISITS = 3;

// Espejo de `nextNudgeFrom` en src/services/appointments.ts (fuente de verdad de la fórmula).
// Si esa cambia, este script queda desactualizado: es de corrida única, no una segunda
// implementación viva. Las cotas evitan el promedio absurdo de las reservas juntas.
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_NUDGE_INTERVAL_DAYS = 14;
const MAX_NUDGE_INTERVAL_DAYS = 120;

function nextNudgeFrom(firstMs, lastMs, visitCount) {
  if (visitCount < 2 || lastMs <= firstMs) return null;
  const avgMs = (lastMs - firstMs) / (visitCount - 1);
  const intervalMs = Math.min(
    Math.max(avgMs, MIN_NUDGE_INTERVAL_DAYS * DAY_MS),
    MAX_NUDGE_INTERVAL_DAYS * DAY_MS
  );
  return lastMs + intervalMs;
}

function initAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Falta FIREBASE_SERVICE_ACCOUNT en el entorno.");
  let sanitized = raw.trim();
  if (
    (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
    (sanitized.startsWith("'") && sanitized.endsWith("'"))
  ) {
    sanitized = sanitized.slice(1, -1);
  }
  sanitized = sanitized.replace(
    /("private_key"\s*:\s*")([\s\S]*?)(")/,
    (_m, p, c, s) => p + c.replace(/\r?\n/g, "\\n") + s
  );
  sanitized = sanitized.replace(/\r?\n/g, " ");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sanitized)) });
  return admin;
}

const fmt = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : "—");

async function main() {
  const a = initAdmin();
  const db = a.firestore();
  const nowMs = Date.now();

  const clientes = await db.collection("clientes").get();
  console.log(`\nClientes: ${clientes.size}   modo: ${COMMIT ? "COMMIT (escribe)" : "DRY-RUN"}\n`);

  const plan = [];

  for (const doc of clientes.docs) {
    const data = doc.data();
    const hist = await doc.ref.collection("history").get();

    const times = hist.docs
      .map((d) => d.data().time)
      .filter((t) => t && typeof t.toMillis === "function")
      .map((t) => t.toMillis())
      .sort((x, y) => x - y);

    const prevCount = typeof data.visitCount === "number" ? data.visitCount : 0;

    if (!times.length) {
      // Sin historial no hay nada que agendar. Solo lo tocamos si hoy tiene agregados sueltos.
      if (prevCount || data.firstVisit || data.lastVisit || data.nextNudgeAt) {
        plan.push({ ref: doc.ref, email: doc.id, clear: true, prevCount, newCount: 0 });
      }
      continue;
    }

    const firstMs = times[0];
    const lastMs = times[times.length - 1];
    const visitCount = times.length;
    const nudgeMs = nextNudgeFrom(firstMs, lastMs, visitCount);

    const hasPush = !!data.fcmToken && data.notifEnabled !== false;
    // A quién le llegaría un push por este cambio: vencido + elegible para el cron.
    const wouldNudge =
      hasPush && visitCount >= MIN_VISITS && nudgeMs !== null && nudgeMs <= nowMs;

    const prevNudgeMs = data.nextNudgeAt?.toMillis?.() ?? null;

    plan.push({
      ref: doc.ref,
      email: doc.id,
      clear: false,
      prevCount,
      newCount: visitCount,
      prevNudgeMs,
      firstMs,
      lastMs,
      nudgeMs,
      hasPush,
      wouldNudge,
    });
  }

  // Ojo: cuenta también los cambios de nextNudgeAt, no solo de visitCount. Re-correr el script
  // tras tocar la fórmula (p.ej. las cotas del intervalo) mueve nextNudgeAt con visitCount
  // intacto, y ese cambio tiene que verse acá o el dry-run miente.
  const changed = plan.filter(
    (p) => p.clear || p.newCount !== p.prevCount || p.nudgeMs !== p.prevNudgeMs
  );
  const dueNow = plan.filter((p) => !p.clear && p.nudgeMs !== null && p.nudgeMs <= nowMs);
  const blast = plan.filter((p) => p.wouldNudge);

  console.log("--- Cambios (top 15) ---");
  for (const p of [...changed].sort((x, y) => y.newCount - x.newCount).slice(0, 15)) {
    if (p.clear) {
      console.log(`  ${p.email.padEnd(38)} limpiar (sin historial)`);
      continue;
    }
    const cnt =
      p.newCount !== p.prevCount ? `visitCount ${p.prevCount} -> ${p.newCount}` : `visitCount ${p.newCount} (=)`;
    const nudge =
      p.nudgeMs !== p.prevNudgeMs
        ? `nextNudgeAt ${fmt(p.prevNudgeMs)} -> ${fmt(p.nudgeMs)}`
        : `nextNudgeAt ${fmt(p.nudgeMs)} (=)`;
    console.log(
      `  ${p.email.padEnd(38)} ${cnt.padEnd(26)} | ult ${fmt(p.lastMs)} | ${nudge}${
        p.wouldNudge ? "  <-- LE LLEGA PUSH" : ""
      }`
    );
  }

  console.log("\n--- Resumen ---");
  console.log(`  Clientes totales:            ${clientes.size}`);
  console.log(`  Docs que cambian:            ${changed.length}`);
  console.log(`  Quedan vencidos (nudgeAt<=hoy): ${dueNow.length}`);
  console.log(`  Con push activo Y >=${MIN_VISITS} visitas Y vencidos: ${blast.length}   <-- ALCANCE REAL DEL PUSH`);
  console.log(`     (el cron manda hasta 50/dia, asi que tardaria ~${Math.ceil(blast.length / 50)} dia(s) en cubrirlos)`);

  if (!COMMIT) {
    console.log("\nDRY-RUN: no se escribio nada. Re-correr con --commit para aplicar.\n");
    return;
  }

  let written = 0;
  for (let i = 0; i < plan.length; i += 400) {
    const batch = db.batch();
    for (const p of plan.slice(i, i + 400)) {
      if (p.clear) {
        batch.set(
          p.ref,
          {
            visitCount: 0,
            firstVisit: admin.firestore.FieldValue.delete(),
            lastVisit: admin.firestore.FieldValue.delete(),
            nextNudgeAt: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        );
      } else {
        batch.set(
          p.ref,
          {
            visitCount: p.newCount,
            firstVisit: admin.firestore.Timestamp.fromMillis(p.firstMs),
            lastVisit: admin.firestore.Timestamp.fromMillis(p.lastMs),
            nextNudgeAt:
              p.nudgeMs === null
                ? admin.firestore.FieldValue.delete()
                : admin.firestore.Timestamp.fromMillis(p.nudgeMs),
          },
          { merge: true }
        );
      }
      written++;
    }
    await batch.commit();
  }

  console.log(`\nOK: ${written} docs actualizados.\n`);
}

main().catch((e) => {
  console.error("Backfill fallo:", e);
  process.exit(1);
});
