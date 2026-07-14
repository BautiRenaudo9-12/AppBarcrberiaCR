importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

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
        badge: '/masked-icon.svg', // Icono pequeño en barra de estado (Android)
        image: '/pwa-512x512.png', // Imagen grande (opcional)
        vibrate: [200, 100, 200], // Vibrar: Bzz-Pausa-Bzz
        tag: 'appointment-reminder', // Agrupar notificaciones
        renotify: true, // Volver a sonar si llega otra con el mismo tag
        requireInteraction: true, // Mantener visible hasta que el usuario interactúe
        data: payload.data,
        actions: [
          { action: 'confirm', title: 'Confirmar' },
          { action: 'cancel', title: 'Cancelar' }
        ]
      };
      return self.registration.showNotification(notificationTitle, notificationOptions);
    }

    // 1b. Aviso de lista de espera: se liberó un turno de un día en el que el cliente espera.
    if (payload.data && payload.data.type === 'waitlist_slot') {
      return self.registration.showNotification(payload.data.title || '¡Se liberó un turno!', {
        body: payload.data.body,
        icon: '/pwa-192x192.png',
        badge: '/masked-icon.svg',
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
        badge: '/masked-icon.svg',
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
            badge: '/masked-icon.svg',
            vibrate: [100, 50, 100],
            data: payload.data
        });
    }

  } catch (err) {
    console.error('[firebase-messaging-sw.js] Error handling message', err);
    // Intento final para evitar "Site updated in background"
    return self.registration.showNotification('Barbería CR', {
        body: 'Tienes un nuevo mensaje',
        icon: '/pwa-192x192.png'
    });
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const payloadData = event.notification.data;
  let urlToOpen = payloadData.url || '/';

  // Manejo de acciones
  if (event.action === 'cancel') {
    // Redirigir a una URL que maneje la cancelación (Home.tsx lo hace)
    urlToOpen = `/?action=cancel&id=${payloadData.appointmentId}`;
  } else if (event.action === 'confirm') {
    // Confirmar asistencia SIN abrir la app: fetch en segundo plano a la function, que
    // valida el token HMAC del payload y marca el turno como confirmado. Solo cerramos
    // la notificación (ya se hizo arriba con close()).
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

  // Solo abrir ventana si NO es la acción de confirmar
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Intentar enfocar una ventana existente
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf(self.location.origin) === 0 && 'focus' in client) {
          return client.focus().then(focusedClient => {
              if (focusedClient.navigate) {
                  return focusedClient.navigate(urlToOpen);
              }
          });
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});