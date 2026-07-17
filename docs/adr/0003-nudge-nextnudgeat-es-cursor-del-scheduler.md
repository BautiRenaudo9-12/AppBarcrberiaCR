# `nextNudgeAt` es el cursor del scheduler, y todo candidato evaluado se reprograma

El cron de re-reserva (`netlify/functions/nudge-reengagement`) toma candidatos con una query de cola: `nextNudgeAt <= now`, ordenada ascendente, con tope por corrida. La regla que la sostiene es: **todo candidato que el cron evalúa se reprograma, lo haya nudgeado o no.** Quien recibió el push se corre `THROTTLE_DAYS`; a quien se salteó (sin push, menos de `MIN_VISITS`, ya tiene turno) solo se le mueve el cursor `RECHECK_DAYS`, sin tocar `lastNudgedAt`.

Por lo tanto `nextNudgeAt` **no es la fecha en que al cliente "le toca"**: es el próximo momento en que el cron lo va a mirar. Ya era así antes de esta decisión —tras un nudge vale `now + THROTTLE_DAYS`, que no tiene relación con el intervalo de visitas—, pero no estaba dicho en ningún lado.

## Por qué

Sin esa regla, la cola se tapaba. `src/services/appointments.ts` agenda `nextNudgeAt` en cada reserva de un cliente real, **sin mirar si tiene push**, y nadie lo borra nunca. Los candidatos que nunca son elegibles —los que jamás activaron notificaciones, que son la mayoría, y los que tienen exactamente 2 visitas cuando `MIN_VISITS` es 3— quedaban con el cursor en el pasado para siempre. Como la query ordena ascendente y corta en `QUERY_LIMIT`, esos se clavaban en los primeros puestos: bloqueo de cabeza de fila. Al superar el tope, el cron pasaba a leer solo inelegibles y **dejaba de notificar a todo el mundo, en silencio**.

Se evaluaron dos alternativas:

- **Denormalizar un flag `nudgeEligible` y filtrarlo en la query** (con índice compuesto nuevo). Evita las lecturas desperdiciadas, pero obliga a mantener el flag en los ~6 sitios que tocan `fcmToken`/`notifEnabled`/`visitCount`; si uno se olvida, el bug vuelve sin hacer ruido.
- **No encolar de entrada** (escribir `nextNudgeAt` solo si el cliente ya tiene push). Deja afuera a quien activa push *después* de su última reserva — justo el target de la feature.

Reprogramar al saltear no necesita índice, ni flag, ni cambios en el cliente, y es robusto a cualquier motivo de salteo que se agregue en el futuro: no hay nada que recordar mantener.

## Consecuencias

- **Se auto-cura**: si un cliente activa push, el recheck lo levanta en `RECHECK_DAYS` sin que ningún opt-in tenga que recalcular nada. Ese es el motivo de que el recheck sea corto y no `THROTTLE_DAYS`.
- Se gastan lecturas y escrituras en clientes que quizá nunca sean elegibles, acotadas por `QUERY_LIMIT` por corrida. Si esa población llegara a dominar el presupuesto, ahí sí conviene el flag denormalizado: la cola seguiría rotando (nadie se muere de hambre), pero los nudges reales saldrían con demora.
- Los candidatos que quedan afuera por `MAX_SENDS` **no** se reprograman: el `break` corta antes de evaluarlos, así conservan su cursor y encabezan la corrida siguiente.
- Un envío fallido por token muerto se reprograma como salteado (si no, se clava en la cabeza de la fila). Un error transitorio no toca nada y se reintenta mañana.
- El tope por corrida se cuenta sobre envíos **disparados**, no entregados: los `.then` no corren hasta después del bucle.
- Los agregados (`visitCount`/`firstVisit`/`lastVisit`/`nextNudgeAt`) se mantienen incrementales **al reservar**, pero **al cancelar se recalculan desde `history`** (`recalcNudgeAggregates` en `src/services/appointments.ts`): un agregado incremental no se puede invertir sin saber cuál pasa a ser la última visita, y eso solo lo dice el historial. Es O(N) sobre el historial de un solo cliente y solo en la cancelación — el cron sigue sin leer historiales, que era el punto del diseño incremental.
- La fórmula del intervalo (`nextNudgeFrom`) vive en un solo lugar porque la comparten los dos caminos (reserva incremental y recálculo); duplicarla los haría derivar en silencio.
- **El intervalo medio va acotado a [14, 120] días.** El promedio crudo no sirve solo: con reservas juntas (reservó, canceló y volvió a reservar el mismo día) da horas y el cliente queda vencido para siempre — apareció de verdad en el backfill del 2026-07-16, con un cliente cuyo promedio dio 12 horas. La cota superior es una decisión de producto, no un arreglo: a los cuatro meses consideramos dormido a un cliente aunque su patrón real sea más largo.
- **Hay tope de insistencia: `MAX_NUDGES_WITHOUT_VISIT`.** `THROTTLE_DAYS` limita la frecuencia pero no el total; sin tope, quien no vuelve nunca recibiría un push cada 21 días para siempre, que es exactamente lo que mata la feature (ver [0001](0001-waitlist-notification-only-per-day.md): quien recibe avisos que no quiere apaga las notificaciones y pierde también los recordatorios de turno). El contador `nudgeStreak` se incrementa al enviar y lo reinicia **reservar**, que es la señal de que volvió. Al agotarse **se borra `nextNudgeAt`**: saltearlo no alcanzaba, lo habría dejado rotando en la cola para siempre.
