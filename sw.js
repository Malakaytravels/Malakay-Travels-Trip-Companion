/* ============================================================
   MALAKAY TRAVELS — service worker
   Cache key: malakay-v100

   Bump CACHE on every deploy. If you do not, phones that already
   have the app saved will keep serving the old version from disk
   and never see the change.
   ============================================================ */

const CACHE = "malakay-v100";

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

  "./vendor/fonts/outfit-latin-ext-400-normal.woff2",
  "./vendor/fonts/outfit-latin-400-normal.woff2",
  "./vendor/fonts/outfit-latin-ext-500-normal.woff2",
  "./vendor/fonts/outfit-latin-500-normal.woff2",
  "./vendor/fonts/outfit-latin-ext-600-normal.woff2",
  "./vendor/fonts/outfit-latin-600-normal.woff2",
  "./vendor/fonts/outfit-latin-ext-700-normal.woff2",
  "./vendor/fonts/outfit-latin-700-normal.woff2",
  "./vendor/fonts/outfit-latin-ext-800-normal.woff2",
  "./vendor/fonts/outfit-latin-800-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-ext-400-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-400-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-ext-500-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-500-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-ext-600-normal.woff2",
  "./vendor/fonts/jetbrains-mono-latin-600-normal.woff2"
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
  "./img/day-warsaw.jpg",
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
  "./img/stay-tokyo.jpg",
  "./img/day-cebu-coast.jpg",
  "./img/day-cebu-hills.jpg",
  "./img/day-cebu-kawasan.jpg",
  "./img/day-coron-lagoons.jpg",
  "./img/day-coron-tapyas.jpg",
  "./img/day-coron-twinlagoon.jpg",
  "./img/day-dauin-beach.jpg",
  "./img/day-dauin-coast.jpg",
  "./img/day-elnido-lagoon.jpg",
  "./img/day-elnido-nacpan.jpg",
  "./img/day-elnido-reef.jpg",
  "./img/day-ferry.jpg",
  "./img/day-flight.jpg",
  "./img/day-hakone-lakeashi.jpg",
  "./img/day-hakone-onsen.jpg",
  "./img/day-kalanggaman-sandbar.jpg",
  "./img/day-kalanggaman-snorkel.jpg",
  "./img/day-kyoto-gion.jpg",
  "./img/day-kyoto-kinkakuji.jpg",
  "./img/day-malapascua-beach.jpg",
  "./img/day-malapascua-sunset.jpg",
  "./img/day-manila-bgc.jpg",
  "./img/day-manila-city.jpg",
  "./img/day-manila-intramuros.jpg",
  "./img/day-moalboal-coast.jpg",
  "./img/day-moalboal-sardines.jpg",
  "./img/day-moalboal-turtle.jpg",
  "./img/day-negros-coffee.jpg",
  "./img/day-negros-falls.jpg",
  "./img/day-osaka-castle.jpg",
  "./img/day-osaka-dotonbori.jpg",
  "./img/day-tokyo-bay.jpg",
  "./img/day-tokyo-food.jpg",
  "./img/day-tokyo-night.jpg",
  "./img/day-shinkansen.jpg",
  "./img/train-shinkansen.jpg",
  "./img/heli-as350.jpg",
  "./img/day-tokyo-shibuya.jpg"
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

/* ---- Map tiles --------------------------------------------------------
   CARTO tiles live in their own cache so a new app version does not wipe
   a map the client saved last week. CARTO's basemap terms allow keeping
   tiles on the device for at most 30 days, so every tile is stamped when
   it is stored, never served past 30 days, and swept out on activate and
   whenever the page asks. The page shares these names — keep them in step. */
const TILE_CACHE = "malakay-tiles";
const TILE_HOST = "basemaps.cartocdn.com";
const TILE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

/* a., b., c. and d. serve the same tile; store it once. */
function tileKey(url){
  const u = new URL(url);
  return "https://a." + TILE_HOST + u.pathname + u.search;
}
function tileFresh(res){
  const at = Number(res && res.headers.get("x-malakay-saved"));
  return at > 0 && Date.now() - at < TILE_MAX_AGE;
}
async function sweepTiles(){
  const c = await caches.open(TILE_CACHE);
  for(const req of await c.keys()){
    const res = await c.match(req);
    if(!tileFresh(res)) await c.delete(req);
  }
}
async function serveTile(req){
  const c = await caches.open(TILE_CACHE);
  const key = tileKey(req.url);
  const hit = await c.match(key);
  if(hit && tileFresh(hit)) return hit;
  try{
    /* CORS, so the tile can be read and stamped. If CARTO ever refuses
       CORS this throws, and the tile is fetched exactly as Leaflet asked
       for it — the live map keeps working, it just is not saved. */
    const res = await fetch(req.url, { mode: "cors", credentials: "omit" });
    if(!res.ok) return res;
    const body = await res.blob();
    const headers = new Headers(res.headers);
    headers.set("x-malakay-saved", String(Date.now()));
    const stamped = new Response(body, { status: 200, headers });
    await c.put(key, stamped.clone());
    return stamped;
  }catch(err){
    try{ return await fetch(req); }
    catch(e){
      /* Offline and past 30 days: the stale tile may not be shown. */
      if(hit) await c.delete(key);
      throw e;
    }
  }
}

self.addEventListener("message", e => {
  if(e.data === "sweep-tiles") e.waitUntil(sweepTiles());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k)));
    await sweepTiles().catch(() => {});
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;

  const url = new URL(req.url);
  if(url.hostname.endsWith(TILE_HOST)){ e.respondWith(serveTile(req)); return; }
  if(url.origin !== self.location.origin) return;   /* weather and outbound links are left alone */

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
        /* Marked, so the page can tell a saved copy from a fresh one
           and show clients when their trip was last updated. */
        const hit = await caches.match(req);
        if(hit){
          const headers = new Headers(hit.headers);
          headers.set("x-malakay-offline", "1");
          return new Response(await hit.blob(), { status: 200, headers });
        }
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
