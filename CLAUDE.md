# CLAUDE.md

App de reservas de **barbería** (Barbería CR): los clientes reservan turnos y ven su historial; un panel admin gestiona turnos, clientes y anuncios. SPA web.

## Stack
React 18 + TypeScript · Vite 4 · Tailwind + Shadcn UI (Radix) · React Query (`@tanstack/react-query`) · React Router v6 · React Hook Form + Zod · Firebase (Auth + Firestore) · Netlify (hosting + functions: cron de recordatorios + push).

## Comandos
- `npm run dev` — servidor de desarrollo (Vite, `--host`).
- `npm run build` — build de producción a `dist/`.
- `npm test` — vitest sobre la lógica pura (normalización de teléfonos para WhatsApp, grilla de horarios, token HMAC de confirmación). `npm run test:watch` para desarrollo. **Verificar con `npm run build` + `npm test`.**
- **Reglas de Firestore**: se prueban con el emulador, no con vitest. `npx tsc --noEmit` **no** cubre `netlify/functions/` (el tsconfig solo incluye `src`); para chequearlas hay que pasarle esos archivos a mano.
- `npm run lint` — **roto hoy, no lo uses para verificar**: el script está limitado a `--ext js,jsx` pero `src/` es todo TypeScript (146 `.ts`/`.tsx`, 0 `.js`/`.jsx`), así que ESLint corta con `No files matching the pattern "src"` y exit 2 — nunca lintea nada. Arreglarlo (`--ext ts,tsx`) destapa los errores que hoy quedan ocultos. `npx tsc --noEmit` tampoco sirve de portón: arrastra ~42 errores preexistentes (componentes de shadcn que importan paquetes de Radix no instalados, imports sin usar).
- **No hay script de deploy**: producción se publica sola al pushear a `main` (ver "Despliegue"). Los scripts `deploy`/`predeploy`/`postdeploy` y la carpeta `firebase-public/` se eliminaron el 2026-07-16 por ser legacy de Firebase Hosting.
- `firebase deploy --only firestore` — publica reglas e índices de Firestore (lo único que queda de Firebase CLI). **Nunca con `--force`**: los índices que existan en el proyecto pero no estén declarados en `firestore.indexes.json` se borran sin preguntar. Sin el índice `appointments (date, status)` —el que usa `getAppointmentsByDate`, la query que arma la grilla— se caen `/turnos` y `/lista-turnos` enteros hasta que Firestore lo reconstruya. Si el deploy pregunta si querés borrar índices, la respuesta es NO, y después hay que agregar a mano al archivo el que reportó.
- Dev con functions de Netlify: ver `netlify.toml` (puerto 8888).

## Arquitectura y convenciones
- **Servicios modulares** en `src/services/*` (`auth`, `users`, `reservations`, `notifications`, `announcements`, `admin`, `appointments`, `blocks`). Los componentes llaman a estas funciones — **no** usar el SDK de Firebase directo en componentes. `src/services/index.ts` solo re-exporta.
- **Estado servidor** vía React Query; hooks en `src/hooks/use*` (`useTurnos`, `useClients`, `useAnnouncements`, `useUserQuery`, `useFcmToken`).
- **Firestore** (modelo real):
  - **Reservas (flujo activo): colección `appointments/{dateStr_HH-mm}`** — ID determinista (`2026-01-16_10-00`) para evitar doble-booking; creación con `runTransaction` en `src/services/appointments.ts`. Campos: `date` (`YYYY-MM-DD`), `time` (`HH:mm`), `timestamp`, `clientEmail`, `clientName`, `status` (`confirmed|cancelled|completed|blocked`). Disponibilidad combinada con `blocked_slots` y `slot_exceptions` (`src/services/blocks.ts`).
  - `turnos/{dia}` — **solo config del día** (horario `desde`/`hasta`, `intervalo`, `activo`, `index`). `{dia}` es el nombre del día en español sin tildes y en minúsculas, mapeado con `arrayDias` vía `moment(...).format("d")`. `useTurnos` genera slots virtuales desde esta config. La subcolección `turnos/{dia}/turnos/{id}` es del modelo legacy y ya no se usa para reservar.
  - `clientes/{email}` — el ID del doc es el **email**, no un uid. Guarda perfil (`name`, `nro`, `keywords`), `fcmToken`/`notifEnabled`, y subcolección `history/{appointmentId}` (historial de reservas: se **suma** una entrada al reservar — dentro de la misma transacción que crea el turno — y se **resta** al cancelar, sea el cliente o el admin; el id de la entrada coincide con el del turno en `appointments`). Solo se registran reservas de clientes reales, no las que hace el admin para walk-ins. Nota: el campo legacy `reserve` ya no se usa.
- **Auth**: `firebase/auth` + `onAuthStateChanged` en `src/context/UserContext.tsx`. **Admin se decide por email** comparando con `VITE_ADMIN_EMAILS` (array JSON) en el cliente (ver memoria `admin-auth-risk`); la seguridad real depende de `firestore.rules`.
- **Config/env**: variables `VITE_*` en `.env` → `import.meta.env`, validadas con Zod en `src/lib/env.ts` (`VITE_ADMIN_EMAILS`, `VITE_VAPID_KEY`, `VITE_FIREBASE_CONFIG`).
- **Firebase init**: `src/lib/firebase.ts` (alias `@/` → `src/`).
- **Despliegue**: ver sección "Despliegue" más abajo. Firebase quedó solo como Auth + Firestore; el hosting es Netlify.

## Despliegue
**Producción es Netlify y se publica solo al pushear a `main`.** La integración Git de Netlify buildea (`npm run build` → `dist/`, ver `netlify.toml`) y publica sin intervención. No busques CI en el repo: no hay `.github/workflows`, la config vive en el dashboard de Netlify. Netlify sirve también las functions (`netlify/functions/*`):
- `check-upcoming-appointments` — cron (cada 10 min): recordatorio de turno ~1h antes. Incluye token HMAC para confirmar asistencia desde el push.
- `nudge-reengagement` — cron (diario): recordatorio de re-reserva ("ya te toca"). Ver `docs/adr/0003`.
- `notify-waitlist` — la llama el browser al liberarse un turno; avisa a la lista de espera del día. Ver `docs/adr/0002`.
- `confirm-appointment` — la llama el service worker al tocar "Confirmar" en el push de recordatorio (valida el HMAC).
- `shared/*` — init del Admin SDK, lookup de turnos activos y limpieza de tokens FCM muertos, compartidos entre las de arriba.

Los dos cron se disparan desde un scheduler externo con header `x-api-key: <CRON_SECRET>` (no hay `netlify.toml [functions]` schedule).

**Firebase Hosting ya no se usa.** La carpeta `firebase-public/`, la caché `.firebase/` y los scripts `deploy`/`predeploy`/`postdeploy` se eliminaron el 2026-07-16. De Firebase siguen vivos Auth y Firestore (reglas e índices, vía `firebase deploy --only firestore`).

> ⚠️ **Headers de seguridad: portados a `netlify.toml`, con la CSP todavía en Report-Only.** Se habían perdido en la migración (seguían solo en el bloque `hosting` de `firebase.json`, que Netlify no lee). Hoy `[[headers]]` en `netlify.toml` sirve `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Strict-Transport-Security` y `Permissions-Policy` ya aplicando.
>
> Dos cosas pendientes:
> - **La CSP va como `Content-Security-Policy-Report-Only`**: reporta violaciones en la consola pero no bloquea nada. Para activarla hay que navegar producción (incluido el login con Google, que es lo más frágil), confirmar que no aparecen violaciones y recién ahí renombrar el header a `Content-Security-Policy`.
> - **`X-Frame-Options` es `SAMEORIGIN`, no `DENY`** como en `firebase.json`: el login por redirect usa un iframe en `/__/auth/`, que en Netlify es un proxy de nuestro propio dominio (en Firebase Hosting esas rutas eran reservadas y no pasaban por esta config). Con `DENY` el login de mobile/PWA se rompe.
>
> El bloque `hosting` de `firebase.json` se puede borrar una vez que la CSP quede aplicando (ahí `firebase deploy` pasa a tocar solo Firestore).

## UI
Las reglas de diseño (paleta dark "Apple-style", glassmorphism, tipografía, componentes) viven en `DESIGN_SYSTEM.md`. Seguir ese documento para cualquier cambio visual.
