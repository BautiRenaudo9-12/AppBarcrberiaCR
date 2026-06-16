// Genera los iconos de la PWA (maskable y apple-touch-icon) a partir de public/logo.png.
// Las screenshots reales se generan con scripts/capture-screenshots.mjs (npm run screenshots).
// Ejecutar: node scripts/generate-pwa-assets.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')
const logo = path.join(publicDir, 'logo.png')
const BG = { r: 0x3e, g: 0x3e, b: 0x3e, alpha: 1 } // #3E3E3E (color-background)

// Icono sobre fondo de marca, con padding (logoRatio del lienzo)
async function iconOnBg(size, logoRatio, out) {
  const logoSize = Math.round(size * logoRatio)
  const resized = await sharp(logo)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, out))
  console.log('✓', out)
}

await iconOnBg(512, 0.70, 'maskable-512x512.png') // safe zone maskable (~80%)
await iconOnBg(180, 0.88, 'apple-touch-icon.png') // iOS, sin transparencia
console.log('Iconos PWA generados en public/')
