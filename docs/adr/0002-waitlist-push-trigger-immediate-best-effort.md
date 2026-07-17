# Disparo del aviso de lista de espera: inmediato best-effort desde el cliente

Cuando se libera un turno, el propio browser llama a una **Netlify Function nueva** que verifica el ID token de Firebase y hace el fan-out de push (FCM) a los anotados en la lista de espera de ese día, leyendo los `fcmToken` con el Admin SDK. Se eligió esto por sobre Firebase Cloud Functions (trigger de Firestore) y por sobre un barrido programado que procese un log de cancelaciones.

Liberan un turno, y por lo tanto disparan el aviso:

- una **cancelación**, la haga el cliente o el admin (es un `deleteDoc` en el browser);
- un **sobreturno** que crea el admin, y solo cuando se crea de verdad: `addBlockException` es idempotente y no vuelve a avisar si la excepción ya existía.

Quedan afuera a propósito los caminos que liberan turnos de forma masiva o indirecta: borrar una regla de bloqueo (una regla recurrente abre un turno en muchos días de golpe) y levantar un cierre por rango. Avisar ahí exigiría un fan-out por cada día afectado, y el aviso llegaría por un turno que el admin abrió como efecto colateral de otra cosa.

## Por qué

El proyecto no usa Cloud Functions (está en Firebase Hosting + Netlify Functions), y el push necesita el Admin SDK server-side. La opción inmediata es la más simple y de menor latencia, reusa el patrón de la function de cron existente, y no agrega infraestructura nueva más allá de un endpoint. El costo aceptado: si el usuario cierra la pestaña justo al cancelar, ese aviso puede perderse (best-effort).

## Consecuencias

- La function debe protegerse contra abuso: verificar identidad y aplicar throttle por destinatario (nadie recibe más de un aviso por ventana de tiempo), y saltear a clientes con reserva activa.
- El throttle se escribe **después** del envío y solo para los destinatarios que lo recibieron: marcarlo antes silenciaba durante toda la ventana a quien no había recibido nada (token muerto, error transitorio).
- Si FCM responde que el token está muerto, la function borra `fcmToken` del perfil — nunca `notifEnabled`, que es la preferencia del cliente y lo que sostiene el opt-out. El cliente re-registra un token nuevo en su próxima visita.
- Camino de endurecimiento futuro sin rehacer: escribir un evento "turno liberado" al cancelar y agregar un barrido programado de respaldo que procese los eventos no notificados.
