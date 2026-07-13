# Barbería CR

App de reservas de una barbería: los clientes reservan turnos y ven su historial; un panel admin gestiona turnos, clientes y anuncios. Este documento es el glosario del lenguaje del dominio — define qué es cada término, no cómo está implementado.

## Language

**Cliente**:
Persona que reserva turnos. Se identifica por su **email** (no por un uid). Tiene perfil (nombre, teléfono) e historial.
_Avoid_: Usuario, cuenta.

**Admin**:
Quien gestiona la barbería desde el panel: turnos, clientes, anuncios y configuración. Se decide por email.
_Avoid_: Dueño, barbero (todavía no modelamos varios barberos).

**Turno**:
Una franja horaria concreta de un día (fecha + hora) que un cliente puede reservar. Los turnos disponibles se generan a partir de la configuración horaria de cada día.
_Avoid_: Slot, cita, appointment (usar "turno" en UI y conversación).

**Reserva**:
El acto y el registro de que un **cliente** tomó un **turno**. Un cliente sólo puede tener **una reserva activa** a la vez.
_Avoid_: Booking.

**Walk-in**:
Cliente que llega sin reserva y el **admin** le carga el turno a mano. No corresponde a una cuenta de cliente ni suma al historial.
_Avoid_: Sin turno, espontáneo.

**Bloqueo**:
Marca del **admin** que deja un **turno** (o un horario recurrente) no disponible para reservar, sin que haya una reserva detrás. Puede ser de un día, por semanas o permanente.
_Avoid_: Cerrado, deshabilitado.

**Sobreturno**:
Excepción del **admin** que habilita un **turno** puntual que normalmente estaría fuera de horario o bloqueado.
_Avoid_: Extra, excepción (en UI decir "sobreturno").

**Cancelación**:
Liberación de una **reserva** existente, hecha por el propio **cliente** o por el **admin**. Deja el **turno** libre otra vez.
_Avoid_: Baja, anulación.

**Lista de espera**:
Anotación de un **cliente** que quiere un **turno** en un **día** que está lleno, para que se le avise si ese día se libera alguno. Es **por día**: un cliente puede anotarse a varios días (con un tope), y cualquier **cancelación** de ese día dispara el aviso a los anotados.
_Avoid_: Cola, waitlist, reserva pendiente (no es una reserva).

## Example dialogue

> **Dev:** Si un cliente está en la lista de espera del sábado y se libera un turno el sábado, ¿queda reservado para él?
> **Experto:** No. La lista de espera no es una reserva: sólo dispara un aviso. El primero que reserve se lo queda.
> **Dev:** ¿Y si el admin cancela una reserva del sábado, también avisa?
> **Experto:** Sí. Cualquier cancelación de ese día libera el turno y avisa a los de la lista de espera de ese día, sin importar si canceló el cliente o el admin.
> **Dev:** Un walk-in que carga el admin, ¿cuenta como reserva para la lista de espera?
> **Experto:** El walk-in ocupa el turno, pero no es una reserva de un cliente con cuenta; si después se cancela, igual libera el turno y avisa.
