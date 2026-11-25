/* sw.js · Tab auto-update standard v1 (2026-11-06), written by autoupd_patch.py — one file for every game.
   - VERSION is written here; the cache is keyed by it (APP-vVERSION), so every release is a fresh cache.
   - install: precache this version's files (refuses the gate's lock page), then skipWaiting — no "update" tap.
   - activate: deletes every other cache of this origin (the old versions), then clients.claim().
   - fetch: the page (navigation / .html) is network-first with a 4 s timeout, falling back to the cache offline.
     If the network page is a different version than this worker (a new release), everything is fetched from the network
     until the new worker takes over, so a new page never runs with old scripts. Other files: this version's cache first.
   - never touches localStorage / IndexedDB (saves). /__* (gate), /api/*, Range requests and other origins pass through. */
const APP = "hamitchaze", VERSION = "1.0.6-auto", CACHE = APP + "-v" + VERSION;
const PRECACHE = ["./", "core.js", "game.js", "ice.js", "index.html", "manifest.webmanifest", "net.js", "shell.css", "shell.js", "tabname.js"];
const OPTIONAL = ["fonts/heebo-he.woff2", "fonts/heebo-la.woff2", "fonts/secular-he.woff2", "fonts/secular-la.woff2", "icon-192.png", "icon-512.png", "icon.svg", "vendor/peerjs.min.js"];
const NET_MS = 4000;
const SCOPE = new URL("./", self.location).href;
let stale = false;
const isHtml = p => p.endsWith("/") || /\.html?$/i.test(p);
const key = u => { const x = new URL(u, SCOPE); x.search = ""; x.hash = ""; return x.href; };
async function realFile(url, res) {
  if (!res || !res.ok || res.redirected || res.type !== "basic") return false;
  const p = new URL(url).pathname, ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!isHtml(p)) return !ct.includes("text/html");
  const t = await res.clone().text();
  return !t.includes('action="/__unlock"');
}
const verOf = t => { const m = /data-tab-autoupd[^>]*data-v="([^"]*)"/.exec(t); return m ? m[1] : null; };
async function put(cache, url, res) { try { await cache.put(key(url), res); } catch (e) { } }
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const q = PRECACHE.map(f => [f, false]).concat(OPTIONAL.map(f => [f, true]));
    const run = async () => {
      while (q.length) {
        const [f, opt] = q.shift(), url = new URL(f, SCOPE).href;
        try {
          const res = await fetch(new Request(url, { cache: "reload", credentials: "same-origin" }));
          if (!(await realFile(url, res.clone()))) throw new Error("refused " + f);
          await cache.put(key(url), res);
        } catch (err) { if (!opt) throw err; }
      }
    };
    try { await Promise.all([run(), run(), run(), run()]); }
    catch (err) { await caches.delete(CACHE); throw err; }
    await self.skipWaiting();
  })());
});
self.addEventListener("message", e => {
  const m = e.data, t = typeof m === "string" ? m : m && (m.type || m.t || m.action);
  if (t === "SKIP_WAITING" || t === "skipWaiting" || t === "skip") self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
async function netFirst(req, cache, nav) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), NET_MS);
  try {
    const res = await fetch(req, { signal: ac.signal, cache: "no-cache" });
    clearTimeout(t);
    if (res && res.ok) {
      if (await realFile(req.url, res.clone())) {
        if (isHtml(new URL(req.url).pathname) || nav) {
          const v = verOf(await res.clone().text());
          if (v && v !== VERSION) { stale = true; self.registration.update().catch(() => { }); return res; }
        }
        await put(cache, req.url, res.clone());
      }
      return res;
    }
    throw new Error("status " + (res && res.status));
  } catch (err) {
    clearTimeout(t);
    const hit = await cache.match(key(req.url));
    if (hit) return hit;
    if (nav) return (await cache.match(key(SCOPE))) || (await cache.match(key(SCOPE + "index.html"))) || Response.error();
    throw err;
  }
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || u.pathname.startsWith("/__") || u.pathname.startsWith("/api/") || req.headers.has("range")) return;
  if (u.href === self.location.href.split("?")[0] || /\/sw\.js$/.test(u.pathname)) return;
  const nav = req.mode === "navigate";
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const qv = u.searchParams.get("v");
    if (nav || isHtml(u.pathname) || stale || (qv && /^\d+(\.\d+)+$/.test(qv) && qv !== VERSION)) return netFirst(req, cache, nav);
    const hit = await cache.match(key(req.url));
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok && (await realFile(req.url, res.clone()))) await put(cache, req.url, res.clone());
    return res;
  })());
});
