# CLAUDE.md

App de reservas de **barbería** (Barbería CR): los clientes reservan turnos y ven su historial; un panel admin gestiona turnos, clientes y anuncios. SPA web.

## Stack
React 18 + TypeScript · Vite 4 · Tailwind + Shadcn UI (Radix) · React Query (`@tanstack/react-query`) · React Router v6 · React Hook Form + Zod · Firebase (Auth + Firestore) · Netlify (hosting + functions: cron de recordatorios + push).

## Comandos
- `npm run dev` — servidor de desarrollo (Vite, `--host`).
- `npm run build` — build de producción a `dist/`.
- `npm run lint` — **roto hoy, no lo uses para verificar**: el script está limitado a `--ext js,jsx` pero `src/` es todo TypeScript (146 `.ts`/`.tsx`, 0 `.js`/`.jsx`), así que ESLint corta con `No files matching the pattern "src"` y exit 2 — nunca lintea nada. Arreglarlo (`--ext ts,tsx`) destapa los errores que hoy quedan ocultos. **Verificar con `npm run build`.**
- `npm run deploy` — **legacy de Firebase Hosting: NO es el camino a producción** (ver "Despliegue"). Buildea, copia `dist` → `firebase-public/` y corre `firebase deploy`, encadenado por los hooks `pre`/`post` de npm. Como `firebase deploy` va sin `--only`, publica también las reglas de Firestore; para reglas/índices conviene `firebase deploy --only firestore`.
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
**Producción es Netlify y se publica solo al pushear a `main`.** La integración Git de Netlify buildea (`npm run build` → `dist/`, ver `netlify.toml`) y publica sin intervención. No busques CI en el repo: no hay `.github/workflows`, la config vive en el dashboard de Netlify. Netlify sirve también las functions (`netlify/functions/*`: `check-upcoming-appointments`, `push-notification`).

**Firebase Hosting ya no se usa.** El bloque `hosting` de `firebase.json`, la carpeta `firebase-public/` y el script `npm run deploy` son remanentes de la migración y no tocan producción. De Firebase siguen vivos Auth y Firestore (reglas e índices, vía `firebase deploy --only firestore`).

**Headers de seguridad**: viven en `[[headers]]` de `netlify.toml` (`for = "/*"`). Se perdieron en la migración porque estaban en el bloque `hosting` de `firebase.json`, que Netlify no lee; ese bloque quedó como remanente y **ya no es la fuente de verdad** — editar `netlify.toml`.

Al tocar la CSP tener en cuenta:
- **Netlify no aplica custom headers a contenido proxeado**, así que `/__/auth/*` y `/__/firebase/*` se sirven con los headers de Firebase, no con los nuestros. De ahí que `frame-ancestors 'none'` no rompa el iframe de Firebase Auth.
- La CSP **no** es la de `firebase.json` tal cual: esa versión bloquea la fuente Inter (`@import` a `fonts.googleapis.com` en `src/global.css`) y `apis.google.com/js/api.js`, que el SDK de Auth carga para el login con Google. Los agregados están comentados uno por uno en `netlify.toml`.
- **HSTS no está en `netlify.toml` a propósito**: Netlify ya lo manda solo y más fuerte (`max-age=31536000; includeSubDomains; preload`).

> ⚠️ **El login con Google no funciona en los deploy preview**, y no es un bug del código: el dominio `deploy-preview-N--barberiacr.netlify.app` no está en los **authorized domains** de Firebase Auth (solo lo están `localhost`, `barberiacr.netlify.app`, `react-appbarberiacr.firebaseapp.com` y `.web.app`), así que el SDK corta con `auth/unauthorized-domain`. El error se ve como un toast genérico ("No se pudo iniciar sesión con Google") porque `Login.tsx` no loguea el `error.code`. Para probar login en un preview hay que agregar ese dominio en Firebase Console → Authentication → Settings → Authorized domains. En local funciona porque `localhost` sí está autorizado.

## UI
Las reglas de diseño (paleta dark "Apple-style", glassmorphism, tipografía, componentes) viven en `DESIGN_SYSTEM.md`. Seguir ese documento para cualquier cambio visual.
