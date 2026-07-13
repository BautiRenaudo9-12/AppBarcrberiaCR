# La lista de espera es solo-aviso y por día

La **lista de espera** notifica, no reserva: cuando se libera un turno de un día, avisa a los anotados de ese día y el primero que reserva se lo queda (no se retiene ni se auto-asigna el turno). La granularidad es **por día** (no por hora ni semanal), y un cliente puede anotarse a varios días con un tope (~3).

## Por qué

Con push automático, la **relevancia es supervivencia**: si a la gente le llegan avisos de turnos que no quería, apaga las notificaciones y la feature muere. Por día es el punto justo entre precisión (el aviso siempre corresponde a un día que el cliente eligió), simpleza (se anota con un tap desde el selector de fecha cuando el día está lleno) y hit-rate (cualquier hueco de ese día dispara). Semanal maximiza hit-rate pero mata la relevancia; por-hora casi nunca dispara. Retener/auto-asignar el turno se descartó por complejidad y porque el modelo de "una reserva activa" ya resuelve el conflicto en el momento de reservar.

## Consecuencias

- Solo pueden anotarse clientes **sin reserva activa** (es quien llega al flujo de reserva; ver `HomeMenu` `canReserve`).
- Al reservar (por aviso o normal) se borran las entradas de lista de espera del cliente; las de días pasados expiran.
- No cubre "quiero el sábado a la mañana" como filtro fino: cualquier hueco del sábado avisa.
