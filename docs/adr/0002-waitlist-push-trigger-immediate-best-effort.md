# Disparo del aviso de lista de espera: inmediato best-effort desde el cliente

Cuando se cancela un turno (la cancelación es un `deleteDoc` en el browser, la haga el cliente o el admin), el propio browser llama a una **Netlify Function nueva** que verifica el ID token de Firebase y hace el fan-out de push (FCM) a los anotados en la lista de espera de ese día, leyendo los `fcmToken` con el Admin SDK. Se eligió esto por sobre Firebase Cloud Functions (trigger de Firestore) y por sobre un barrido programado que procese un log de cancelaciones.

## Por qué

El proyecto no usa Cloud Functions (está en Firebase Hosting + Netlify Functions), y el push necesita el Admin SDK server-side. La opción inmediata es la más simple y de menor latencia, reusa el patrón de la function de cron existente, y no agrega infraestructura nueva más allá de un endpoint. El costo aceptado: si el usuario cierra la pestaña justo al cancelar, ese aviso puede perderse (best-effort).

## Consecuencias

- La function debe protegerse contra abuso: verificar identidad y aplicar throttle por destinatario (nadie recibe más de un aviso por ventana de tiempo), y saltear a clientes con reserva activa.
- Camino de endurecimiento futuro sin rehacer: escribir un evento "turno liberado" al cancelar y agregar un barrido programado de respaldo que procese los eventos no notificados.
