const CACHE_NAME = "vidyaschool-cache-v3"
const ASSETS_TO_CACHE = [
  "/favicon.ico",
  "/assets/vidyaschool/Logo/vidyaSG_no_bg.png",
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

  // Avoid caching browser extensions or non-HTTP protocols
  if (!event.request.url.startsWith(self.location.origin)) return

  const url = event.request.url

  // Only intercept static assets (images, fonts, static css/js chunks, favicons)
  const isStaticAsset =
    url.includes("/assets/") ||
    url.includes("/_next/static/") ||
    url.includes("/images/") ||
    url.includes("/favicon.ico")

  // Let browser network handle all page routes, Next.js RSC, APIs, and websockets natively
  if (!isStaticAsset) return

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
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return networkResponse
        })
        .catch(() => {
          return new Response("", { status: 404, statusText: "Not Found" })
        })
    })
  )
})

