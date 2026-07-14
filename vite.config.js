import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      // Registra el Service Worker también en `npm run dev` para poder probar el
      // push de FCM en local (sin esto, navigator.serviceWorker.ready nunca resuelve
      // y el opt-in cae en "unsupported"). type 'classic' porque push-sw.js usa importScripts.
      devOptions: {
        enabled: true,
        type: 'classic',
        navigateFallback: 'index.html',
      },
      includeAssets: ['logo.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Barberia CR',
        short_name: 'BarberiaCR',
        description: 'Agenda tu turno en Barberia CR: reserva, gestiona y consulta el historial de tus cortes.',
        lang: 'es',
        dir: 'ltr',
        theme_color: '#3E3E3E',
        background_color: '#3E3E3E',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        categories: ['lifestyle', 'business'],
        prefer_related_applications: false,
        launch_handler: {
          client_mode: 'navigate-existing'
        },
        edge_side_panel: {
          preferred_width: 400
        },
        shortcuts: [
          {
            name: 'Reservar turno',
            short_name: 'Reservar',
            description: 'Agendá un nuevo turno',
            url: '/turnos',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Mi historial',
            short_name: 'Historial',
            description: 'Consultá tus cortes anteriores',
            url: '/historial',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'Mi perfil',
            short_name: 'Perfil',
            description: 'Gestioná tu cuenta',
            url: '/profile',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }]
          }
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          { src: '/screenshots/home-mobile.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Inicio' },
          { src: '/screenshots/turnos-mobile.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Reservar turno' },
          { src: '/screenshots/historial-mobile.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Historial' },
          { src: '/screenshots/login-mobile.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow', label: 'Iniciar sesión' },
          { src: '/screenshots/home-desktop.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Inicio' },
          { src: '/screenshots/turnos-desktop.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Reservar turno' },
          { src: '/screenshots/historial-desktop.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Historial' },
          { src: '/screenshots/login-desktop.png', sizes: '1920x1080', type: 'image/png', form_factor: 'wide', label: 'Iniciar sesión' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        // Firebase Auth (`/__/auth/*`) y `/api/*` deben llegar a la red (proxy de
        // Netlify / functions), no al index.html del SPA: si no, el SW devuelve el
        // index cacheado y el handler de OAuth termina en la página 404 del SPA.
        navigateFallbackDenylist: [/^\/api\//, /^\/__\//],
        importScripts: ['push-sw.js']
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

