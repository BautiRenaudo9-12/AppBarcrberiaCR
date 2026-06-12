# CLAUDE.md

App de reservas de **barbería** (Barbería CR): los clientes reservan turnos y ven su historial; un panel admin gestiona turnos, clientes y anuncios. SPA web.

## Stack
React 18 + TypeScript · Vite 4 · Tailwind + Shadcn UI (Radix) · React Query (`@tanstack/react-query`) · React Router v6 · React Hook Form + Zod · Firebase (Auth + Firestore + Hosting) · Netlify Functions (cron de recordatorios + push).

## Comandos
- `npm run dev` — servidor de desarrollo (Vite, `--host`).
- `npm run build` — build de producción a `dist/`.
- `npm run lint` — ESLint sobre `src` (0 warnings permitidos).
- `npm run deploy` — copia `dist` → `firebase-public` y `firebase deploy`.
- Dev con functions de Netlify: ver `netlify.toml` (puerto 8888).

## Arquitectura y convenciones
- **Servicios modulares** en `src/services/*` (`auth`, `users`, `reservations`, `notifications`, `announcements`, `admin`, `appointments`, `blocks`). Los componentes llaman a estas funciones — **no** usar el SDK de Firebase directo en componentes. `src/services/index.ts` solo re-exporta.
- **Estado servidor** vía React Query; hooks en `src/hooks/use*` (`useTurnos`, `useClients`, `useAnnouncements`, `useUserQuery`, `useFcmToken`).
- **Firestore** (modelo real):
  - `clientes/{email}` — el ID del doc es el **email**, no un uid. Campo `reserve` con la reserva activa; subcolección `history/{reserveId}`.
  - `turnos/{dia}/turnos/{turnoId}` — `{dia}` es el nombre del día en español en minúsculas. La fecha se mapea con `arrayDias` (`["Domingo","Lunes",...]`) usando `moment(...).format("d")`. El doc `turnos/{dia}` guarda la config del día.
- **Auth**: `firebase/auth` + `onAuthStateChanged` en `src/context/UserContext.tsx`. **Admin se decide por email** comparando con `VITE_ADMIN_EMAIL` en el cliente (ver memoria `admin-auth-risk`); la seguridad real depende de `firestore.rules`.
- **Config/env**: variables `VITE_*` en `.env` → `import.meta.env`, validadas con Zod en `src/lib/env.ts` (`VITE_ADMIN_EMAIL`, `VITE_VAPID_KEY`, `VITE_FIREBASE_CONFIG`).
- **Firebase init**: `src/lib/firebase.ts` (alias `@/` → `src/`).
- **Despliegue doble**: Firebase Hosting (hosting estático) + Netlify (`netlify/functions/*` para `check-upcoming-appointments` y `push-notification`).

## UI
Las reglas de diseño (paleta dark "Apple-style", glassmorphism, tipografía, componentes) viven en `DESIGN_SYSTEM.md`. Seguir ese documento para cualquier cambio visual.
