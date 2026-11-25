// /ice - issues short-lived TURN credentials (Metered) for the game's relay fallback.
// The Metered secret key lives only in this project's env (METERED_SECRET),
// never in client code. Abuse controls: origin allowlist + per-IP rate limit.
const ALLOWED = [
  /^https:\/\/hamitchaze-ron\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.hamitchaze-ron\.pages\.dev$/,
  /^https:\/\/hamitchaze-backup\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.hamitchaze-backup\.pages\.dev$/,
  /^https:\/\/hamitchaze-turn-test\.pages\.dev$/,
  /^https:\/\/[a-z0-9-]+\.hamitchaze-turn-test\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/
];
const TURN_URLS = [
  'turn:standard.relay.metered.ca:80',
  'turn:standard.relay.metered.ca:80?transport=tcp',
  'turn:standard.relay.metered.ca:443',
  'turns:standard.relay.metered.ca:443?transport=tcp'
];
const TTL = 1 * 3600; // 1 h credentials (within Ron's approved 1-3 h; Metered free caps concurrent credentials, shorter TTL frees slots sooner)
const RATE = 30;      // requests per IP per hour
let credCache = null; // { username, password, exp }
const hits = new Map();

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function originAllowed(request) {
  const raw = request.headers.get('Origin') || request.headers.get('Referer') || '';
  if (!raw) return false;
  let origin;
  try { origin = new URL(raw).origin; } catch (e) { return false; }
  return ALLOWED.some(re => re.test(origin));
}

function limited(ip) {
  const now = Date.now();
  let h = hits.get(ip);
  if (!h || now > h.reset) { h = { n: 0, reset: now + 3600e3 }; hits.set(ip, h); }
  h.n++;
  if (hits.size > 5000) hits.clear();
  return h.n > RATE;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!originAllowed(request)) return json({ error: 'forbidden' }, 403);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (limited(ip)) return json({ error: 'rate_limited' }, 429);
  if (!env.METERED_SECRET) return json({ error: 'not_configured' }, 503);

  const now = Date.now();
  if (!credCache || credCache.exp - now < 5 * 60e3) {
    let res;
    try {
      res = await fetch('https://instinct-relay.metered.live/api/v1/turn/credential?secretKey=' + encodeURIComponent(env.METERED_SECRET), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryInSeconds: TTL, label: 'hamitchaze-relay' })
      });
    } catch (e) { return json({ error: 'upstream' }, 502); }
    if (!res.ok) return json({ error: 'upstream' }, 502);
    const c = await res.json();
    if (!c || !c.username || !c.password) return json({ error: 'upstream' }, 502);
    credCache = { username: c.username, password: c.password, exp: now + TTL * 1000 };
  }

  return json({
    iceServers: [
      { urls: 'stun:stun.relay.metered.ca:80' },
      { urls: TURN_URLS, username: credCache.username, credential: credCache.password }
    ],
    ttl: Math.max(0, Math.round((credCache.exp - now) / 1000))
  });
}
