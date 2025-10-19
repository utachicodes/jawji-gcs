self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    self.skipWaiting()
  })())
})

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    clients.claim()
  })())
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

self.addEventListener("fetch", (event) => {
  // Network-first for now to avoid stale control data; customize if needed.
  event.respondWith((async () => {
    try {
      return await fetch(event.request)
    } catch (e) {
      return new Response("offline", { status: 200, headers: { "Content-Type": "text/plain" } })
    }
  })())
})
