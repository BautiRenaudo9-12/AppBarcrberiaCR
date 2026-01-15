import { Handler } from '@netlify/functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern)
if (!admin.apps.length) {
  // Use environment variables for credentials in production
  // For local dev, you might need a service-account.json or mock
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT", e);
  }
}

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, title, body } = JSON.parse(event.body || '{}');

    if (!token || !title || !body) {
      return { statusCode: 400, body: 'Missing token, title, or body' };
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: response }),
    };

  } catch (error: any) {
    console.error('Error sending message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
