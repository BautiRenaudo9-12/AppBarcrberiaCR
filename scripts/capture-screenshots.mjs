// Captura screenshots reales de la app para el manifest de la PWA.
// Arranca `vite preview` (sirve dist/), inicia sesión con Playwright y normaliza
// cada captura al tamaño exacto del manifest con sharp.
//
// Uso (requiere `dist/` ya construido — ver script npm "screenshots"):
//   SCREENSHOT_EMAIL=... SCREENSHOT_PASSWORD=... node scripts/capture-screenshots.mjs
//   PowerShell: $env:SCREENSHOT_EMAIL='...'; $env:SCREENSHOT_PASSWORD='...'; node scripts/capture-screenshots.mjs
import { preview } from 'vite'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'public', 'screenshots')
const BG = { r: 0x3e, g: 0x3e, b: 0x3e, alpha: 1 } // #3E3E3E

const EMAIL = process.env.SCREENSHOT_EMAIL
const PASSWORD = process.env.SCREENSHOT_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('❌ Faltan credenciales. Definí SCREENSHOT_EMAIL y SCREENSHOT_PASSWORD.')
  process.exit(1)
}

// Pantallas internas (requieren sesión). Login se captura aparte, sin sesión.
const TARGETS = [
  { path: '/', name: 'home' },
  { path: '/turnos', name: 'turnos' },
  { path: '/historial', name: 'historial' },
]

const FORM_FACTORS = {
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, out: { w: 1080, h: 1920 } },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, out: { w: 1920, h: 1080 } },
}

// Normaliza la captura al tamaño exacto del manifest (contain + fondo de marca).
async function normalize(buffer, out, name, factor) {
  const resized = await sharp(buffer)
    .resize(out.w, out.h, { fit: 'contain', background: BG })
    .png()
    .toFile(path.join(outDir, `${name}-${factor}.png`))
  console.log(`✓ screenshots/${name}-${factor}.png (${out.w}x${out.h})`)
  return resized
}

async function captureRoute(context, baseURL, target, factor, cfg, { login } = {}) {
  const page = await context.newPage()
  try {
    if (login) {
      await page.goto(`${baseURL}/login`, { waitUntil: 'load' })
      await page.fill('input[type="email"]', EMAIL)
      await page.fill('input[type="password"]', PASSWORD)
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname === '/', { timeout: 20000 }),
        page.getByRole('button', { name: 'Ingresar' }).click(),
      ])
    }
    await page.goto(`${baseURL}${target.path}`, { waitUntil: 'load' })
    await page.waitForTimeout(1500) // asentar layout + datos de Firestore
    const buffer = await page.screenshot({ clip: { x: 0, y: 0, ...cfg.viewport } })
    await normalize(buffer, cfg.out, target.name, factor)
  } finally {
    await page.close()
  }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const server = await preview({ preview: { port: 4173, host: '127.0.0.1' } })
  const baseURL = server.resolvedUrls.local[0].replace(/\/$/, '')
  console.log('▶ preview en', baseURL)

  const browser = await chromium.launch()
  try {
    for (const [factor, cfg] of Object.entries(FORM_FACTORS)) {
      const context = await browser.newContext({
        viewport: cfg.viewport,
        deviceScaleFactor: cfg.deviceScaleFactor,
        isMobile: cfg.isMobile,
        reducedMotion: 'reduce', // desactiva las intros GSAP (prefersReducedMotion)
      })

      // Login primero, sin sesión.
      await captureRoute(context, baseURL, { path: '/login', name: 'login' }, factor, cfg)

      // Iniciar sesión una vez y reutilizar el contexto para las internas.
      const loginPage = await context.newPage()
      await loginPage.goto(`${baseURL}/login`, { waitUntil: 'load' })
      await loginPage.fill('input[type="email"]', EMAIL)
      await loginPage.fill('input[type="password"]', PASSWORD)
      await Promise.all([
        loginPage.waitForURL((url) => new URL(url).pathname === '/', { timeout: 20000 }),
        loginPage.getByRole('button', { name: 'Ingresar' }).click(),
      ])
      await loginPage.close()

      for (const target of TARGETS) {
        await captureRoute(context, baseURL, target, factor, cfg)
      }

      await context.close()
    }
  } finally {
    await browser.close()
    await server.httpServer.close()
  }
  console.log('Screenshots generadas en public/screenshots/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
