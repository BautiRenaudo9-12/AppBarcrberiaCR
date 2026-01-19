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
    
    // Method 1: Try FIREBASE_SERVICE_ACCOUNT JSON
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountStr) {
        try {
            // ... (Existing sanitization logic could go here, but let's keep it simple or reuse if robust)
            // For brevity in this replacement, we'll try the robust sanitization we added before
            // OR just try basic parse first. 
            // Actually, let's keep the robust logic we built but wrap it nicely.
            
            let sanitized = serviceAccountStr;
            
            // Handle quotes wrapper
            if (sanitized.startsWith('"') && sanitized.endsWith('"')) sanitized = sanitized.slice(1, -1);
            if (sanitized.startsWith("'") && sanitized.endsWith("'")) sanitized = sanitized.slice(1, -1);

            // Robust sanitization (re-implementing the successful logic from before)
             try {
                // Fix private_key specifically
                sanitized = sanitized.replace(
                    /("private_key"\s*:\s*")([\s\S]*?)(")/,
                    (match, prefix, content, suffix) => {
                        return prefix + content.replace(/\r?\n/g, '\\n') + suffix;
                    }
                );
                sanitized = sanitized.replace(/\r?\n/g, ' '); // Clean structure

                const serviceAccount = JSON.parse(sanitized);
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                isFirebaseInitialized = true;
                return;
             } catch (jsonErr) {
                 // Ignore and fall through to Method 2 or throw
                 console.log("JSON init failed, trying individual vars...", jsonErr);
                 (global as any).firebaseInitError = `JSON Parse Error: ${(jsonErr as Error).message}`;
             }
        } catch (e: any) {
             (global as any).firebaseInitError = e.message;
        }
    }

    // Method 2: Individual Environment Variables
    // Check if we have the breakdown vars
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix escaped newlines
                }),
            });
            isFirebaseInitialized = true;
            return;
        } catch (e: any) {
            console.error("Individual vars init failed", e);
            (global as any).firebaseInitError = `Individual Vars Error: ${e.message}`;
        }
    } else {
        if (!(global as any).firebaseInitError) {
             (global as any).firebaseInitError = "No valid Firebase configuration found (checked FIREBASE_SERVICE_ACCOUNT and individual vars).";
        }
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
          const formattedTime = appointmentTime.toLocaleTimeString('es-AR', {
              hour: '2-digit', 
              minute:'2-digit', 
              hour12: true, 
              timeZone: 'America/Argentina/Buenos_Aires'
          });

          await admin.messaging().send({
            token: fcmToken,
            data: {
              type: 'appointment_reminder',
              appointmentId: doc.id,
              title: '¡Tu turno se acerca!',
              body: `Tienes un turno a las ${formattedTime}. ¡Te esperamos!`,
              url: '/' // Changed to root so home handles it
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
