
(function(){
'use strict';
const S = {};
S.version = window.GAME_VERSION || '1.0.0';
S.slug = window.GAME_SLUG || 'game';
S.store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};
S.$ = (q, r) => (r || document).querySelector(q);
S.$$ = (q, r) => Array.from((r || document).querySelectorAll(q));
const K = (k) => S.slug + '.' + k;
S.settings = S.store.get(K('set'), { snd: true, vib: true });
let AC = null, master = null;
S.audio = {
  ctx(){
    if (!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.45; master.connect(AC.destination); }catch(e){ AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume().catch(()=>{});
    return AC;
  },
  tone(f, dur, type, vol, f2, delay){
    if (!S.settings.snd) return; const c = this.ctx(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol, hp, delay){
    if (!S.settings.snd) return; const c = this.ctx(); if (!c) return;
    const t = c.currentTime + (delay || 0);
    const n = Math.max(1, Math.floor(c.sampleRate * dur)); const b = c.createBuffer(1, n, c.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(); s.buffer = b; const g = c.createGain(); g.gain.value = vol || 0.2;
    const fl = c.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = hp || 400;
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
  },
  seq(notes, type, vol, step){ notes.forEach((f, i) => { if (f) this.tone(f, (step || 0.1) * 0.9, type || 'triangle', vol || 0.15, null, i * (step || 0.1)); }); },
  win(){ this.seq([523, 659, 784, 1047], 'triangle', 0.18, 0.11); },
  lose(){ this.seq([392, 330, 262, 196], 'sawtooth', 0.1, 0.14); },
  click(){ this.tone(660, 0.05, 'square', 0.08); }
};
S.vibrate = (ms) => { try{ const ua = navigator.userActivation; if (ua && !ua.hasBeenActive) return; if (S.settings.vib && navigator.vibrate) navigator.vibrate(ms); }catch(e){} };
S.fitCanvas = (cv) => {
  const r = cv.getBoundingClientRect();
  let dpr = Math.min(window.devicePixelRatio || 1, 3);
  if (r.width * r.height * dpr * dpr > 9e6) dpr = Math.max(1, Math.min(dpr, 2));
  const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  return { w: r.width, h: r.height, dpr };
};
S.show = (id) => {
  S.$$('.screen').forEach(el => { const on = el.id === id; el.classList.toggle('on', on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); if (on) el.removeAttribute('inert'); else el.setAttribute('inert', ''); });
  S.current = id;
};
S.sheet = (id, open) => {
  const el = document.getElementById(id); if (!el) return;
  el.classList.toggle('on', !!open); el.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) el.removeAttribute('inert'); else el.setAttribute('inert', '');
};
S.toast = (txt, ms) => {
  let t = S.$('#toast'); if (!t){ t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = txt; t.classList.add('on'); clearTimeout(S._tt); S._tt = setTimeout(() => t.classList.remove('on'), ms || 1800);
};
S.isTyping = (e) => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
S.fmt = (n) => { n = Math.round(n || 0); return n.toLocaleString('en-US'); };
S.rnd = (seed) => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };
S.rr = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
S.txt = (c, s, x, y, size, col, align, head) => { c.font = head ? (size + "px 'Secular One', Heebo, sans-serif") : ('800 ' + size + 'px Heebo, sans-serif'); c.fillStyle = col; c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };

S.fx = {
  parts: [], texts: [], sh: 0,
  burst(x, y, col, n, spd, life){ for (let i = 0; i < (n || 12); i++){ const a = Math.random() * 6.283, v = (spd || 160) * (0.3 + Math.random()); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: (life || 0.7) * (0.6 + Math.random() * 0.6), m: 0, c: Array.isArray(col) ? col[i % col.length] : col, r: 2 + Math.random() * 4 }); } if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600); },
  text(x, y, s, col, size){ this.texts.push({ x, y, s, c: col || '#B6F03C', l: 1, z: size || 22 }); },
  shake(a){ this.sh = Math.max(this.sh, a); },
  clear(){ this.parts.length = 0; this.texts.length = 0; this.sh = 0; },
  update(dt){
    for (const p of this.parts){ p.m += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.98; }
    this.parts = this.parts.filter(p => p.m < p.l);
    for (const t of this.texts){ t.l -= dt * 0.9; t.y -= 40 * dt; }
    this.texts = this.texts.filter(t => t.l > 0);
    this.sh = Math.max(0, this.sh - dt * 30);
  },
  draw(c){
    for (const p of this.parts){ c.globalAlpha = Math.max(0, 1 - p.m / p.l); c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill(); }
    c.globalAlpha = 1;
    for (const t of this.texts){ c.globalAlpha = Math.min(1, t.l * 2); c.lineWidth = 4; c.strokeStyle = '#14121F'; c.font = "800 " + t.z + "px Heebo, sans-serif"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.strokeText(t.s, t.x, t.y); c.fillStyle = t.c; c.fillText(t.s, t.x, t.y); }
    c.globalAlpha = 1;
  }
};

let D = null, st = null, loopOn = false, paused = false, ended = false, lastSave = 0, cv, ctx, W = 390, H = 844, DPR = 1;
S.prog = {};
S.saveProg = () => S.store.set(K('prog'), S.prog);
S.saveSet = () => S.store.set(K('set'), S.settings);
S.state = () => st;
S.inGame = () => S.current === 'game' && !!st && !ended;
S.size = () => ({ w: W, h: H });

function resize(){ if (!cv) return; const r = S.fitCanvas(cv); W = r.w; H = r.h; DPR = cv.width / Math.max(1, r.w); if (D && D.resize && st) D.resize(st, W, H); }
function liveSave(force){
  if (!st || ended || !D.serialize || (D.noSave && D.noSave(st))) return;
  const now = performance.now(); if (!force && now - lastSave < 1500) return; lastSave = now;
  S.store.set(K('live'), { v: S.version, mode: st.mode, s: D.serialize(st) });
  try{ sessionStorage.setItem(K('on'), '1'); }catch(e){}
}
function clearLive(){ S.store.del(K('live')); try{ sessionStorage.removeItem(K('on')); }catch(e){} }
function hud(){
  if (!D.hud || !st) return;
  const items = D.hud(st) || [];
  const html = items.map(i => '<span class="pill ' + (i.c || '') + '">' + i.t + '</span>').join('');
  const h = S.$('#hud'); if (h._last !== html){ h.innerHTML = html; h._last = html; }
}
function stepOnce(dt){
  if (!st || ended) return;
  if (D.step) D.step(st, dt);
  const res = D.over && D.over(st);
  if (res) finish(res);
}
function frame(now){
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000); frame.last = now;
  if (S.current === 'game' && st){
    if ((!paused || (D.noSave && D.noSave(st))) && !ended){ frame.acc = (frame.acc || 0) + dt; let n = 0; while (frame.acc >= 1 / 60 && n < 6){ stepOnce(1 / 60); frame.acc -= 1 / 60; n++; } if (n >= 6) frame.acc = 0; liveSave(false); }
    S.fx.update(dt);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (S.fx.sh > 0){ ctx.translate((Math.random() - 0.5) * S.fx.sh, (Math.random() - 0.5) * S.fx.sh); }
    D.draw(ctx, W, H, now / 1000, st);
    S.fx.draw(ctx);
    hud();
  } else if (S.current === 'menu' && D.logo){
    const lc = S.$('#logo'); if (lc){ const r = S.fitCanvas(lc); const c = lc.getContext('2d'); c.setTransform(lc.width / r.w, 0, 0, lc.width / r.w, 0, 0); D.logo(c, r.w, r.h, now / 1000); }
  }
  requestAnimationFrame(frame);
}
function menu(){
  S.show('menu'); paused = false;
  const m = S.$('#modes'); m.innerHTML = '';
  (D.modes || []).forEach(md => {
    const b = document.createElement('button'); b.className = 'btn mode'; b.dataset.mode = md.id;
    const locked = D.locked && D.locked(md.id);
    b.innerHTML = '<span class="ic">' + (locked ? '🔒' : md.ic) + '</span><span><b>' + md.name + '</b><small>' + (locked ? locked : md.desc) + '</small></span><span class="st">' + ((D.modeStatus && D.modeStatus(md.id)) || '') + '</span>';
    if (locked) b.disabled = true;
    b.onclick = () => { S.audio.click(); if (md.click) md.click(); else start(md.id); };
    m.appendChild(b);
  });
  const live = S.store.get(K('live'), null);
  const cb = S.$('#bCont'); cb.style.display = live && D.deserialize ? '' : 'none';
  S.$('#best').textContent = (D.bestLine && D.bestLine()) || '';
}
function start(mode, opts){
  S.audio.ctx(); S.fx.clear(); ended = false; paused = false;
  S.sheet('sheetEnd', false); S.sheet('sheetPause', false);
  S.show('game'); resize();
  st = D.newGame(mode, W, H, opts || {}); st.mode = mode;
  if (D.controls) D.controls(st);
  liveSave(true);
  showHint();
}
function resume(){
  const live = S.store.get(K('live'), null); if (!live || !D.deserialize) return false;
  S.fx.clear(); ended = false; paused = false; S.show('game'); resize();
  try{ st = D.deserialize(live.s, W, H); st.mode = live.mode; }catch(e){ clearLive(); menu(); return false; }
  if (D.controls) D.controls(st);
  return true;
}
function showHint(){
  if (!D.hint) return; const seen = S.store.get(K('hint'), 0); if (seen >= 2) return;
  S.store.set(K('hint'), seen + 1);
  const h = document.createElement('div'); h.className = 'hint'; h.textContent = typeof D.hint === 'function' ? D.hint(st) : D.hint;
  S.$('#game').appendChild(h); setTimeout(() => h.classList.add('off'), 3200); setTimeout(() => h.remove(), 3800);
}
function finish(res){
  if (ended) return; ended = true; clearLive();
  if (D.onEnd) D.onEnd(st, res); S.saveProg();
  if (res.win) S.audio.win(); else S.audio.lose();
  S.vibrate(res.win ? [30, 40, 30] : 120);
  setTimeout(() => {
    S.$('#endT').textContent = res.title || (res.win ? 'ניצחון!' : 'נגמר');
    S.$('#endStars').textContent = res.stars != null ? ('★'.repeat(res.stars) + '☆'.repeat(Math.max(0, 3 - res.stars))) : '';
    S.$('#endStats').innerHTML = (res.stats || []).map(s => '<div><b>' + s[1] + '</b>' + s[0] + '</div>').join('');
    const nb = S.$('#bNext'); nb.style.display = res.next ? '' : 'none'; nb.onclick = () => { S.audio.click(); start(res.next); };
    S.sheet('sheetEnd', true);
  }, res.delay != null ? res.delay : 700);
}
S.finish = finish;
function pause(on){ if (!S.inGame()) return; paused = on; S.sheet('sheetPause', on); if (on) liveSave(true); }
S.pause = pause;
S.isPaused = () => paused;

S.run = (def) => {
  D = def; window.G = S;
  S.prog = S.store.get(K('prog'), def.prog0 ? def.prog0() : {});
  cv = S.$('#cv'); ctx = cv.getContext('2d');
  S.$('#howBody').innerHTML = def.howHTML || '';
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { S.audio.ctx(); if (!S.inGame() || paused) return; try{ cv.setPointerCapture(e.pointerId); }catch(_){}; const [x, y] = pt(e); D.down && D.down(st, x, y, e.pointerId); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (!S.inGame() || paused) return; const [x, y] = pt(e); D.move && D.move(st, x, y, e.pointerId); });
  const up = e => { if (!S.inGame() || paused) return; const [x, y] = pt(e); D.up && D.up(st, x, y, e.pointerId); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  window.addEventListener('keydown', e => {
    if (S.isTyping(e)) return;
    if (e.code === 'Escape' && S.current === 'game'){ pause(!paused); return; }
    if (S.inGame() && !paused && D.key){ if (D.key(st, e.code, true) !== false) e.preventDefault(); }
  });
  window.addEventListener('keyup', e => { if (S.isTyping(e)) return; if (S.inGame() && !paused && D.key) D.key(st, e.code, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden){ liveSave(true); if (S.inGame() && !paused && !(D.noSave && D.noSave(st))) pause(true); } });
  // Net games (host/guest) must keep simulating while the tab is hidden: rAF stops in background,
  // so a host switching apps would freeze the whole room. Timer ticks throttle to ~1Hz in background,
  // which keeps the sim and broadcasts alive until the tab returns.
  let bgT = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (S.inGame() && !paused && D.noSave && D.noSave(st) && !bgT) {
        frame.last = performance.now();
        bgT = setInterval(() => {
          if (!st || ended || paused || S.current !== 'game') return;
          const now = performance.now(); let dt = (now - (frame.last || now)) / 1000; frame.last = now;
          if (dt > 1.5) dt = 1.5;
          frame.acc = (frame.acc || 0) + dt; let n = 0;
          while (frame.acc >= 1 / 60 && n < 90) { stepOnce(1 / 60); frame.acc -= 1 / 60; n++; }
          if (frame.acc > 0.5) frame.acc = 0;
        }, 250);
      }
    } else if (bgT) { clearInterval(bgT); bgT = null; frame.last = performance.now(); }
  });
  window.addEventListener('pagehide', () => liveSave(true));
  S.$('#bCont').onclick = () => { S.audio.click(); resume(); };
  S.$('#bHow').onclick = () => { S.audio.click(); S.sheet('sheetHow', true); };
  S.$('#bHowX').onclick = () => S.sheet('sheetHow', false);
  S.$('#bSet').onclick = () => { S.audio.click(); syncSet(); S.sheet('sheetSet', true); };
  S.$('#bSetX').onclick = () => S.sheet('sheetSet', false);
  S.$('#bSnd').onclick = () => { S.settings.snd = !S.settings.snd; S.saveSet(); syncSet(); S.audio.click(); };
  S.$('#bVib').onclick = () => { S.settings.vib = !S.settings.vib; S.saveSet(); syncSet(); };
  S.$('#bReset').onclick = () => { if (S.$('#bReset').dataset.sure){ S.prog = def.prog0 ? def.prog0() : {}; S.saveProg(); clearLive(); S.toast('ההתקדמות אופסה'); S.$('#bReset').dataset.sure = ''; S.$('#bReset').textContent = 'איפוס התקדמות'; menu(); S.sheet('sheetSet', false); } else { S.$('#bReset').dataset.sure = '1'; S.$('#bReset').textContent = 'לחיצה נוספת מאפסת'; } };
  S.$('#bPause').onclick = () => { S.audio.click(); pause(true); };
  S.$('#bMute').onclick = () => { S.settings.snd = !S.settings.snd; S.saveSet(); syncSet(); };
  S.$('#bResume').onclick = () => { S.audio.click(); pause(false); };
  S.$('#bRestart').onclick = () => { S.audio.click(); start(st.mode); };
  S.$('#bQuit').onclick = () => { S.audio.click(); liveSave(true); S.sheet('sheetPause', false); st = null; menu(); };
  S.$('#bAgain').onclick = () => { S.audio.click(); start(st.mode); };
  S.$('#bMenu').onclick = () => { S.audio.click(); S.sheet('sheetEnd', false); st = null; menu(); };
  syncSet();
  let session = false; try{ session = sessionStorage.getItem(K('on')) === '1'; }catch(e){}
  if (!(session && resume())) menu();
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/[?&]nosw=1/.test(location.search)) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js?v=' + S.version).catch(() => {}));
};
function syncSet(){
  S.$('#bSnd').textContent = S.settings.snd ? 'פועל 🔊' : 'כבוי 🔇';
  S.$('#bVib').textContent = S.settings.vib ? 'פועל' : 'כבוי';
  S.$('#bMute').textContent = S.settings.snd ? '🔊' : '🔇';
}
S.debug = {
  start(mode, opts){ start(mode || (D.modes && D.modes[0].id), opts); return true; },
  play(sec, bot){ if (!st) return false; const n = Math.round((sec || 10) * 60); for (let i = 0; i < n && !ended; i++){ if (bot !== false && D.bot) D.bot(st, 1 / 60); stepOnce(1 / 60); } return true; },
  finish(win){ if (!st) return false; if (D.forceEnd) D.forceEnd(st, win !== false); const r = D.over && D.over(st); if (r) finish(Object.assign({}, r, { delay: 0 })); return true; },
  menu(){ S.sheet('sheetEnd', false); st = null; menu(); }
};
window.Shell = S;
})();
