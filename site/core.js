(function (root) {
'use strict';
const ROOMS = [
  { id: 'eng', n: 'מנועים', x: 200, y: 180, w: 270, h: 220 }, { id: 'caf', n: 'קפיטריה', x: 640, y: 180, w: 360, h: 250 }, { id: 'arm', n: 'נשקייה', x: 1080, y: 180, w: 270, h: 220 },
  { id: 'rea', n: 'כור', x: 200, y: 560, w: 270, h: 220 }, { id: 'ctl', n: 'חדר בקרה', x: 640, y: 560, w: 290, h: 220 }, { id: 'nav', n: 'ניווט', x: 1080, y: 560, w: 270, h: 220 },
  { id: 'sto', n: 'מחסן', x: 200, y: 940, w: 270, h: 220 }, { id: 'ele', n: 'חשמל', x: 640, y: 940, w: 290, h: 220 }, { id: 'shi', n: 'מגנים', x: 1080, y: 940, w: 270, h: 220 }];
const LINKS = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [5, 8], [6, 7], [7, 8], [4, 7]];
const CW = 76;
const CORR = LINKS.map(([a, b]) => { const A = ROOMS[a], B = ROOMS[b]; if (A.y === B.y) return { a, b, x: (A.x + B.x) / 2, y: A.y, w: Math.abs(B.x - A.x), h: CW, hz: 1 }; return { a, b, x: A.x, y: (A.y + B.y) / 2, w: CW, h: Math.abs(B.y - A.y), hz: 0 }; });
const ST = [
  [0, -80, -60, 'hold', 'תדלוק מנוע'], [0, 80, 60, 'timing', 'כיוון מנוע'], [1, -120, -70, 'hold', 'פינוי פסולת'], [1, 120, -70, 'code', 'הורדת נתונים'],
  [2, 70, -60, 'timing', 'כיול תותח'], [3, -80, 50, 'seq', 'הפעלת הכור'], [3, 80, -60, 'code', 'קוד הכור'], [4, -90, -55, 'hold', 'סריקה רפואית'],
  [4, 95, 55, 'seq', 'סידור לוח'], [5, 80, -50, 'timing', 'כיוון מסלול'], [5, -70, 60, 'code', 'קוד ניווט'], [6, -80, -55, 'seq', 'מיון ארגזים'],
  [7, -95, -55, 'seq', 'חיווט'], [7, 95, 55, 'timing', 'כיול חשמל'], [8, 80, -55, 'seq', 'הפעלת מגנים'], [2, -80, 60, 'hold', 'טעינת תחמושת']
].map((s, i) => ({ i, r: s[0], x: ROOMS[s[0]].x + s[1], y: ROOMS[s[0]].y + s[2], type: s[3], n: s[4] }));
const BTN = { x: ROOMS[1].x, y: ROOMS[1].y + 10 };
const VENTS = [
  { i: 0, r: 1, x: ROOMS[1].x - 130, y: ROOMS[1].y + 85, links: [1] },
  { i: 1, r: 3, x: ROOMS[3].x + 85, y: ROOMS[3].y - 70, links: [0] },
  { i: 2, r: 0, x: ROOMS[0].x - 90, y: ROOMS[0].y + 70, links: [3] },
  { i: 3, r: 8, x: ROOMS[8].x + 85, y: ROOMS[8].y + 70, links: [2] },
  { i: 4, r: 4, x: ROOMS[4].x - 100, y: ROOMS[4].y + 70, links: [5] },
  { i: 5, r: 6, x: ROOMS[6].x - 80, y: ROOMS[6].y + 70, links: [4] }
];
function nearVent(st, p) { if (!p || !p.alive || st.ph !== 'play') return null; for (const v of VENTS) if (d2(p, v) < UR) return v; return null; }
const COLORS = ['#FF5B2E', '#3B4BFF', '#B6F03C', '#FF7CC8', '#FFC93C', '#2EC4B6', '#9B5DE5', '#F5F0E6', '#8A5A3C', '#E63946', '#4CC9F0', '#7B8B6F'];
const CNAMES = ['כתום', 'כחול', 'ליים', 'ורוד', 'צהוב', 'טורקיז', 'סגול', 'לבן', 'חום', 'אדום', 'תכלת', 'זית'];
const BOTN = ['זוהר', 'ניצן', 'גלקסי', 'פלוטו', 'כוכבית', 'שביט', 'נוגה', 'מאדים', 'אורבית', 'קוואזר', 'נבולה'];
const R = 15, SPD = 165, KR = 78, RR = 110, UR = 70, VIS = 250, VIS_IMP = 340;
function rng(st) { st.rs = (st.rs + 0x6D2B79F5) | 0; let t = st.rs; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function ri(st, n) { return Math.floor(rng(st) * n); }
function shuffle(st, a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(st, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function inRect(o, x, y, m) { return Math.abs(x - o.x) <= o.w / 2 - m && Math.abs(y - o.y) <= o.h / 2 - m; }
function walk(x, y) { for (const o of ROOMS) if (inRect(o, x, y, R)) return true; for (const o of CORR) if (inRect(o, x, y, R)) return true; return false; }
function roomAt(x, y) { for (let i = 0; i < ROOMS.length; i++) if (inRect(ROOMS[i], x, y, 0)) return i; for (const c of CORR) if (inRect(c, x, y, 0)) { const A = ROOMS[c.a], B = ROOMS[c.b]; return Math.hypot(x - A.x, y - A.y) < Math.hypot(x - B.x, y - B.y) ? c.a : c.b; } return 1; }
function inRoom(x, y) { for (let i = 0; i < ROOMS.length; i++) if (inRect(ROOMS[i], x, y, 0)) return i; return -1; }
const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function adj(i) { const o = []; for (const [a, b] of LINKS) { if (a === i) o.push(b); else if (b === i) o.push(a); } return o; }
function roomPath(a, b) { if (a === b) return [a]; const prev = { [a]: -1 }, q = [a]; while (q.length) { const c = q.shift(); if (c === b) break; for (const n of adj(c)) if (!(n in prev)) { prev[n] = c; q.push(n); } } const p = []; let c = b; while (c !== -1 && c !== undefined) { p.unshift(c); c = prev[c]; } return p; }
function route(from, tx, ty) { const a = roomAt(from.x, from.y), b = roomAt(tx, ty); const rp = roomPath(a, b); const w = []; if (rp.length > 1 || inRoom(from.x, from.y) < 0) for (const r of rp) w.push({ x: ROOMS[r].x, y: ROOMS[r].y }); w.push({ x: tx, y: ty }); return w; }

const DIFF = { easy: { kcd: 32, wit: 0.6, think: 1.4, acc: 0.6 }, norm: { kcd: 25, wit: 0.85, think: 1, acc: 0.8 }, hard: { kcd: 20, wit: 1, think: 0.7, acc: 0.95 } };

function newGame(cfg) {
  cfg = cfg || {};
  const st = { v: 1, rs: (cfg.seed >>> 0) || 12345, t: 0, ph: 'play', players: [], bodies: [], inp: {}, ev: [], meet: null, ej: null, over: null, diff: cfg.diff || 'norm', meetings: 0, kills: 0, log: [] };
  const humans = cfg.humans || [{ id: 'p0', name: 'את/ה' }];
  const n = Math.max(cfg.n || 6, humans.length + 1);
  const nImp = cfg.imps || (n >= 9 ? 2 : 1);
  const cols = shuffle(st, COLORS.map((c, i) => i)); const bn = shuffle(st, BOTN.slice());
  for (let i = 0; i < n; i++) {
    const h = humans[i];
    const ang = i / n * Math.PI * 2;
    st.players.push({ id: h ? h.id : 'b' + i, name: h ? h.name : bn[i % bn.length], c: (h && h.col != null) ? h.col : cols[i % cols.length], hat: (h && h.hat) || 0, bot: !h, x: BTN.x + Math.cos(ang) * 95, y: BTN.y + Math.sin(ang) * 70, alive: true, imp: false, tasks: [], kcd: 12, btn: 1, mv: 0, vcd: 0, face: 1, ai: { wp: [], sus: {}, think: 0 } });
  }
  if (cfg.c0 != null) { const p0 = st.players[0], o = st.players.find(p => p !== p0 && p.c === cfg.c0); if (o) { o.c = p0.c; } p0.c = cfg.c0; }
  let pool = st.players.map((p, i) => i);
  if (cfg.role === 'crew') pool = pool.filter(i => i !== 0);
  let imps = shuffle(st, pool).slice(0, nImp);
  if (cfg.role === 'imp' && !imps.includes(0)) imps[0] = 0;
  imps.forEach(i => st.players[i].imp = true);
  const nt = cfg.tasks || 5;
  st.players.forEach(p => { const s = shuffle(st, ST.map(x => x.i)).slice(0, nt); p.tasks = s.map(x => ({ s: x, d: 0 })); });
  st.tasksTotal = st.players.filter(p => !p.imp).length * nt;
  return st;
}
const P = (st, id) => st.players.find(p => p.id === id);
function tasksDone(st) { let d = 0; for (const p of st.players) if (!p.imp) for (const t of p.tasks) d += t.d; return d; }
function alive(st) { return st.players.filter(p => p.alive); }
function nearKill(st, p) { if (!p.imp || !p.alive || p.kcd > 0 || st.ph !== 'play') return null; let best = null, bd = KR; for (const q of st.players) if (q.alive && !q.imp) { const d = d2(p, q); if (d < bd) { bd = d; best = q; } } return best; }
function nearBody(st, p) { if (!p.alive || st.ph !== 'play') return null; return st.bodies.find(b => d2(p, b) < RR) || null; }
function nearStation(st, p) { if (st.ph !== 'play') return null; for (const t of p.tasks) { if (t.d) continue; const s = ST[t.s]; if (d2(p, s) < UR) return s; } return null; }
function nearButton(st, p) { return st.ph === 'play' && p.alive && p.btn > 0 && d2(p, BTN) < UR + 10; }
function move(p, dx, dy, dt, sp) {
  const l = Math.hypot(dx, dy); if (l < 0.05) { p.mv = 0; return; } const k = Math.min(1, l) * (sp || SPD) * dt / l; dx *= k; dy *= k;
  if (Math.abs(dx) > 0.01) p.face = dx > 0 ? 1 : -1;
  const ghost = !p.alive;
  if (ghost || walk(p.x + dx, p.y)) p.x += dx; if (ghost || walk(p.x, p.y + dy)) p.y += dy;
  if (ghost) { p.x = Math.max(40, Math.min(1290, p.x)); p.y = Math.max(40, Math.min(1110, p.y)); }
  p.mv = 1;
}
function emit(st, e) { st.ev.push(e); if (st.ev.length > 40) st.ev.shift(); }
function act(st, id, a, arg) {
  const p = P(st, id); if (!p) return false;
  if (a === 'kill') { const q = nearKill(st, p); if (!q) return false; q.alive = false; st.bodies.push({ id: q.id, x: q.x, y: q.y, c: q.c, t: st.t }); p.kcd = DIFF[st.diff].kcd; p.x = q.x; p.y = q.y; st.kills++;
    emit(st, { k: 'kill', x: q.x, y: q.y, by: p.id, v: q.id });
    st.lastKill = { by: p.id, v: q.id, x: q.x, y: q.y, t: st.t, wit: st.players.filter(w => w.alive && w !== p && w !== q && d2(w, p) < VIS * 0.9).map(w => w.id) };
    for (const w of st.players) if (w.bot && w.alive && !w.imp && w !== q && d2(w, p) < VIS * 0.9 && rng(st) < DIFF[st.diff].wit) { w.ai.sus[p.id] = (w.ai.sus[p.id] || 0) + 100; w.ai.saw = { k: p.id, r: roomAt(p.x, p.y) }; }
    return true; }
  if (a === 'report') { const b = nearBody(st, p); if (!b) return false; startMeet(st, p, b); return true; }
  if (a === 'saw') { const lk = st.lastKill; if (!lk || st.ph !== 'play' || !p.alive || p.imp || !lk.wit || lk.wit.indexOf(p.id) < 0 || st.t - lk.t > 10) return false; st.pendingWit = { by: p.id, k: lk.by, v: lk.v }; startMeet(st, p, null); return true; }
  if (a === 'vent') { if (!p.imp || !p.alive || st.ph !== 'play' || p.vcd > 0) return false; const v0 = nearVent(st, p); if (!v0) return false; const to = VENTS[+arg]; if (!to || v0.links.indexOf(to.i) < 0) return false; emit(st, { k: 'vent', id: p.id, x: v0.x, y: v0.y, x2: to.x, y2: to.y }); p.x = to.x; p.y = to.y; p.vcd = 8; return true; }
  if (a === 'button') { if (!nearButton(st, p)) return false; p.btn--; startMeet(st, p, null); return true; }
  if (a === 'task') { const t = p.tasks.find(t => t.s === arg && !t.d); if (!t || st.ph !== 'play' || d2(p, ST[arg]) > UR + 20) return false; if (p.imp) { t.d = 1; return true; } t.d = 1; emit(st, { k: 'task', id: p.id, s: arg }); return true; }
  if (a === 'chat') return chat(st, p, arg);
  if (a === 'vote') { const m = st.meet; if (!m || m.stage !== 'vote' || !p.alive || id in m.votes) return false; if (arg !== 'skip') { const q = P(st, arg); if (!q || !q.alive) return false; } m.votes[id] = arg; emit(st, { k: 'vote', id }); return true; }
  return false;
}
const RN = r => (ROOMS[r] || { n: 'מסדרון' }).n;
function pick(st, a) { return a[ri(st, a.length)]; }
function botSay(st, p, txt, delay, force) { const m = st.meet; if (!m || !p || !p.alive) return; if (!force && (m.q.some(x => x.t === txt) || m.lines.slice(-6).some(l => l.t === txt))) return; m.q.push({ at: m.t + delay, id: p.id, t: txt }); }
function chat(st, p, arg) {
  const m = st.meet; if (!m || st.ph !== 'meet' || !p.alive || p.bot) return false;
  const [k, a1] = String(arg || '').split(':');
  m.said = m.said || {}; m.cool = m.cool || {}; m.q = m.q || [];
  if ((m.said[p.id] || 0) >= 8 || (m.cool[p.id] != null && m.t - m.cool[p.id] < 1.2)) return false;
  const q = a1 != null && a1 !== '' ? P(st, a1) : null;
  const others = alive(st).filter(b => b.bot && b !== p);
  const mine = m.rooms && m.rooms[p.id];
  let txt = null;
  if (k === 'sus') { if (!q || !q.alive || q === p) return false; txt = 'אני חושד/ת ב' + q.name + ' 🤨'; }
  else if (k === 'safe') { if (!q || !q.alive || q === p) return false; txt = q.name + ' בסדר, הייתי איתו/ה 👍'; }
  else if (k === 'where') { if (!q || !q.alive || q === p) return false; txt = q.name + ', איפה היית?'; }
  else if (k === 'me') { const r = +a1; if (!(r >= 0 && r < ROOMS.length)) return false; txt = 'הייתי ב' + ROOMS[r].n + '.'; }
  else if (k === 'tasks') txt = 'עשיתי את המשימות שלי ✔';
  else if (k === 'skip') txt = 'אין מספיק מידע, בואו נדלג 🤷';
  else if (k === 'body') { if (m.body == null) return false; txt = 'מי היה ליד הגופה?'; }
  else if (k === 'notme') txt = 'זה לא אני! 😤';
  else if (k === 'agree') txt = 'מסכים/ה 👆';
  else return false;
  m.said[p.id] = (m.said[p.id] || 0) + 1; m.cool[p.id] = m.t;
  say(st, p, txt); emit(st, { k: 'chat', id: p.id, n: m.lines.length });
  const room = id => m.rooms ? m.rooms[id] : -1;
  const lie = b => { let r = ri(st, ROOMS.length); if (r === room(b.id)) r = (r + 1) % ROOMS.length; return r; };
  if (k === 'sus') {
    if (q.bot) {
      if (q.imp) botSay(st, q, pick(st, ['מה?! הייתי ב' + RN(lie(q)) + ' כל הזמן', 'לא אני! ' + p.name + ', דווקא את/ה מתנהג/ת מוזר', 'יש לך הוכחה? כי אין לך']), 1.2 + rng(st));
      else { const s = q.ai.saw && P(st, q.ai.saw.k); botSay(st, q, s && s.alive ? 'לא אני! ראיתי את ' + s.name + ' ב' + RN(q.ai.saw.r) : pick(st, ['לא אני! הייתי ב' + RN(room(q.id)), 'אני בצוות, נשבע/ת. הייתי ב' + RN(room(q.id))]), 1.2 + rng(st)); }
    }
    let n = 0;
    for (const b of others) { if (b === q || n >= 2) continue;
      if (b.imp) { if (!q.imp && rng(st) < 0.6) { botSay(st, b, pick(st, ['כן, גם לי ' + q.name + ' נראה/ית חשוד/ה', 'ראיתי את ' + q.name + ' מסתובב/ת לבד']), 2 + rng(st) * 2); b.ai.vbias = q.id; n++; }
        else if (q.imp && rng(st) < 0.7) { botSay(st, b, q.name + ' היה/ה איתי ב' + RN(room(b.id)) + ', זה לא הוא/היא', 2 + rng(st) * 2); n++; } continue; }
      const s0 = b.ai.sus[q.id] || 0; b.ai.sus[q.id] = s0 + 20 + rng(st) * 28;
      if (s0 >= 40 && rng(st) < 0.8) { botSay(st, b, pick(st, ['מסכים/ה, גם לי ' + q.name + ' חשוד/ה', 'כן! ' + q.name + ' היה/ה ליד ' + (m.br >= 0 ? 'הגופה' : 'מקום מוזר')]), 2 + rng(st) * 2); n++; }
      else if (b.ai.saw && b.ai.saw.k !== q.id && P(st, b.ai.saw.k) && P(st, b.ai.saw.k).alive && rng(st) < 0.8) { botSay(st, b, 'לא, אני ראיתי את ' + P(st, b.ai.saw.k).name + '!', 2 + rng(st) * 2); n++; }
      else if (rng(st) < 0.35) { botSay(st, b, pick(st, ['למה דווקא ' + q.name + '?', 'יש לך הוכחה?', 'הממ, אולי']), 2 + rng(st) * 2); n++; }
    }
  } else if (k === 'safe') {
    for (const b of others) if (!b.imp) b.ai.sus[q.id] = Math.max(0, (b.ai.sus[q.id] || 0) - 15);
    const w = others.find(b => !b.imp && b.ai.saw && b.ai.saw.k === q.id);
    if (w) { botSay(st, w, 'בטוח? אני ראיתי את ' + q.name + ' ב' + RN(w.ai.saw.r) + '…', 1.5 + rng(st)); w.ai.sus[p.id] = (w.ai.sus[p.id] || 0) + 25; }
    else if (q.bot) botSay(st, q, pick(st, ['תודה 🙏', 'נכון, היינו ביחד']), 1.2 + rng(st));
  } else if (k === 'where') {
    if (q.bot) { const r = q.imp ? lie(q) : room(q.id); botSay(st, q, pick(st, ['הייתי ב' + RN(r) + '.', 'ב' + RN(r) + ', עשיתי משימה', 'ב' + RN(r) + '. למה?']), 1.2 + rng(st), true); if (q.imp) q.ai.claim = r; }
  } else if (k === 'me') {
    const r = +a1; const truth = room(p.id) === r;
    const near = others.filter(b => !b.imp && room(b.id) === r);
    if (near.length) { const b = near[0]; if (truth) { botSay(st, b, 'נכון, ראיתי אותך שם 👍', 1.4 + rng(st)); b.ai.sus[p.id] = Math.max(0, (b.ai.sus[p.id] || 0) - 20); }
      else { botSay(st, b, 'רגע… הייתי ב' + ROOMS[r].n + ' ולא ראיתי אותך 🤔', 1.4 + rng(st)); for (const o of others) if (!o.imp) o.ai.sus[p.id] = (o.ai.sus[p.id] || 0) + (o === b ? 45 : 20); } }
    else if (rng(st) < 0.4) { const b = others[ri(st, others.length || 1)]; if (b) botSay(st, b, pick(st, ['מישהו יכול לאשר?', 'אוקיי']), 1.6 + rng(st)); }
  } else if (k === 'body') {
    if (m.body != null) { const b0 = P(st, m.body); let n = 0;
      for (const b of others) { if (n >= 2) break; const near = st.players.filter(o => o !== b && o.alive && o.ai && m.rooms && m.rooms[o.id] === m.br);
        if (!b.imp && b.ai.saw && P(st, b.ai.saw.k) && P(st, b.ai.saw.k).alive) { botSay(st, b, 'ראיתי את ' + P(st, b.ai.saw.k).name + ' שם!', 1.4 + rng(st)); n++; }
        else if (!b.imp && near.length && rng(st) < 0.6) { botSay(st, b, near[0].name + ' היה/ה ב' + RN(m.br), 1.6 + rng(st) * 2); n++; }
        else if (rng(st) < 0.4) { botSay(st, b, 'לא הייתי שם' + (b0 ? ', מסכן/ה ' + b0.name : ''), 1.6 + rng(st) * 2); n++; } } }
  } else if (k === 'skip') {
    let n = 0; for (const b of others) { if (n >= 2) break; let mx = 0, who = null; for (const id in b.ai.sus) if ((b.ai.sus[id] || 0) > mx && P(st, id) && P(st, id).alive) { mx = b.ai.sus[id]; who = P(st, id); }
      if (!b.imp && mx >= 45 && who) { botSay(st, b, 'לא, אני מצביע/ה נגד ' + who.name, 1.4 + rng(st)); n++; } else if (rng(st) < 0.5) { botSay(st, b, pick(st, ['מסכים/ה, דילוג', 'כן, אין לנו כלום']), 1.4 + rng(st) * 2); n++; } }
  } else if (k === 'notme') {
    const b = others[ri(st, others.length || 1)]; if (b && rng(st) < 0.7) botSay(st, b, pick(st, ['זה מה שמתחזה היה אומר 😏', 'אוקיי, אז מי?', 'נראה בהצבעה']), 1.4 + rng(st));
  } else if (k === 'tasks') {
    const b = others[ri(st, others.length || 1)]; if (b && rng(st) < 0.5) botSay(st, b, pick(st, ['איזה משימות?', 'יופי, גם אני']), 1.4 + rng(st));
  }
  return true;
}
function say(st, p, txt) { st.meet.lines.push({ id: p.id, t: txt }); }
function startMeet(st, by, body) {
  st.ph = 'meet'; st.meetings++;
  const br = body ? roomAt(body.x, body.y) : -1;
  const ppl = st.players.some(p => !p.bot && p.alive); const rooms = {}; for (const p of st.players) if (p.alive) rooms[p.id] = roomAt(p.x, p.y);
  st.meet = { by: by.id, body: body ? body.id : null, br, stage: 'talk', t: 0, talk: ppl ? 15 : 9, vote: 30, votes: {}, lines: [], rooms, q: [], said: {}, cool: {} };
  if (st.pendingWit) { st.meet.wit = st.pendingWit; st.pendingWit = null; } st.lastKill = null;
  emit(st, { k: 'meet', by: by.id, body: !!body });
  if (body) for (const w of st.players) if (w.bot && w.alive && !w.imp) for (const q of st.players) if (q !== w && q.alive && d2(q, body) < 260 && d2(w, body) < 300) w.ai.sus[q.id] = (w.ai.sus[q.id] || 0) + (q.id === by.id ? 5 : 30);
  const bots = st.players.filter(p => p.bot && p.alive);
  for (const p of bots) {
    if (p.id === by.id) say(st, p, body ? 'מצאתי גופה ב' + ROOMS[br].n + '!' : 'לחצתי על כפתור החירום. בואו נדבר.');
    if (!p.imp && p.ai.saw && P(st, p.ai.saw.k) && P(st, p.ai.saw.k).alive) say(st, p, 'ראיתי את ' + P(st, p.ai.saw.k).name + ' חוסל/ת מישהו ב' + ROOMS[p.ai.saw.r].n + '!');
    else if (rng(st) < 0.55) { const r = p.imp ? ri(st, 9) : roomAt(p.x, p.y); say(st, p, ['הייתי ב', 'עשיתי משימות ב', 'הסתובבתי ב'][ri(st, 3)] + ROOMS[r].n + '.'); }
  }
  if (st.meet.wit) {
    const w = st.meet.wit, rp = P(st, w.by), killer = P(st, w.k), victim = w.v && P(st, w.v);
    if (rp && rp.alive && killer) say(st, rp, 'ראיתי את ' + killer.name + ' חוסל/ת' + (victim ? ' את ' + victim.name : '') + '! 👀');
    for (const b of st.players) if (b.bot && b.alive && !b.imp && b.ai.saw && b.ai.saw.k === w.k && b.id !== w.by) { b.ai.sus[w.k] = (b.ai.sus[w.k] || 0) + 120; botSay(st, b, 'נכון! גם אני ראיתי את ' + (killer ? killer.name : '?'), 1.4 + rng(st)); }
    if (killer && killer.bot) botSay(st, killer, pick(st, ['שקר! ' + (rp ? rp.name : 'הוא/היא') + ' ממציא/ה', 'מה?! לא עשיתי כלום', 'דווקא ' + (rp ? rp.name : '?') + ' חשוד/ה שממהר/ת להאשים']), 1.6 + rng(st));
  }
  for (const p of st.players) { p.ai.wp = []; p.ai.vbias = null; }
}
function botVote(st, p) {
  const al = alive(st).filter(q => q !== p);
  if (p.imp && p.ai.vbias && P(st, p.ai.vbias) && P(st, p.ai.vbias).alive && !P(st, p.ai.vbias).imp) return p.ai.vbias;
  if (p.imp) { const crew = al.filter(q => !q.imp); const accused = {}; for (const v of Object.values(st.meet.votes)) if (v !== 'skip') accused[v] = (accused[v] || 0) + 1; let best = null, bn = 0; for (const q of crew) if ((accused[q.id] || 0) > bn) { bn = accused[q.id]; best = q; } if (best) return best.id; return rng(st) < 0.5 ? 'skip' : crew[ri(st, crew.length)].id; }
  let best = null, bs = 0; for (const q of al) { const s = (p.ai.sus[q.id] || 0) + (rng(st) * 30 * (1 - DIFF[st.diff].acc)); if (s > bs) { bs = s; best = q; } }
  if (best && bs >= 45) return best.id;
  const accused = {}; for (const v of Object.values(st.meet.votes)) if (v !== 'skip') accused[v] = (accused[v] || 0) + 1;
  for (const k in accused) if (accused[k] >= 2 && k !== p.id && rng(st) < 0.5) return k;
  return 'skip';
}
function endMeet(st) {
  const m = st.meet; const tally = {}; let skip = 0;
  for (const p of alive(st)) { const v = m.votes[p.id]; if (v === undefined || v === 'skip') skip++; else tally[v] = (tally[v] || 0) + 1; }
  let top = null, tn = 0, tie = false; for (const k in tally) { if (tally[k] > tn) { tn = tally[k]; top = k; tie = false; } else if (tally[k] === tn) tie = true; }
  let out = null; if (top && !tie && tn > skip) out = top;
  const q = out && P(st, out);
  if (q) { q.alive = false; for (const w of st.players) if (w.bot) delete w.ai.sus[q.id]; }
  st.ej = { id: out, imp: q ? q.imp : false, left: st.players.filter(p => p.alive && p.imp).length, t: 0, tally, skip };
  st.ph = 'eject'; st.bodies = []; emit(st, { k: 'eject', id: out });
}
function resetPositions(st) { const al = st.players; al.forEach((p, i) => { const a = i / al.length * Math.PI * 2; p.x = BTN.x + Math.cos(a) * 95; p.y = BTN.y + Math.sin(a) * 70; p.ai.wp = []; p.ai.work = 0; if (p.imp) p.kcd = Math.max(p.kcd, DIFF[st.diff].kcd * 0.6); p.ai.saw = null; }); }
function check(st) {
  if (st.over) return st.over;
  const ai = st.players.filter(p => p.alive && p.imp).length, ac = st.players.filter(p => p.alive && !p.imp).length;
  if (ai === 0) st.over = { crew: true, why: 'המתחזה נזרק/ה מהחללית' };
  else if (ai >= ac) st.over = { crew: false, why: 'המתחזים השתלטו על החללית' };
  else if (tasksDone(st) >= st.tasksTotal) st.over = { crew: true, why: 'כל המשימות הושלמו' };
  if (st.over) { st.ph = 'over'; emit(st, { k: 'over' }); }
  return st.over;
}
function botStep(st, p, dt) {
  const ai = p.ai; let dx = 0, dy = 0; const df = DIFF[st.diff];
  if (ai.work > 0) { ai.work -= dt; if (ai.work <= 0 && ai.wt != null) { act(st, p.id, 'task', ai.wt); ai.wt = null; } return [0, 0]; }
  ai.think -= dt;
  if (p.alive && ai.think <= 0) {
    ai.think = (0.35 + rng(st) * 0.3) * df.think;
    if (!p.imp) { const b = st.bodies.find(b => d2(p, b) < VIS * 0.8); if (b) { if (d2(p, b) < RR - 10) { act(st, p.id, 'report'); return [0, 0]; } ai.wp = [{ x: b.x, y: b.y }]; ai.goal = 'body'; } }
    else if (p.kcd <= 0) {
      let tgt = null, bd = 480;
      for (const q of st.players) if (q.alive && !q.imp) { const d = d2(p, q); if (d < bd) { const wit = st.players.some(w => w !== q && w !== p && w.alive && !w.imp && d2(w, q) < VIS * 0.6); if (!wit) { bd = d; tgt = q; } } }
      if (tgt) { if (d2(p, tgt) < KR - 8) { act(st, p.id, 'kill'); ai.wp = []; ai.goal = null; ai.flee = 1; return [0, 0]; } ai.wp = route(p, tgt.x, tgt.y); ai.goal = 'hunt'; }
      else if (ai.goal === 'hunt') { ai.wp = []; ai.goal = null; }
    }
    if (!p.imp && p.btn > 0 && Object.values(ai.sus).some(v => v >= 100) && d2(p, BTN) < 300) { if (d2(p, BTN) < UR) { act(st, p.id, 'button'); return [0, 0]; } ai.wp = route(p, BTN.x, BTN.y); ai.goal = 'btn'; }
  }
  if (!ai.wp.length) {
    const todo = p.tasks.filter(t => !t.d);
    let s;
    if (todo.length && (p.alive || !p.imp) && rng(st) < (p.alive ? 0.6 : 0.85)) s = ST[todo[ri(st, todo.length)].s]; else s = ST[ri(st, ST.length)];
    ai.wp = route(p, s.x + (rng(st) - 0.5) * 20, s.y + (rng(st) - 0.5) * 20); ai.goal = 's' + s.i; ai.st = s.i;
  }
  const w = ai.wp[0];
  if (w) {
    const ddx = w.x - p.x, ddy = w.y - p.y, l = Math.hypot(ddx, ddy);
    if (l < 10) { ai.wp.shift(); if (!ai.wp.length && ai.goal && ai.goal[0] === 's') { const tk = p.tasks.find(t => t.s === ai.st && !t.d); ai.work = 4 + rng(st) * 4; ai.wt = tk ? ai.st : null; if (p.imp) ai.wt = null; ai.goal = null; } }
    else { dx = ddx / l; dy = ddy / l; }
    ai.sx = ai.sx || 0; if (Math.hypot(p.x - (ai.lx || 0), p.y - (ai.ly || 0)) < 0.3 && l >= 10) { ai.sx += dt; if (ai.sx > 0.8) { ai.wp = route(p, ai.wp[ai.wp.length - 1].x, ai.wp[ai.wp.length - 1].y); ai.sx = 0; if (ai.wp.length === 1) { ai.wp.unshift({ x: ROOMS[roomAt(p.x, p.y)].x, y: ROOMS[roomAt(p.x, p.y)].y }); } } } else ai.sx = 0;
    ai.lx = p.x; ai.ly = p.y;
  }
  return [dx, dy];
}
function step(st, dt) {
  if (st.over) return;
  st.t += dt;
  if (st.ph === 'play') {
    for (const p of st.players) {
      if (p.imp && p.alive) { p.kcd = Math.max(0, p.kcd - dt); p.vcd = Math.max(0, (p.vcd || 0) - dt); }
      let v = st.inp[p.id] || [0, 0];
      if (p.bot) { if (!p.alive && p.imp) { p.mv = 0; continue; } v = botStep(st, p, dt); if (st.ph !== 'play') break; }
      move(p, v[0], v[1], dt, p.alive ? SPD : SPD * 1.15);
    }
    check(st);
  } else if (st.ph === 'meet') {
    const m = st.meet; m.t += dt;
    if (m.q && m.q.length) { m.q.sort((a, b) => a.at - b.at); while (m.q.length && m.q[0].at <= m.t) { const x = m.q.shift(); const b = P(st, x.id); if (b && b.alive && m.lines.filter(l => l.id === b.id).length < 6) { say(st, b, x.t); emit(st, { k: 'chat', id: b.id, n: m.lines.length }); } } }
    if (m.stage === 'talk' && m.t >= m.talk) { m.stage = 'vote'; m.t = 0; for (const p of st.players) if (p.bot) p.ai.vt = 2 + rng(st) * 12; }
    if (m.stage === 'vote') {
      for (const p of st.players) if (p.bot && p.alive && !(p.id in m.votes)) { p.ai.vt -= dt; if (p.ai.vt <= 0) { const v = botVote(st, p); act(st, p.id, 'vote', v); if (m.q && v !== 'skip' && st.players.some(h => !h.bot && h.alive) && rng(st) < 0.35 && P(st, v)) say(st, p, pick(st, ['מצביע/ה נגד ', 'הקול שלי ל', 'סליחה, ']) + P(st, v).name); } }
      if (m.t >= m.vote || alive(st).every(p => p.id in m.votes)) endMeet(st);
    }
  } else if (st.ph === 'eject') {
    st.ej.t += dt; if (st.ej.t >= 5) { st.ph = 'play'; st.meet = null; resetPositions(st); check(st); }
  }
}
function view(st, me) {
  const p = P(st, me) || st.players[0]; const showImp = !!st.over;
  const mi = p.imp;
  return {
    ph: st.ph, t: Math.round(st.t * 10) / 10, me: p.id, imp: mi, alive: p.alive,
    pl: st.players.map(q => ({ id: q.id, n: q.name, c: q.c, h: q.hat, x: Math.round(q.x), y: Math.round(q.y), a: q.alive ? 1 : 0, m: q.mv, f: q.face, i: (showImp || (mi && q.imp) || q.id === p.id) ? (q.imp ? 1 : 0) : -1, bt: q.bot ? 1 : 0 })),
    bo: st.bodies.map(b => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y), c: b.c })),
    td: tasksDone(st), tt: st.tasksTotal,
    tk: p.tasks.map(t => ({ s: t.s, d: t.d })), kcd: Math.ceil(p.kcd), btn: p.btn, vcd: Math.ceil(p.vcd || 0),
    vn: (mi && p.alive && st.ph === 'play') ? (function () { const vn0 = nearVent(st, p); return vn0 ? vn0.i : -1; })() : -1,
    saw: (st.lastKill && st.ph === 'play' && p.alive && !p.imp && st.lastKill.wit && st.lastKill.wit.indexOf(p.id) >= 0 && st.t - st.lastKill.t <= 10) ? { k: st.lastKill.by, v: st.lastKill.v, left: Math.ceil(10 - (st.t - st.lastKill.t)) } : null,
    nImp: st.players.filter(q => q.imp).length,
    meet: st.meet ? { by: st.meet.by, body: st.meet.body, br: st.meet.br, wit: st.meet.wit || null, stage: st.meet.stage, left: Math.ceil((st.meet.stage === 'talk' ? st.meet.talk : st.meet.vote) - st.meet.t), voted: Object.keys(st.meet.votes), mine: st.meet.votes[p.id], lines: st.meet.lines.slice(-12), myr: st.meet.rooms ? st.meet.rooms[p.id] : undefined, n: st.meet.lines.length } : null,
    ej: st.ej && st.ph === 'eject' ? st.ej : null,
    over: st.over || null
  };
}
const api = { ROOMS, CORR, LINKS, ST, BTN, VENTS, nearVent, COLORS, CNAMES, R, KR, RR, UR, VIS, VIS_IMP, DIFF, newGame, step, act, view, tasksDone, nearKill, nearBody, nearStation, nearButton, walk, roomAt, route, check, P, d2 };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IMP = api;
})(typeof window !== 'undefined' ? window : this);
