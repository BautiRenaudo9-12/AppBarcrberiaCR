import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error("❌ Error: Debes proporcionar la ruta a tu archivo serviceAccountKey.json");
  console.error("Uso: node scripts/migrate-keywords.js ./serviceAccountKey.json");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const generateKeywords = (text) => {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const keywords = [];

  for (let i = 0; i < normalized.length; i++) {
    keywords.push(normalized.substring(i));
  }

  const words = normalized.split(" ");
  if (words.length > 1) {
    words.forEach(word => {
        for (let i = 0; i < word.length; i++) {
            const suffix = word.substring(i);
            if (!keywords.includes(suffix)) {
                keywords.push(suffix);
            }
        }
    });
  }
  return keywords;
};

const createSearchKeywords = (name, email, phone) => {
    // Solo generar keywords del nombre
    const kName = generateKeywords(name || "");
    
    // Deduplicate
    const allKeywords = new Set([...kName]);
    return Array.from(allKeywords);
};

async function migrate() {
  console.log("🚀 Iniciando migración de keywords...");
  const snapshot = await db.collection('clientes').get();
  
  if (snapshot.empty) {
    console.log("No se encontraron clientes.");
    return;
  }

  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const keywords = createSearchKeywords(data.name, data.email, data.nro);
    
    batch.update(doc.ref, { keywords });
    count++;
  });

  await batch.commit();
  console.log(`✅ Migración completada. ${count} usuarios actualizados.`);
}

migrate().catch(console.error);
