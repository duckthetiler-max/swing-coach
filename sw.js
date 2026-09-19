// Service worker: makes Swing Coach installable and usable offline on the range.
// The app shell is fetched network-first (so a new build shows up straight away) with the
// cache as the fallback; the body tracker (wasm and models) is cache-first because those
// files never change between builds. Video is never touched: clips are gallery blobs, and
// the dev server's /clips/ range requests pass straight through.
// VERSION must match BUILD in src/app.js (a test checks it).
const VERSION = '2026-09-17.5';
const SHELL = `shell-${VERSION}`;
const HEAVY = 'tracker-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './src/app.js',
  './src/angle.js',
  './src/capture.js',
  './src/clubs.js',
  './src/coach.js',
  './src/drills.js',
  './src/events.js',
  './src/knowledge.js',
  './src/landmarks.js',
  './src/live.js',
  './src/markers.js',
  './src/metrics.js',
  './src/norms.js',
  './src/overlay.js',
  './src/pose-utils.js',
  './src/pose.js',
  './src/scale.js',
  './src/store.js',
  './src/video.js',
  './src/ui/capture.js',
  './src/ui/dom.js',
  './src/ui/history.js',
  './src/ui/home.js',
  './src/ui/howto.js',
  './src/ui/knowledge.js',
  './src/ui/processing.js',
  './src/ui/result.js',
  './src/ui/settings.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('shell-') && k !== SHELL).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range') || url.pathname.includes('/clips/')) return;
  if (/\/(models|vendor)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(HEAVY, req));
    return;
  }
  event.respondWith(networkFirst(SHELL, req));
});

async function cacheFirst(name, req) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function networkFirst(name, req) {
  const cache = await caches.open(name);
  try {
    // Always check with the server (a cheap 304 when nothing changed). GitHub Pages lets the
    // browser reuse a file for ten minutes, and a plain fetch goes through that cache, so
    // right after a deploy the page could load a mix of old and new modules. A navigation
    // request cannot be re-issued with options, so it is fetched by URL.
    const res = req.mode === 'navigate'
      ? await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      : await fetch(req, { cache: 'no-cache' });
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    throw err;
  }
}
