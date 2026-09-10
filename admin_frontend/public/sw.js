const CACHE_NAME = "vidyaschool-cache-v2"
const ASSETS_TO_CACHE = [
  "/favicon.ico",
  "/assets/vidyaschool/Logo/no_title.svg",
  "/assets/vidyaschool/Logo/Full_circle_logo.webp",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return

  // Never cache HTML navigations — stale pages break Next.js routing and HMR
  if (event.request.mode === "navigate") return

  // Avoid caching browser extensions or non-HTTP protocols (e.g. chrome-extension://)
  if (!event.request.url.startsWith(self.location.origin)) return

  // Bypass API, Next.js dev/build assets, and WebSockets
  if (
    event.request.url.includes("/api/") ||
    event.request.url.includes("/socket.io") ||
    event.request.url.includes("/_next/")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new version in background (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse)
              })
            }
          })
          .catch(() => {
            /* ignore background fetch errors */
          })

        return cachedResponse
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Dynamically cache static files (images, CSS/JS chunks, fonts)
          const isStaticAsset =
            event.request.url.includes("/assets/") ||
            event.request.url.includes("/_next/static/") ||
            event.request.url.includes("/images/")

          if (networkResponse.status === 200 && isStaticAsset) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return networkResponse
        })
        .catch(() => new Response("Offline", { status: 503 }))
    })
  )
})
