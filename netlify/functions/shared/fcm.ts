import { FieldValue, type Firestore } from "firebase-admin/firestore";

// Códigos de error de FCM que significan que el token ya no sirve (desinstalaron la PWA,
// revocaron el permiso, expiró). Cualquier otro error es transitorio: reintentar tiene
// sentido y no hay que dar el token por perdido.
export const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

// Saca del perfil los tokens que FCM dio por muertos, para no reintentarlos en cada envío.
//
// Borra solo `fcmToken`, **nunca `notifEnabled`**: ese flag es la preferencia del cliente y es
// lo que sostiene el opt-out; pisarlo reactivaría notificaciones que alguien apagó a propósito.
// Sin token, `useFcmToken` re-registra uno nuevo en la próxima visita.
//
// Va por transacción y no por batch para no pisar un token recién re-registrado entre la
// lectura del perfil y el fallo del envío. Son casos raros, así que N transacciones no pesan.
export async function clearDeadTokens(
  db: Firestore,
  stale: { email: string; token: string }[]
): Promise<void> {
  await Promise.all(
    stale.map(({ email, token }) =>
      db
        .runTransaction(async (tx) => {
          const ref = db.collection("clientes").doc(email);
          const fresh = await tx.get(ref);
          if (fresh.data()?.fcmToken !== token) return;
          tx.update(ref, { fcmToken: FieldValue.delete() });
        })
        .catch((e) => console.error(`No se pudo limpiar el token de ${email}:`, e))
    )
  );
}
