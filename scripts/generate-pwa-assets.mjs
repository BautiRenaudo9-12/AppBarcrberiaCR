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

// Badge de notificacion (barra de estado de Android). Android descarta el color y
// usa solo el canal alfa, asi que esto tiene que ser una silueta: la navaja opaca
// sobre fondo transparente. El texto del logo es ilegible a 24dp, por eso se recorta
// solo la navaja (bounding box medido sobre logo.png, que es de 500x500).
const RAZOR = { left: 178, top: 72, width: 151, height: 89 }

async function notificationBadge(size, ratio, out) {
  const { data, info } = await sharp(logo)
    .extract(RAZOR)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // La luminancia del logo (navaja clara sobre circulo oscuro) pasa a ser el alfa.
  // La rampa LO..HI descarta el circulo de fondo (luminancia ~43): sin ella quedaria
  // en ~17% de alfa y Android lo pintaria como un recuadro gris alrededor de la navaja.
  const LO = 90
  const HI = 190
  const silhouette = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const t = Math.min(1, Math.max(0, (lum - LO) / (HI - LO)))
    silhouette[i] = silhouette[i + 1] = silhouette[i + 2] = 255
    silhouette[i + 3] = Math.round(t * data[i + 3])
  }

  const box = Math.round(size * ratio)
  const resized = await sharp(silhouette, { raw: { ...info, channels: 4 } })
    .resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, out))
  console.log('✓', out)
}

await iconOnBg(512, 0.70, 'maskable-512x512.png') // safe zone maskable (~80%)
await iconOnBg(180, 0.88, 'apple-touch-icon.png') // iOS, sin transparencia
await notificationBadge(96, 0.90, 'notification-badge.png') // badge Android (solo alfa)
console.log('Iconos PWA generados en public/')
