// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Service Worker (offline support)
//
// SAFETY-FIRST caching for a children's-home care platform:
//   • App SHELL (navigations) → network-first, falling back to a clear offline page.
//     Always fetches fresh HTML when online (so new deploys are picked up).
//   • STATIC assets (/_next/static, icons, fonts — content-hashed, immutable)
//     → cache-first (fast, offline-capable).
//   • /api/ DATA → NETWORK-ONLY, never cached. We must never show stale safeguarding,
//     medication or staffing data as if it were current. Offline ⇒ data simply
//     doesn't load and the app's offline banner makes that explicit.
//
// Bump VERSION to invalidate caches on a breaking change.
// ══════════════════════════════════════════════════════════════════════════════

const VERSION = "v1";
const SHELL_CACHE = `cs-shell-${VERSION}`;
const STATIC_CACHE = `cs-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("cs-") && !k.endsWith(VERSION)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|ico|webp|webmanifest)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never touch writes

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // same-origin only

  // ── /api/ → network-only (NEVER cache live care data) ──
  if (url.pathname.startsWith("/api/")) return;

  // ── Navigations → network-first, fall back to the offline page ──
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return offline || new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  // ── Static assets → cache-first (immutable, content-hashed) ──
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || new Response("", { status: 504 });
        }
      })(),
    );
  }
});
