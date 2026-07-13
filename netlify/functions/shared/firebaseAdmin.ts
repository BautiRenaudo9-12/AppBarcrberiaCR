import admin from "firebase-admin";

// Init del Admin SDK compartido entre functions. Soporta dos formas de credencial:
// FIREBASE_SERVICE_ACCOUNT (JSON, con saneo del private_key) o las vars individuales
// FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.
let initialized = false;

function init() {
  if (admin.apps.length) {
    initialized = true;
    return;
  }

  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountStr) {
    try {
      let sanitized = serviceAccountStr.trim();
      if (
        (sanitized.startsWith('"') && sanitized.endsWith('"')) ||
        (sanitized.startsWith("'") && sanitized.endsWith("'"))
      ) {
        sanitized = sanitized.slice(1, -1);
      }
      // Escapar saltos de línea dentro del private_key, luego limpiar el resto.
      sanitized = sanitized.replace(
        /("private_key"\s*:\s*")([\s\S]*?)(")/,
        (_m, prefix, content, suffix) => prefix + content.replace(/\r?\n/g, "\\n") + suffix
      );
      sanitized = sanitized.replace(/\r?\n/g, " ");

      const serviceAccount = JSON.parse(sanitized);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      initialized = true;
      return;
    } catch (e) {
      console.error("FIREBASE_SERVICE_ACCOUNT inválido, probando vars individuales...", e);
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    initialized = true;
    return;
  }

  throw new Error("No hay configuración de Firebase válida en el entorno.");
}

export function getAdmin() {
  if (!initialized) init();
  return admin;
}
