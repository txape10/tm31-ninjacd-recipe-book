import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Páginas de recetas — network first con fallback a cache (7 días)
      {
        urlPattern: /^https?:\/\/.*\/recetas(\/.*)?$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pages-recetas',
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
          networkTimeoutSeconds: 10,
        },
      },
      // APIs GET — network first con fallback (1 hora)
      {
        urlPattern: /^https?:\/\/.*\/api\/recipes(\/.*)?\??.*/,
        method: 'GET',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-recipes',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
          networkTimeoutSeconds: 8,
        },
      },
      // Assets estáticos Next.js — cache first (30 días)
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      // Imágenes de la app (iconos, splash, fotos de receta) — cache first (7 días)
      {
        urlPattern: /\.(png|jpg|jpeg|webp|avif|svg|ico)(\?.*)?$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
      // Fuentes Google — stale while revalidate (1 año)
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  turbopack: {},
}

export default withPWA(nextConfig)
