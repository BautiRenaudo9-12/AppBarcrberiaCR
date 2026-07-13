import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Backfill del índice de búsqueda de clientes: recomputa `keywords` (nombre + email + teléfono)
// para todos los docs de `clientes`. Correr UNA vez tras cambiar la generación de keywords.
// Uso: node scripts/migrate-keywords.js ./serviceAccountKey.json

const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error("❌ Error: Debes proporcionar la ruta a tu archivo serviceAccountKey.json");
  console.error("Uso: node scripts/migrate-keywords.js ./serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// --- Debe mantenerse en sync con src/lib/keywords.ts ---

const MIN = 2;

const normalizeText = (text) =>
  (text || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const substrings = (s) => {
  const out = [];
  if (s.length > 0 && s.length < MIN) out.push(s);
  for (let i = 0; i < s.length; i++) {
    for (let j = i + MIN; j <= s.length; j++) out.push(s.slice(i, j));
  }
  return out;
};

const generateKeywords = (text) => {
  const norm = normalizeText(text);
  if (!norm) return [];
  const set = new Set();
  for (const word of norm.split(" ")) {
    if (!word) continue;
    for (const s of substrings(word)) set.add(s);
  }
  return Array.from(set);
};

const createSearchKeywords = (name, email, phone) => {
  const set = new Set();
  for (const k of generateKeywords(name || "")) set.add(k);

  const em = normalizeText(email || "").replace(/\s+/g, "");
  if (em) {
    set.add(em);
    const local = em.split("@")[0] || "";
    for (const s of substrings(local)) set.add(s);
  }

  const digits = (phone || "").replace(/\D/g, "");
  for (const s of substrings(digits)) set.add(s);

  return Array.from(set);
};

// --- Migración ---

async function migrate() {
  console.log("🚀 Iniciando migración de keywords...");
  const snapshot = await db.collection('clientes').get();

  if (snapshot.empty) {
    console.log("No se encontraron clientes.");
    return;
  }

  const docs = snapshot.docs;
  const CHUNK = 500; // máx. de operaciones por writeBatch de Firestore
  let count = 0;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const doc of docs.slice(i, i + CHUNK)) {
      const data = doc.data();
      const keywords = createSearchKeywords(data.name, data.email, data.nro);
      batch.update(doc.ref, { keywords });
      count++;
    }
    await batch.commit();
    console.log(`  ...${Math.min(count, docs.length)}/${docs.length}`);
  }

  console.log(`✅ Migración completada. ${count} clientes actualizados.`);
}

migrate().catch(console.error);
