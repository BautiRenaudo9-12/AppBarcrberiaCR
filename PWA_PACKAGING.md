# Empaquetado PWA → Play Store e iOS (PWABuilder)

La app ya está preparada como PWA instalable. Esta guía cubre lo que falta hacer **a mano** en
[pwabuilder.com](https://www.pwabuilder.com) y el paso obligatorio de verificación de dominio.

## Lo que ya quedó configurado en el repo

- **Manifest** (`vite.config.js` → `VitePWA.manifest`): `id`, `name`, `short_name`, `description`,
  `lang: es`, `theme_color`/`background_color` `#3E3E3E` (dark del design system), `scope`, `start_url`,
  `display: standalone`, `orientation`, `categories`, iconos `any` + `maskable`, y `screenshots`.
- **Service worker**: generado por `vite-plugin-pwa` (`dist/sw.js`) + `push-sw.js` (FCM). Registro `prompt`.
- **Iconos / assets** (`public/`): `pwa-192x192.png`, `pwa-512x512.png`, `maskable-512x512.png`,
  `apple-touch-icon.png`. Regenerables con `npm run generate:pwa-assets` (script `scripts/generate-pwa-assets.mjs`).
- **Screenshots reales** (`public/screenshots/{home,turnos,historial,login}-{mobile,desktop}.png`):
  capturadas de la app con Playwright. Regenerables con `npm run screenshots` (ver abajo).
- **index.html**: `lang="es"`, `apple-touch-icon`, metas `apple-mobile-web-app-*` para iOS standalone.
- **Digital Asset Links**: placeholder en `public/.well-known/assetlinks.json` (se copia a `dist/` →
  Netlify lo sirve en `https://barberiacr.netlify.app/.well-known/assetlinks.json`).

### Regenerar screenshots
Capturan la app corriendo e inician sesión con una cuenta de prueba (las credenciales no se commitean):

```bash
# bash
SCREENSHOT_EMAIL=cuenta@ejemplo.com SCREENSHOT_PASSWORD=tu-pass npm run screenshots
```
```powershell
# PowerShell
$env:SCREENSHOT_EMAIL='cuenta@ejemplo.com'; $env:SCREENSHOT_PASSWORD='tu-pass'; npm run screenshots
```

Setup único del navegador: `npx playwright install chromium`. Salida en `public/screenshots/`
(móvil 1080×1920, escritorio 1920×1080). Con una cuenta sin reservas, Turnos/Historial mostrarán estados
vacíos; usá una cuenta con datos si querés contenido en las capturas.

## Pasos

### 1. Desplegar los cambios
PWABuilder lee la URL **en vivo**. Hacé build + deploy a Netlify (push a `main`) y confirmá que cargan:
- `https://barberiacr.netlify.app/manifest.webmanifest`
- `https://barberiacr.netlify.app/sw.js`
- `https://barberiacr.netlify.app/.well-known/assetlinks.json`

### 2. Generar los paquetes en PWABuilder
1. Entrá a https://www.pwabuilder.com y pegá `https://barberiacr.netlify.app/`.
2. Revisá el score; debería detectar manifest + service worker + iconos correctos.
3. **Package For Stores**:
   - **Android (Google Play)**: descargá el paquete. Anotá el **Package ID** que elijas
     (ej. `app.netlify.barberiacr.twa`) y, dentro del zip, abrí `assetlinks.json` o el `signing` →
     copiá el **SHA-256 fingerprint** de la clave de firma.
   - **iOS**: descargá el proyecto Xcode (requiere Mac + cuenta Apple Developer para compilar y subir).

### 3. Verificar el dominio para Android (obligatorio para que abra sin barra de URL)
1. Editá `public/.well-known/assetlinks.json` y reemplazá:
   - `REEMPLAZAR_CON_PACKAGE_NAME` → el Package ID del paso 2.
   - `REEMPLAZAR_CON_SHA256_DE_PWABUILDER` → el SHA-256 fingerprint.
2. Volvé a desplegar a Netlify.
3. Verificá: `https://barberiacr.netlify.app/.well-known/assetlinks.json` devuelve los valores reales.

### 4. Publicar
- **Play Store**: subí el `.aab` a Google Play Console (cuenta de desarrollador, pago único USD 25).
- **iOS**: abrí el proyecto en Xcode, firmá con tu equipo y subí a App Store Connect (Apple Developer, USD 99/año).

## Notas
- Producción se sirve desde **Netlify** (`netlify.toml`, `publish = dist`). El redirect SPA `/* → /index.html`
  no afecta a archivos estáticos reales, así que `manifest.webmanifest`, `sw.js` y `.well-known/` se sirven bien.
- El `firebase deploy` (`npm run deploy`) es un despliegue secundario; los paquetes apuntan a la URL de Netlify.
