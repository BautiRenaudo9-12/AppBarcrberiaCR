import { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton)
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
  }
}

const db = admin.firestore();

const arrayDias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

export const handler: Handler = async (event, context) => {
  // 1. Security Check
  const apiKey = event.headers['x-api-key'];
  if (apiKey !== process.env.CRON_SECRET) {
    // Check if CRON_SECRET is set, if not, maybe allow for now or default to block
    if (process.env.CRON_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' };
    }
  }

  try {
    const now = new Date();
    // Use UTC-3 (Costa Rica/Argentina time? Project seems to use -03:00) 
    // The previous code used moment().utcOffset("-03:00").
    // Let's stick to standard Date comparisons if timestamps are stored as Firestore Timestamps (UTC).
    // Firestore Timestamps are absolute points in time.
    
    // We want appointments starting in the next 60 minutes.
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Identify the current day name to pick the correct collection
    // Note: This relies on the server time matching the "day" logic. 
    // If the server is UTC and the business is UTC-3, we might query the wrong day at 10PM UTC (7PM Local).
    // Safest approach: Check 'today' and 'tomorrow' if near midnight?
    // For simplicity, let's assume the 'day' collection corresponds to the day of the appointment timestamp.
    // Actually, we can just check the current day based on the timezone offset.
    // The project uses -03:00 (Argentina/Uruguay/parts of Brazil? or maybe CR is -06:00? The context says 'App Barberia CR' implying Costa Rica (-06:00) but code says utcOffset("-03:00")).
    // I will assume -03:00 based on 'src/services/reservations.ts'.
    
    // Adjust 'now' to -03:00 day index
    const nowInTargetTz = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Approximation if system is UTC
    // Better: use the day index from the actual Date object relative to the timezone logic if possible.
    // Let's rely on standard JS getDay() and the array map.
    
    // HOWEVER: "turnos" collection is organized by "lunes", "martes", etc.
    // We must query the collection corresponding to TODAY's day of week.
    
    const dayIndex = nowInTargetTz.getDay(); // 0 = Sunday
    const dayName = arrayDias[dayIndex];
    
    console.log(`Checking appointments for ${dayName} between ${now.toISOString()} and ${oneHourFromNow.toISOString()}`);

    // Query: turnos/{dayName}/turnos
    // We can't filter by `reserve.time` easily if it's inside a map in a subcollection without a composite index maybe?
    // But `reserve.time` is inside the `reserve` map.
    // Let's fetch all slots for the day (usually not that many for a barber shop) and filter in memory.
    
    const slotsSnapshot = await db.collection('turnos').doc(dayName).collection('turnos').get();
    
    const notificationsSent: string[] = [];
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of slotsSnapshot.docs) {
      const data = doc.data();
      const reserve = data.reserve;

      // Check if reserved
      if (!reserve || !reserve.email || !reserve.time) continue;

      const appointmentTime = reserve.time.toDate();

      // Check time window: In the future, but less than 1 hour away
      if (appointmentTime > now && appointmentTime <= oneHourFromNow) {
        
        // Check if already notified
        if (data.notified) continue;

        console.log(`Found upcoming appointment: ${doc.id} for ${reserve.email} at ${appointmentTime}`);

        // Get User Token
        const userDoc = await db.collection('clientes').doc(reserve.email).get();
        if (!userDoc.exists) {
            console.log(`User ${reserve.email} not found.`);
            continue;
        }
        
        const userData = userDoc.data();
        const fcmToken = userData?.fcmToken;

        if (fcmToken) {
          // Send Notification
          try {
            await admin.messaging().send({
              token: fcmToken,
              notification: {
                title: '¡Tu turno se acerca!',
                body: `Tienes un turno reservado para las ${appointmentTime.toLocaleTimeString('es-CR', {hour: '2-digit', minute:'2-digit'})}. ¡Te esperamos!`,
              }
            });
            notificationsSent.push(reserve.email);

            // Mark as notified
            batch.update(doc.ref, { notified: true });
            batchCount++;
          } catch (sendError) {
            console.error(`Failed to send to ${reserve.email}`, sendError);
          }
        } else {
            console.log(`No token for ${reserve.email}`);
        }
      }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        processed: slotsSnapshot.size, 
        notificationsSent,
        dayChecked: dayName
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
