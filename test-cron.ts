import { handler } from './netlify/functions/check-upcoming-appointments';

// Mock context and event
const mockEvent = {
  headers: {
    // Si tienes CRON_SECRET configurado en .env, asegúrate de que coincida aquí o coméntalo para pruebas locales si tu función lo permite
    'x-api-key': process.env.CRON_SECRET || 'test-secret' 
  },
  body: '',
  httpMethod: 'POST',
  isBase64Encoded: false,
  path: '/api/check-upcoming-appointments',
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  multiValueHeaders: {},
  rawQuery: '',
  rawUrl: ''
} as any;

const mockContext = {} as any;

async function runTest() {
  console.log('--- Iniciando prueba de Cron Job localmente ---');
  
  // Load env vars if using Node 20+ (supports .env automatically) or assume they are set
  // process.loadEnvFile(); // Uncomment if you have an .env file and Node 21+

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('⚠️ ADVERTENCIA: FIREBASE_SERVICE_ACCOUNT no detectado en variables de entorno.');
    console.warn('El script probablemente fallará al intentar conectar a Firestore.');
  }

  try {
    const response = await handler(mockEvent, mockContext);
    console.log('--- Respuesta del Handler ---');
    console.log('Status Code:', response?.statusCode);
    console.log('Body:', response?.body);
  } catch (error) {
    console.error('--- Error ejecutando el handler ---', error);
  }
}

runTest();
