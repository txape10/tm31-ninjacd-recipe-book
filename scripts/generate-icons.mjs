/**
 * Genera los iconos PWA y splash screens usando sharp.
 * Uso: node scripts/generate-icons.mjs
 * Requiere: npm install -D sharp
 */

import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

mkdirSync(join(root, 'public/icons'), { recursive: true })
mkdirSync(join(root, 'public/splash'), { recursive: true })

// SVG del icono: fondo navy + cuadrado cyan redondeado + letra R
function iconSvg(size) {
  const pad = Math.round(size * 0.12)
  const inner = size - pad * 2
  const r = Math.round(inner * 0.22)
  const fontSize = Math.round(size * 0.38)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1a1a2e"/>
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" fill="#0ea5e9"/>
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">R</text>
</svg>`)
}

// SVG maskable: sin padding externo (área de seguridad es el 80% central)
function maskableSvg(size) {
  const fontSize = Math.round(size * 0.38)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0ea5e9"/>
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">R</text>
</svg>`)
}

// SVG splash: fondo navy + logo centrado + nombre
function splashSvg(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.18)
  const pad = Math.round(iconSize * 0.14)
  const inner = iconSize - pad * 2
  const rx = Math.round(inner * 0.22)
  const fontSize = Math.round(iconSize * 0.38)
  const textSize = Math.round(iconSize * 0.28)
  const subTextSize = Math.round(iconSize * 0.17)
  const cx = width / 2
  const cy = height / 2

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#1a1a2e"/>
  <!-- icono -->
  <rect x="${cx - iconSize / 2}" y="${cy - iconSize * 0.9}" width="${iconSize}" height="${iconSize}" rx="${Math.round(iconSize * 0.22)}" fill="#0ea5e9"/>
  <text x="${cx}" y="${cy - iconSize * 0.9 + iconSize * 0.58}" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">R</text>
  <!-- nombre -->
  <text x="${cx}" y="${cy + iconSize * 0.3}" font-family="system-ui, -apple-system, sans-serif" font-size="${textSize}" font-weight="700" fill="white" text-anchor="middle">Recetario</text>
  <text x="${cx}" y="${cy + iconSize * 0.62}" font-family="system-ui, -apple-system, sans-serif" font-size="${subTextSize}" font-weight="400" fill="#94a3b8" text-anchor="middle">Ninja CREAMi Deluxe</text>
</svg>`)
}

const icons = [96, 128, 192, 256, 384, 512]

async function main() {
  // Iconos estándar
  for (const size of icons) {
    const dest = join(root, `public/icons/icon-${size}x${size}.png`)
    await sharp(iconSvg(size)).png().toFile(dest)
    console.log(`✓ icon-${size}x${size}.png`)
  }

  // Icono maskable
  await sharp(maskableSvg(512)).png().toFile(join(root, 'public/icons/maskable-512x512.png'))
  console.log('✓ maskable-512x512.png')

  // Splash screens
  await sharp(splashSvg(1125, 2436)).png().toFile(join(root, 'public/splash/iphone.png'))
  console.log('✓ splash/iphone.png (1125×2436)')

  await sharp(splashSvg(1668, 2224)).png().toFile(join(root, 'public/splash/ipad.png'))
  console.log('✓ splash/ipad.png (1668×2224)')

  console.log('\nIconos generados en public/icons/ y public/splash/')
}

main().catch(err => { console.error(err); process.exit(1) })
