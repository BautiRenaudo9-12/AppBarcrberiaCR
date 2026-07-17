import { Handler } from '@netlify/functions';
import crypto from 'crypto';
import { getAdmin } from './shared/firebaseAdmin';
import { DEAD_TOKEN_CODES, clearDeadTokens } from './shared/fcm';

export const handler: Handler = async (event, context) => {
  // Fail-closed: require a configured secret that matches the request header.
  const apiKey = event.headers['x-api-key'];
  if (!process.env.CRON_SECRET || apiKey !== process.env.CRON_SECRET) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let admin;
  try {
    admin = getAdmin();
  } catch (e) {
    // Log details server-side only; do not leak config/error specifics to the caller.
    console.error('Firebase initialization failed.', e);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Firebase initialization failed.' }),
    };
  }

  try {
    const db = admin.firestore(); // Safe to call now

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes window

    console.log(`Checking appointments between ${now.toISOString()} and ${oneHourFromNow.toISOString()}`);

    // Query 'appointments' collection by timestamp range
    const appointmentsSnapshot = await db.collection('appointments')
        .where('timestamp', '>=', now)
        .where('timestamp', '<=', oneHourFromNow)
        .get();
    
    console.log(`Found ${appointmentsSnapshot.size} appointments in time window.`);

    const batch = db.batch();
    let batchCount = 0;
    const notificationsSent: string[] = [];
    const staleTokens: { email: string; token: string }[] = [];

    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      
      console.log(`Checking appointment ${doc.id}:`, JSON.stringify(data));

      if (data.status !== 'confirmed') {
          console.log(`Skipping ${doc.id}: status is ${data.status}`);
          continue;
      }

      if (data.notified) {
          console.log(`Skipping ${doc.id}: already notified`);
          continue;
      }

      // Found a candidate!
      const email = data.clientEmail;

      if (!email) {
          console.log(`Skipping ${doc.id}: no clientEmail`);
          continue;
      }

      // Always read the FCM token from the (private) client profile via Admin SDK.
      // Tokens are intentionally NOT denormalized into the publicly-readable appointments.
      const userDoc = await db.collection('clientes').doc(email).get();
      const profile = userDoc.exists ? userDoc.data() ?? {} : {};

      // Respetar el opt-out explícito, igual que notify-waitlist y nudge-reengagement. Hoy
      // desactivar deja además fcmToken en null, así que el chequeo de abajo ya alcanzaría;
      // esto es defensa en profundidad para que las tres functions lean la preferencia igual.
      if (profile.notifEnabled === false) {
          console.log(`Skipping ${doc.id}: notificaciones desactivadas por el cliente`);
          continue;
      }

      const fcmToken = profile.fcmToken;

      if (fcmToken) {
        // Prepare Notification Payload
        const appointmentTime = data.timestamp.toDate();
        const formattedTime = appointmentTime.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute:'2-digit',
              hour12: true,
              timeZone: 'America/Argentina/Buenos_Aires'
        });

        // Token HMAC para que el cliente pueda confirmar la asistencia desde el push sin
        // abrir la app (lo valida la function confirm-appointment). CRON_SECRET ya está
        // garantizado arriba (fail-closed), así que siempre podemos generarlo.
        const confirmToken = crypto
          .createHmac('sha256', process.env.CRON_SECRET as string)
          .update(doc.id)
          .digest('hex');

        const messagePayload = {
            data: {
              type: 'appointment_reminder',
              appointmentId: doc.id,
              confirmToken,
              title: '¡Tu turno se acerca!',
              body: `Tienes un turno a las ${formattedTime}. ¡Te esperamos!`,
              url: '/'
            }
        };

        try {
          await admin.messaging().send({ token: fcmToken, ...messagePayload });

          notificationsSent.push(email);
          batch.update(doc.ref, { notified: true });
          batchCount++;
        } catch (sendError: any) {
          // Token muerto: fuera del perfil. Si no, este cliente no recibe recordatorios nunca
          // más y lo reintentamos cada 10 minutos para siempre. Sin token, la app le vuelve a
          // pedir permiso y re-registra uno nuevo en su próxima visita.
          if (DEAD_TOKEN_CODES.has(sendError?.code)) {
            staleTokens.push({ email, token: fcmToken });
          }
          console.error(`Failed to send reminder for appointment ${doc.id}:`, sendError.code || sendError.message);
        }
      } else {
          console.log(`No FCM token found in profile for appointment ${doc.id}.`);
      }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    await clearDeadTokens(db, staleTokens);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processed: appointmentsSnapshot.size,
        notificationsSent,
        cleanedTokens: staleTokens.length
      }),
    };

  } catch (error: any) {
    console.error('Error in cron job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
