importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// OJO: esta config está duplicada de VITE_FIREBASE_CONFIG (ver src/lib/firebase.ts). No es
// secreta —la config web de Firebase es pública—, pero el service worker se sirve tal cual
// desde public/ y no pasa por Vite, así que no puede leer import.meta.env. Si algún día
// cambian estos valores hay que tocar los DOS lados o el push deja de llegar.
const firebaseConfig = {
  apiKey: "AIzaSyCEvPU8AVRTP436__VucfKIh2sKeff8ewY",
  authDomain: "react-appbarberiacr.firebaseapp.com",
  projectId: "react-appbarberiacr",
  storageBucket: "react-appbarberiacr.firebasestorage.app",
  messagingSenderId: "461314344648",
  appId: "1:461314344648:web:8d5752cefcedebed9547fd",
  measurementId: "G-L0F8BL59VQ"
};

if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  try {
    // 1. Verificar si es nuestro tipo de recordatorio personalizado
    if (payload.data && payload.data.type === 'appointment_reminder') {
      const notificationTitle = payload.data.title;
      const notificationOptions = {
        body: payload.data.body,
        icon: '/pwa-192x192.png',
        badge: '/notification-badge.png', // Icono pequeño en barra de estado (Android)
        image: '/pwa-512x512.png', // Imagen grande (opcional)
        vibrate: [200, 100, 200], // Vibrar: Bzz-Pausa-Bzz
        tag: 'appointment-reminder', // Agrupar notificaciones
        renotify: true, // Volver a sonar si llega otra con el mismo tag
        requireInteraction: true, // Mantener visible hasta que el usuario interactúe
        data: payload.data,
        // Orden visual: Cancelar a la izquierda, Confirmar a la derecha (Android respeta el
        // orden del array). El dispatch en notificationclick es por `action`, no por posición,
        // así que el orden es puramente visual.
        actions: [
          { action: 'cancel', title: 'Cancelar' },
          { action: 'confirm', title: 'Confirmar' }
        ]
      };
      return self.registration.showNotification(notificationTitle, notificationOptions);
    }

    // 1b. Aviso de lista de espera: se liberó un turno de un día en el que el cliente espera.
    if (payload.data && payload.data.type === 'waitlist_slot') {
      return self.registration.showNotification(payload.data.title || '¡Se liberó un turno!', {
        body: payload.data.body,
        icon: '/pwa-192x192.png',
        badge: '/notification-badge.png',
        vibrate: [200, 100, 200],
        tag: 'waitlist-slot-' + (payload.data.date || ''),
        renotify: true,
        requireInteraction: true,
        data: payload.data // incluye url: /turnos?date=... para el notificationclick
      });
    }

    // 1c. Recordatorio de re-reserva ("ya te toca"): el cliente hace rato que no viene.
    if (payload.data && payload.data.type === 'reengagement') {
      return self.registration.showNotification(payload.data.title || '¿Te toca un corte? ✂️', {
        body: payload.data.body,
        icon: '/pwa-192x192.png',
        badge: '/notification-badge.png',
        vibrate: [200, 100, 200],
        tag: 'reengagement',
        renotify: true,
        data: payload.data // incluye url: /turnos para el notificationclick
      });
    }

    // 2. FALLBACK: Si llega cualquier otro mensaje data-only
    if (payload.data) {
        const title = payload.data.title || payload.notification?.title || 'Notificación';
        const body = payload.data.body || payload.notification?.body || 'Nuevo mensaje recibido';
        
        return self.registration.showNotification(title, {
            body: body,
            icon: '/pwa-192x192.png',
            badge: '/notification-badge.png',
            vibrate: [100, 50, 100],
            data: payload.data
        });
    }

  } catch (err) {
    console.error('[firebase-messaging-sw.js] Error handling message', err);
    // Intento final para evitar "Site updated in background"
    return self.registration.showNotification('Barbería CR', {
        body: 'Tienes un nuevo mensaje',
        icon: '/pwa-192x192.png',
        badge: '/notification-badge.png'
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const payloadData = event.notification.data || {};

  // Confirmar asistencia SIN abrir la app: fetch en segundo plano a la function, que
  // valida el token HMAC del payload y marca el turno como confirmado. Solo cerramos
  // la notificación (ya se hizo arriba con close()).
  if (event.action === 'confirm') {
    if (payloadData.appointmentId && payloadData.confirmToken) {
      event.waitUntil(
        fetch('/api/confirm-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: payloadData.appointmentId,
            token: payloadData.confirmToken
          })
        }).catch((err) => console.error('confirm-appointment falló:', err))
      );
    }
    return;
  }

  const isCancel = event.action === 'cancel';
  // Cancelar abre la app en una URL que Home.tsx sabe interpretar (?action=cancel&id=...).
  // Para el resto (tap en el cuerpo) usamos la url del payload.
  const urlToOpen = isCancel
    ? `/?action=cancel&id=${encodeURIComponent(payloadData.appointmentId || '')}`
    : (payloadData.url || '/');

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windowClients.find((c) => c.url.indexOf(self.location.origin) === 0 && 'focus' in c);

    if (client) {
      await client.focus();

      if (isCancel) {
        // App abierta: disparamos la cancelación por postMessage en vez de client.navigate().
        // navigate() rechaza cuando la ventana no está controlada por el SW (p. ej. justo
        // después de un update) y, al ir dentro de waitUntil sin catch, el botón "no hacía
        // nada". postMessage funciona con clientes controlados y no controlados y no recarga
        // la página; el puente NotificationActionBridge lo enruta al diálogo de cancelación.
        client.postMessage({
          type: 'notification-action',
          action: 'cancel',
          appointmentId: payloadData.appointmentId
        });
        return;
      }

      if (client.navigate) {
        // Tap en el cuerpo: best-effort, si navigate() falla la ventana ya quedó enfocada.
        try { await client.navigate(urlToOpen); } catch (err) { /* ya está enfocada */ }
      }
      return;
    }

    // Sin ventana abierta: la abrimos en la URL destino. En frío, Home.tsx lee el query param
    // (?action=cancel&id=...) al montar y abre el diálogo.
    if (clients.openWindow) {
      await clients.openWindow(urlToOpen);
    }
  })());
});