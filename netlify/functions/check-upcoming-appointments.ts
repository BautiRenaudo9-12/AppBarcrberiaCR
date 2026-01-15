import { Handler } from '@netlify/functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton)
// We do this lazily or safely at top level but don't crash if it fails immediately
let isFirebaseInitialized = false;

function initFirebase() {
    if (admin.apps.length) {
        isFirebaseInitialized = true;
        return;
    }
    
    try {
        let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
        
        // Handle potential extra quotes from .env parsing issues
        if (serviceAccountStr.startsWith('"') && serviceAccountStr.endsWith('"')) {
            serviceAccountStr = serviceAccountStr.slice(1, -1);
        }
        if (serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) {
            serviceAccountStr = serviceAccountStr.slice(1, -1);
        }

        // Try to handle escaped newlines or literal newlines
        // Sometimes the private key has \n that becomes \\n or literal newline
        
        try {
            const serviceAccount = JSON.parse(serviceAccountStr);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            isFirebaseInitialized = true;
        } catch (parseError) {
             console.log("First parse failed, trying to sanitize...", parseError);
             // If it failed, maybe it's because of newlines?
             // Try removing newlines? No, that breaks the private key block.
             // But JSON.parse expects a single line string usually unless formatted perfectly.
             
             // Check if it's a stringified JSON string (double encoded)
             if (serviceAccountStr.startsWith('"{') || serviceAccountStr.startsWith('"\\{')) {
                 try {
                    const inner = JSON.parse(serviceAccountStr); // This decodes the string
                    if (typeof inner === 'string') {
                        const serviceAccount = JSON.parse(inner);
                        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                        isFirebaseInitialized = true;
                        return;
                    } else if (typeof inner === 'object') {
                        admin.initializeApp({ credential: admin.credential.cert(inner) });
                        isFirebaseInitialized = true;
                        return;
                    }
                 } catch (e2) { /* ignore */ }
             }

             throw parseError;
        }

    } catch (e: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Raw value start:", (process.env.FIREBASE_SERVICE_ACCOUNT || '').substring(0, 50));
        console.error(e);
        isFirebaseInitialized = false;
        // Store error for debug
        (global as any).firebaseInitError = e.message;
    }
}

// Attempt init at load time, but don't throw
initFirebase();

export const handler: Handler = async (event, context) => {
  const apiKey = event.headers['x-api-key'];
  if (apiKey !== process.env.CRON_SECRET) {
    if (process.env.CRON_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' };
    }
  }

  // Ensure Firebase is ready
  if (!isFirebaseInitialized) {
      // Try one more time? Or just fail gracefully
      initFirebase();
      if (!isFirebaseInitialized) {
          const rawStart = (process.env.FIREBASE_SERVICE_ACCOUNT || '').substring(0, 20);
          const errorMsg = (global as any).firebaseInitError || 'Unknown error';
          return {
              statusCode: 500,
              body: JSON.stringify({ 
                  success: false, 
                  error: 'Firebase initialization failed.',
                  debug: `Raw start: '${rawStart}'`,
                  details: errorMsg
              })
          };
      }
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

      // Get User Token
      const userDoc = await db.collection('clientes').doc(email).get();
      if (!userDoc.exists) {
          console.log(`User ${email} not found.`);
          continue;
      }
      
      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (fcmToken) {
        // Send Notification
        try {
          const appointmentTime = data.timestamp.toDate();
          const formattedTime = appointmentTime.toLocaleTimeString('es-CR', {hour: '2-digit', minute:'2-digit', hour12: true}); // e.g. 4:30 PM

          await admin.messaging().send({
            token: fcmToken,
            notification: {
              title: '¡Tu turno se acerca!',
              body: `Tienes un turno a las ${formattedTime}. ¡Te esperamos!`,
            },
            data: {
              title: '¡Tu turno se acerca!',
              body: `Tienes un turno a las ${formattedTime}. ¡Te esperamos!`,
              url: '/turnos'
            }
          });
          notificationsSent.push(email);
          console.log(`Notification sent to ${email}`);

          // Mark as notified
          batch.update(doc.ref, { notified: true });
          batchCount++;
        } catch (sendError) {
          console.error(`Failed to send to ${email}`, sendError);
        }
      } else {
          console.log(`No token for ${email}`);
      }
    }

    if (batchCount > 0) {
        await batch.commit();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        processed: appointmentsSnapshot.size, 
        notificationsSent
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
