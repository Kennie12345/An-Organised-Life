// Service Worker — An Organised Life
// Caches app shell for offline support.
// The morning sequence must work without internet.

const CACHE_NAME = 'organised-life-v1'

// App shell: routes and static assets to cache on install
const APP_SHELL = [
  '/',
  '/today',
  '/stats',
  '/goals',
  '/history',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only intercept same-origin navigation and static asset requests
  if (url.origin !== location.origin) return

  // Network-first for API routes — always try fresh data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('{"error":"offline"}', {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }))
    )
    return
  }

  // Cache-first for app shell (navigation + static)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // Cache successful navigation responses
        if (response.ok && (request.mode === 'navigate' || request.destination === 'document')) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => {
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          return caches.match('/today')
        }
        return new Response('', { status: 503 })
      })
    })
  )
})
