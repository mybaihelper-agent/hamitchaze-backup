// ron-ice: hands out temporary TURN credentials (Metered) so the provider key never reaches a browser.
// Env needed: METERED_DOMAIN, METERED_SECRET. Contract in PORTABILITY.md.
// Metered credentials need ~2 min to propagate, so we reuse a pool of pre-made credentials (age>=150s, >=20 min left)
// and mint the next one ahead of time. Moving to another provider: see PORTABILITY.md.
const TTL = 7200, WARM = 150, MIN_LEFT = 1200, ROTATE_AT = 3000;
const ORIGIN_OK = /^https:\/\/([a-z0-9-]+\.)*(ron-games-ron|offline-arcade-ron|[a-z0-9-]+-ron|hamitchaze-turn-test|hamitchaze)\.pages\.dev$|^http:\/\/localhost(:\d+)?$/;
const hits = new Map();
const cors = o => ({ 'access-control-allow-origin': o || '*', vary: 'origin', 'access-control-allow-methods': 'GET,OPTIONS', 'cache-control': 'no-store', 'content-type': 'application/json' });
const J = (o, s, origin) => new Response(JSON.stringify(o), { status: s || 200, headers: cors(origin) });

export async function onRequest({ request, env, waitUntil }) {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  const same = !origin && request.headers.get('sec-fetch-site') === 'same-origin';
  if (!same && !ORIGIN_OK.test(origin)) return J({ error: 'forbidden' }, 403);
  const ip = request.headers.get('cf-connecting-ip') || 'x', now = Date.now();
  const h = (hits.get(ip) || []).filter(t => now - t < 600000); h.push(now); hits.set(ip, h);
  if (hits.size > 5000) hits.clear();
  if (h.length > 20) return J({ error: 'rate' }, 429, origin);
  const base = 'https://' + (env.METERED_DOMAIN || '').replace(/^https?:\/\//, '') + '/api/v1/turn/';
  const sk = '?secretKey=' + encodeURIComponent(env.METERED_SECRET || '');
  try {
    const all = await (await fetch('https://' + (env.METERED_DOMAIN || '').replace(/^https?:\/\//, '') + '/api/v2/turn/credentials' + sk)).json();
    const list = (all.data || all || []).filter(c => c && c.apiKey && c.expiryInSeconds).map(c => {
      const born = parseInt(String(c._id).slice(0, 8), 16) * 1000;
      return { apiKey: c.apiKey, born, left: (born + c.expiryInSeconds * 1000 - now) / 1000, age: (now - born) / 1000 };
    });
    const usable = list.filter(c => c.age >= WARM && c.left >= MIN_LEFT).sort((a, b) => b.left - a.left);
    const newest = list.filter(c => c.left > 0).sort((a, b) => a.age - b.age)[0];
    const mint = async () => fetch(base + 'credential' + sk, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ expiryInSeconds: TTL, label: 'ron-ice' }) });
    if (!newest || newest.age > ROTATE_AT) { const p = mint(); if (waitUntil) waitUntil(p); else await p; }
    const pick = usable[0];
    if (!pick) return J({ error: 'warming', readyIn: newest ? Math.max(5, Math.ceil(WARM - newest.age)) : WARM }, 503, origin);
    const servers = await (await fetch(base + 'credentials?apiKey=' + encodeURIComponent(pick.apiKey))).json();
    if (!Array.isArray(servers) || !servers.length) throw new Error('no servers');
    return J({ iceServers: servers, ttl: Math.floor(pick.left) }, 200, origin);
  } catch (e) { return J({ error: 'upstream' }, 502, origin); }
}
