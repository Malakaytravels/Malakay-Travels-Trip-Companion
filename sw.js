/* ============================================================
   MALAKAY TRAVELS — service worker
   Cache key: malakay-v56

   Bump CACHE on every deploy. If you do not, phones that already
   have the app saved will keep serving the old version from disk
   and never see the change.
   ============================================================ */

const CACHE = "malakay-v56";

/* The shell: everything that is the same for every trip. */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./coral.png",

  /* Leaflet and the fonts are served from our own origin rather than a CDN,
     so they can be cached here. Without this the MAP tab has no library to
     draw with offline, and the app falls back to system fonts. */
  "./vendor/leaflet.js",
  "./vendor/leaflet.css",
  "./vendor/fonts.css",

  /* World coastlines — what the map falls back to when tiles cannot load. */
  "./vendor/images/layers-2x.png",
  "./vendor/images/layers.png",
  "./vendor/images/marker-icon-2x.png",
  "./vendor/images/marker-icon.png",
  "./vendor/images/marker-shadow.png",

  "./vendor/fonts/archivo-latin-500-normal.woff2",
  "./vendor/fonts/archivo-latin-700-normal.woff2",
  "./vendor/fonts/archivo-latin-800-normal.woff2",
  "./vendor/fonts/archivo-latin-ext-500-normal.woff2",
  "./vendor/fonts/archivo-latin-ext-700-normal.woff2",
  "./vendor/fonts/archivo-latin-ext-800-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-400-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-500-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-600-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-ext-400-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-ext-500-normal.woff2",
  "./vendor/fonts/ibm-plex-mono-latin-ext-600-normal.woff2",
  "./vendor/fonts/karla-latin-400-italic.woff2",
  "./vendor/fonts/karla-latin-400-normal.woff2",
  "./vendor/fonts/karla-latin-500-normal.woff2",
  "./vendor/fonts/karla-latin-700-normal.woff2",
  "./vendor/fonts/karla-latin-ext-400-italic.woff2",
  "./vendor/fonts/karla-latin-ext-400-normal.woff2",
  "./vendor/fonts/karla-latin-ext-500-normal.woff2",
  "./vendor/fonts/karla-latin-ext-700-normal.woff2"
];

/* Trip photos. Hotel and hero images are part of what the traveller
   looks at on the boat, so they are precached rather than fetched on
   demand — otherwise only the pictures someone happened to scroll past
   while online survive the flight. Each is allowed to fail so a photo
   that has not been shot yet cannot stop the app installing. */
const EXTRAS = [
  "./land.bin"
];

const PHOTOS = [
  "./img/hero-bangkas.jpg",
  "./img/hero-coron.jpg",
  "./img/hero-elnido.jpg",
  "./img/hero-fuji.jpg",
  "./img/hero-jacks.jpg",
  "./img/hero-thresher.jpg",
  "./img/hero-torii-gate.jpg",
  "./img/hero-torii-path.jpg",
  "./img/hero-valley.jpg",
  "./img/michal.jpg",
  "./img/stay-cebu.jpg",
  "./img/stay-coron.jpg",
  "./img/stay-dauin.jpg",
  "./img/stay-elnido.jpg",
  "./img/stay-hakone.jpg",
  "./img/stay-kyoto.jpg",
  "./img/stay-malapascua.jpg",
  "./img/stay-manila.jpg",
  "./img/stay-moalboal.jpg",
  "./img/stay-osaka.jpg",
  "./img/stay-tokyo.jpg"
];

/* Trip content. Precached so a traveller who opens their own link
   once, at home, has it on the phone before they lose signal.
   Add a line here for every new departure. */
const TRIPS = [
  "./trips/cebu-nov26.json",
  "./trips/palawan-nov26.json",
  "./trips/japan-dec26.json",
  "./trips/palawan-nye.json"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* The shell must cache or the install fails. Trip files are added
       one at a time and allowed to fail — a departure that has not been
       written yet must not stop the app installing. */
    await c.addAll(SHELL);
    /* Everything below is fetched a few at a time, not all at once. Firing
       twenty-odd downloads plus a five-megabyte file in parallel was enough
       for some to fail on a phone, and a silent failure here shows up much
       later as a blank photo on a boat. Each is allowed to fail so one
       missing file cannot abort the install. */
    const soft = TRIPS.concat(PHOTOS).concat(EXTRAS);
    for(let i = 0; i < soft.length; i += 4){
      await Promise.all(soft.slice(i, i + 4).map(u => c.add(u).catch(() => {})));
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   /* weather, tiles and outbound links are left alone */

  /* Trip JSON: network first, so a corrected itinerary reaches the
     phone as soon as there is signal; cache is the fallback offline. */
  if(url.pathname.includes("/trips/") || url.pathname.includes("/docs/")){
    e.respondWith((async () => {
      try{
        const fresh = await fetch(req);
        if(fresh && fresh.ok){
          const c = await caches.open(CACHE);
          c.put(req, fresh.clone());
        }
        return fresh;
      }catch(err){
        const hit = await caches.match(req);
        if(hit) return hit;
        throw err;
      }
    })());
    return;
  }

  /* Everything else: cache first. This is what makes the app work
     on a boat with no signal. */
  e.respondWith((async () => {
    const hit = await caches.match(req);
    if(hit) return hit;
    try{
      const fresh = await fetch(req);
      if(fresh && fresh.ok && url.origin === self.location.origin){
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
      }
      return fresh;
    }catch(err){
      /* A navigation that misses the cache still gets the shell,
         which can then load its trip from the cache. */
      if(req.mode === "navigate"){
        const shell = await caches.match("./index.html");
        if(shell) return shell;
      }
      throw err;
    }
  })());
});
