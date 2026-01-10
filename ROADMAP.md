# Roadmap: Migración a "Mystic Hub" UI

Este documento detalla el plan paso a paso para migrar el frontend actual de "Barberia CR" (React JS + CSS Modules/Tailwind Basic) al nuevo diseño "Mystic Hub" (React TS + Shadcn UI + Tailwind Advanced).

## Fase 1: Preparación del Entorno

### 1.1. Análisis de Dependencias
El nuevo diseño utiliza un stack tecnológico más moderno y robusto. Necesitamos instalar las siguientes librerías en el proyecto raíz:
*   **Core UI:** `@radix-ui/react-*` (primitivos accesibles), `class-variance-authority`, `clsx`, `tailwind-merge`.
*   **Animación:** `framer-motion`, `tailwindcss-animate`.
*   **Iconos:** `lucide-react`.
*   **Utilidades:** `date-fns`, `react-hook-form`, `zod`.
*   **Build:** `typescript`, `@vitejs/plugin-react-swc`.

### 1.2. Configuración de TypeScript y Tailwind
*   Crear `tsconfig.json` en la raíz para soportar TypeScript.
*   Reemplazar `tailwind.config.js` con la configuración avanzada de `mystic-hub` (que incluye animaciones y variables CSS personalizadas).
*   Actualizar `vite.config.js` para soportar alias de rutas (ej: `@/components`).

## Fase 2: Migración de Archivos (Estructura)

### 2.1. Respaldo
*   Renombrar la carpeta `src` actual a `src_legacy` para mantener la lógica accesible durante la migración.

### 2.2. Importación del Nuevo Frontend
*   Copiar el contenido de `mystic-hub/client` a una nueva carpeta `src`.
*   Copiar `mystic-hub/client/global.css` y asegurar que se importa en `main.tsx`.
*   Verificar la estructura de carpetas (`components`, `pages`, `lib`, `hooks`).

## Fase 3: Integración de Lógica (El Núcleo)

El nuevo diseño es solo visual (UI). Necesitamos "inyectarle" el cerebro de la app actual (Firebase).

### 3.1. Portar Servicios (Firebase)
*   Migrar `src_legacy/services/firebaseConfig.js` a `src/lib/firebase.ts` (convertir a TS).
*   Migrar las funciones de `auth.js`, `reservations.js`, `users.js` a TypeScript en `src/services` o `src/lib`.

### 3.2. Gestión de Estado (Context)
*   Reescribir `UserContext.jsx` a `UserContext.tsx` manteniendo la lógica de `onAuthStateChanged`.
*   Reescribir `UIContext.jsx` a `UIContext.tsx` (o usar un gestor de estado global si el nuevo diseño lo sugiere, pero Context es suficiente).

### 3.3. Conexión de Páginas (Wiring)
Conectar cada página visual con sus datos reales:

*   **App.tsx:** Implementar el Router y la protección de rutas (Admin/User) basándose en el `UserContext`.
*   **Home.tsx:** Conectar con la lógica de "Próximo Turno" y navegación.
*   **Turnos.tsx:**
    *   Integrar la lógica de `getTurnos` (Firebase).
    *   Hacer funcional el selector de fechas.
    *   Implementar la lógica de reserva al hacer clic en un turno.
*   **Historial.tsx:** Conectar con `getHistory`.
*   **Profile.tsx:** Conectar con `getUserInfo` y `signOut`.
*   **Login/Register:** Si el nuevo diseño tiene páginas de auth, conectarlas con `signIn` y `signUp`. Si no, migrar las de `src_legacy` y estilizarlas.

## Fase 4: Limpieza y Despliegue

### 4.1. Verificación
*   Correr `npm run dev` y corregir errores de tipado (TypeScript errors).
*   Probar flujo completo: Login -> Reserva -> Admin -> Logout.

### 4.2. Eliminación de Legacy
*   Una vez todo funcione, eliminar `src_legacy` y la carpeta `mystic-hub`.

### 4.3. Despliegue
*   Ejecutar `npm run build` y desplegar a Firebase Hosting.
