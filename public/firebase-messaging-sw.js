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

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  if (payload.data && payload.data.type === 'appointment_reminder') {
    const notificationTitle = payload.data.title;
    const notificationOptions = {
      body: payload.data.body,
      icon: '/pwa-192x192.png',
      badge: '/masked-icon.svg',
      data: payload.data,
      actions: [
        {
          action: 'confirm',
          title: 'Confirmar'
        },
        {
          action: 'cancel',
          title: 'Cancelar'
        }
      ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const payloadData = event.notification.data;
  let urlToOpen = payloadData.url || '/';

  if (event.action === 'cancel') {
    urlToOpen = `/?action=cancel&id=${payloadData.appointmentId}`;
  } else if (event.action === 'confirm') {
    return; 
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
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
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
