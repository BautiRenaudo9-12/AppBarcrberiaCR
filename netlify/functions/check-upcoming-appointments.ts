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
            // First attempt: direct parse
            const serviceAccount = JSON.parse(serviceAccountStr);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            isFirebaseInitialized = true;
        } catch (parseError) {
             console.log("First parse failed, trying to sanitize...", parseError);
             
             try {
                // Strategy: 
                // 1. Fix newlines INSIDE the private_key string (convert to \n)
                // 2. Fix newlines OUTSIDE strings (convert to space, for pretty print)
                
                let sanitized = serviceAccountStr;

                // Fix private_key specifically: match "private_key": "CONTENT"
                // We use [\s\S] to match across lines
                sanitized = sanitized.replace(
                    /("private_key"\s*:\s*")([\s\S]*?)(")/,
                    (match, prefix, content, suffix) => {
                        // Replace literal newlines with escaped \n inside the key
                        const fixedContent = content.replace(/\r?\n/g, '\\n');
                        return prefix + fixedContent + suffix;
                    }
                );

                // Now safe to replace remaining newlines (structure) with spaces
                sanitized = sanitized.replace(/\r?\n/g, ' ');

                const serviceAccount = JSON.parse(sanitized);
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
                isFirebaseInitialized = true;
                return;
             } catch (e2) {
                 // Fallback: Check if it's double encoded
                 if (serviceAccountStr.startsWith('"{') || serviceAccountStr.startsWith('"\\{')) {
                    /* ... existing double encoded logic ... */
                    try {
                        const inner = JSON.parse(serviceAccountStr);
                        const sa = typeof inner === 'string' ? JSON.parse(inner) : inner;
                        admin.initializeApp({ credential: admin.credential.cert(sa) });
                        isFirebaseInitialized = true;
                        return;
                    } catch (e3) {}
                 }
                 throw parseError; // Throw original if all fails
             }
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

    let notificationsSentCount = 0;
    const notificationsSent: string[] = [];

    // Process each appointment in a transaction to prevent duplicate notifications (race conditions)
    const processPromises = appointmentsSnapshot.docs.map(async (docSnapshot) => {
        const docRef = docSnapshot.ref;

        try {
            await db.runTransaction(async (transaction) => {
                const freshDoc = await transaction.get(docRef);
                if (!freshDoc.exists) return;

                const data = freshDoc.data();
                if (!data) return;

                // Re-check conditions inside transaction
                if (data.status !== 'confirmed') return;
                if (data.notified) return; // Already notified by another process
                
                const email = data.clientEmail;
                if (!email) return;

                // We need to fetch the user token. 
                // Ideally this should be part of the transaction if we want strict consistency,
                // but reading a separate collection is fine if we just want to lock the appointment.
                // However, Firestore transactions require all reads to happen before writes.
                
                // Since we can't easily read a dynamic document path (users/email) inside this transaction 
                // without knowing it beforehand (which we do from 'data'), let's try reading it.
                // Note: Client document reference
                const userDocRef = db.collection('clientes').doc(email);
                const userDoc = await transaction.get(userDocRef);
                
                if (!userDoc.exists) return;
                const userData = userDoc.data();
                const fcmToken = userData?.fcmToken;

                if (fcmToken) {
                    // Send Notification
                    // Note: Ideally, we should send notification AFTER commit to be 100% sure we secured the lock.
                    // But if we fail to send, we might want to NOT mark it as notified?
                    // Or we mark it as notified, and if send fails, we are out of luck?
                    
                    // Risk: We send notification, but transaction fails -> Duplicate notification possible if retried.
                    // Risk: Transaction commits, but notification fails -> User never notified.
                    
                    // Better approach for at-least-once delivery:
                    // 1. Mark as 'processing_notification' in transaction.
                    // 2. Send notification.
                    // 3. Mark as 'notified' in another update.
                    
                    // Simpler approach for now (Collision resistance):
                    // Use the transaction to claim the notification rights.
                    
                    const appointmentTime = data.timestamp.toDate();
                    const formattedTime = appointmentTime.toLocaleTimeString('es-CR', {hour: '2-digit', minute:'2-digit', hour12: true});
                    
                    // Side effect inside transaction is risky but practical for low volume.
                    // A better way is to throw if send fails, aborting transaction.
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

                    // Update doc
                    transaction.update(docRef, { notified: true });
                    notificationsSent.push(email);
                    notificationsSentCount++;
                }
            });
        } catch (e) {
            console.error(`Transaction failed for ${docSnapshot.id}:`, e);
        }
    });

    await Promise.all(processPromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        processed: appointmentsSnapshot.size, 
        sent: notificationsSentCount,
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
