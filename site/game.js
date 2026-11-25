(function () {
'use strict';
const S = window.Shell, I = window.IMP, NS = 'hamitchaze';
const TAU = Math.PI * 2;
const NET = (window.OnlineNet && window.OnlineNet.make) ? window.OnlineNet.make({ ns: NS, ver: S.version }) : null;
const N = { role: null, code: null, H: null, G: null, lobby: [], st: '', named: false, playing: false };
let keys = new Set(), joy = null, stars = [], lastAct = '';
for (let i = 0; i < 260; i++) stars.push([Math.random() * 2200 - 400, Math.random() * 1900 - 400, Math.random() * 1.6 + 0.3, Math.random()]);
const lvl = () => 1 + Math.floor((S.prog.xp || 0) / 250);
const HATS = ['ללא', 'כתר', 'כובע מצחייה', 'פרח', 'צילינדר', 'אוזניות', 'קרניים'];
function myName() { return window.TabName ? TabName.get(NS) : 'אני'; }
const A = S.audio;
const SFX = {
  kill() { A.noise(0.25, 0.35, 300); A.tone(120, 0.4, 'sawtooth', 0.25, 40); },
  task() { A.seq([660, 880, 1320], 'triangle', 0.16, 0.07); },
  alarm() { for (let i = 0; i < 3; i++) { A.tone(880, 0.18, 'square', 0.14, 660, i * 0.25); } },
  vote() { A.tone(520, 0.08, 'square', 0.12); },
  eject() { A.noise(1.2, 0.18, 800); A.tone(300, 1.2, 'sine', 0.1, 60); },
  step() { A.tone(90, 0.04, 'triangle', 0.05); },
  bad() { A.tone(180, 0.15, 'square', 0.12, 120); }
};
const css = document.createElement('style');
css.textContent = `
#acts{position:absolute;left:10px;bottom:calc(12px + env(safe-area-inset-bottom,0px));display:flex;gap:8px;flex-direction:row;z-index:5}
#acts button{width:64px;height:64px;border-radius:18px;border:3px solid #14121F;font:700 13px/1.05 Heebo,sans-serif;color:#14121F;background:#F5F0E6;box-shadow:0 4px 0 #14121F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;touch-action:manipulation}
#acts button span{font-size:22px}#acts button:disabled{opacity:.32;filter:grayscale(1)}
#acts button:not(:disabled){animation:actP 1.1s ease-in-out infinite}@keyframes actP{50%{transform:translateY(-3px);box-shadow:0 7px 0 #14121F,0 0 0 5px rgba(182,240,60,.45)}}
@media (max-width:600px){#acts button{width:74px;height:74px;font-size:14px}#acts button span{font-size:26px}}
@media (prefers-reduced-motion:reduce){#acts button{animation:none!important}}
#acts .k{background:#FF5B2E;color:#fff}#acts .r{background:#FFC93C}#acts .u{background:#B6F03C}#acts .e{background:#FF7CC8}
.ov{position:fixed;inset:0;z-index:50;background:rgba(10,9,24,.82);display:flex;align-items:center;justify-content:center;padding:12px;direction:rtl;font-family:Heebo,sans-serif}
.ov[hidden]{display:none}
.ov .box{background:#F5F0E6;color:#14121F;border:3px solid #14121F;border-radius:22px;box-shadow:0 8px 0 #14121F;width:min(96vw,460px);max-height:94vh;overflow:auto;padding:14px 14px 12px;text-align:center}
.ov h2{font-family:'Secular One',sans-serif;margin:2px 0 8px;font-size:22px}
.ov .x{float:left;width:44px;height:44px;border-radius:12px;border:2px solid #14121F;background:#fff;font-size:20px}
.ov .bb{min-height:48px;border-radius:14px;border:3px solid #14121F;background:#B6F03C;font:700 17px Heebo,sans-serif;padding:8px 14px;margin:4px;box-shadow:0 3px 0 #14121F;color:#14121F}
.ov .bb.alt{background:#fff}.ov .bb.hot{background:#FF5B2E;color:#fff}
.mg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}
.mg-grid button{min-height:58px;font:800 24px Heebo,sans-serif;border-radius:14px;border:3px solid #14121F;background:#fff;color:#14121F}
.mg-grid button.on{background:#B6F03C}
.mg-bar{height:22px;border:3px solid #14121F;border-radius:12px;background:#fff;overflow:hidden;margin:10px 0}.mg-bar i{display:block;height:100%;background:#3B4BFF;width:0}
.mg-code{font:800 34px/1 'Secular One',monospace;letter-spacing:.3em;direction:ltr;margin:6px 0}
.mg-in{font:800 30px/1 monospace;letter-spacing:.25em;direction:ltr;min-height:40px;border-bottom:3px dashed #14121F;margin:4px auto 6px;width:180px}
.mg-track{position:relative;height:56px;border:3px solid #14121F;border-radius:14px;background:#fff;margin:12px 0;overflow:hidden}.mg-track .z{position:absolute;top:0;bottom:0;background:#B6F03C}.mg-track .n{position:absolute;top:0;bottom:0;width:6px;background:#FF5B2E}
.mt-l{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
.mt-l button{display:flex;align-items:center;gap:8px;min-height:50px;border-radius:14px;border:3px solid #14121F;background:#fff;font:700 15px Heebo,sans-serif;padding:4px 8px;color:#14121F;text-align:right}
.mt-l button.dead{opacity:.35;text-decoration:line-through}.mt-l button.sel{background:#B6F03C}
.mt-l i{width:22px;height:22px;border-radius:50%;border:2px solid #14121F;flex:none}
.mt-chat{background:#14121F;color:#F5F0E6;border-radius:12px;padding:8px;text-align:right;font-size:14px;max-height:150px;overflow:auto;margin:6px 0}
.mt-chat div{margin:3px 0}.mt-chat b{color:#B6F03C}
.lb-code{font:800 44px/1 'Secular One',monospace;letter-spacing:.25em;direction:ltr;color:#3B4BFF;margin:4px 0}
.lb-pl{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}.lb-pl span{background:#fff;border:2px solid #14121F;border-radius:999px;padding:5px 10px;font-weight:700}
.lb-st{min-height:22px;font-weight:700;color:#3B4BFF}
.mt-chat i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:5px;border:1px solid #F5F0E6;vertical-align:middle}
.mt-chat div.mine{background:rgba(182,240,60,.14);border-radius:8px;padding:1px 4px}
.mt-q{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin:4px 0 2px}
.mt-q button{min-height:44px;border-radius:999px;border:2px solid #14121F;background:#fff;color:#14121F;font:700 14px Heebo,sans-serif;padding:4px 11px;box-shadow:0 2px 0 #14121F}
.mt-q button:active{transform:translateY(2px);box-shadow:none}
.mt-q.rooms button.here{background:#B6F03C}
.mt-qh{font-weight:700;font-size:14px;margin:6px 0 2px;color:#14121F}
.mt-x{min-height:44px;border-radius:12px;border:2px solid #14121F;background:#fff;font:700 13px Heebo,sans-serif;padding:2px 10px;margin-inline-start:6px}
.mt-l.picking button:not([disabled]){background:#FFE07A;animation:mtp 1s ease-in-out infinite}
@keyframes mtp{50%{transform:scale(1.03)}}
@media (prefers-reduced-motion:reduce){.mt-l.picking button{animation:none}}
#meet .mt-chat{max-height:132px}
@media (orientation:landscape) and (max-height:520px),(min-width:900px){#meet .box{width:min(96vw,880px)}#meet .mt-body{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}#meet .mt-chat{max-height:none;height:min(34vh,260px);margin-top:0}#meet .mt-l{margin-top:0}}
@media (orientation:landscape) and (max-height:520px){#meet .box{padding:8px 10px}#meet h2{font-size:18px;margin:0 0 4px}#meet .mt-chat{height:116px;font-size:13px}#meet .mt-l button{min-height:44px;font-size:14px}#meet .bb{min-height:44px;margin:2px}#meet .mt-q button{font-size:13px;padding:3px 9px}}
.sw{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}.sw button{width:46px;height:46px;border-radius:50%;border:3px solid #14121F}.sw button.on{outline:4px solid #FF5B2E}
.sw.h button{border-radius:12px;width:auto;padding:0 10px;background:#fff;font:700 13px Heebo,sans-serif}
`;
document.head.appendChild(css);
function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
const acts = el('<div id="acts"><button class="u" id="aUse" aria-label="השתמש"><span>✋</span>השתמש</button><button class="r" id="aRep" aria-label="דווח"><span>📢</span>דווח</button><button class="e" id="aSaw" aria-label="ראיתי חיסול" style="display:none"><span>👀</span>ראיתי!</button><button class="e" id="aVent" aria-label="פתח איוורור" style="display:none"><span>🕳️</span>פתח</button><button class="k" id="aKill" aria-label="חסל" style="display:none"><span>🗡️</span>חסל</button></div>');
document.getElementById('game').appendChild(acts);
const mini = el('<div class="ov" id="mini" hidden><div class="box"></div></div>'); document.body.appendChild(mini);
const meet = el('<div class="ov" id="meet" hidden><div class="box"></div></div>'); document.body.appendChild(meet);
const lobby = el('<div class="ov" id="lobby" hidden><div class="box"></div></div>'); document.body.appendChild(lobby);
const look = el('<div class="ov" id="look" hidden><div class="box"></div></div>'); document.body.appendChild(look);
function cur() { return S.state(); }
function doAct(a, arg) {
  const st = cur(); if (!st) return false;
  if (st.net === 'guest') { if (N.G) N.G.send({ t: 'act', a, arg }); return true; }
  return I.act(st.sim, st.me, a, arg);
}
function myP(v) { return v && v.pl.find(p => p.id === v.me); }
function near(v, list, r) { const m = myP(v); if (!m) return null; let best = null, bd = r; for (const o of list) { const d = Math.hypot(o.x - m.x, o.y - m.y); if (d < bd) { bd = d; best = o; } } return best; }
function avail(v) {
  const m = myP(v); const o = { use: null, rep: null, kill: null, btn: false, saw: null, vent: -1 };
  if (!v || v.ph !== 'play' || !m) return o;
  for (const t of v.tk) { if (t.d) continue; const s = I.ST[t.s]; if (Math.hypot(s.x - m.x, s.y - m.y) < I.UR) { o.use = s; break; } }
  if (m.a) { o.rep = near(v, v.bo, I.RR); if (v.btn > 0 && Math.hypot(I.BTN.x - m.x, I.BTN.y - m.y) < I.UR + 10) o.btn = true;
    if (v.imp && v.kcd <= 0) o.kill = near(v, v.pl.filter(p => p.a && p.i !== 1 && p.id !== v.me), I.KR); }
  if (v.saw) o.saw = v.saw;
  if (v.vn >= 0 && v.vcd <= 0) o.vent = v.vn;
  return o;
}
function updActs(st) {
  const v = st.view; const o = avail(v); const m = myP(v);
  const sig = [!!(o.use || o.btn), !!o.rep, !!o.kill, v && v.imp && m && m.a, v && v.kcd, v && v.vcd, v && v.ph, !!o.saw, o.vent].join(',');
  if (sig === lastAct) return; lastAct = sig;
  const u = S.$('#aUse'), r = S.$('#aRep'), k = S.$('#aKill'), sw = S.$('#aSaw'), vt = S.$('#aVent');
  u.disabled = !(o.use || o.btn); u.innerHTML = o.btn && !o.use ? '<span>🚨</span>חירום' : '<span>✋</span>השתמש';
  r.disabled = !o.rep; k.style.display = v && v.imp && m && m.a ? '' : 'none'; k.disabled = !o.kill;
  k.innerHTML = '<span>🗡️</span>' + (v && v.kcd > 0 ? v.kcd + ' שנ׳' : 'חסל');
  sw.style.display = o.saw ? '' : 'none'; sw.disabled = !o.saw;
  if (o.saw) sw.innerHTML = '<span>👀</span>ראיתי! ' + o.saw.left;
  vt.style.display = v && v.imp && m && m.a ? '' : 'none'; vt.disabled = o.vent < 0;
  vt.innerHTML = '<span>🕳️</span>' + (v && v.vcd > 0 ? v.vcd + ' שנ׳' : 'פתח');
  acts.style.display = v && v.ph === 'play' ? '' : 'none';
}
function useAct() {
  const st = cur(); if (!st || !st.view) return; const o = avail(st.view);
  if (o.use) { const m = myP(st.view); if (st.view.imp) { doAct('task', o.use.i); S.toast('מעמיד/ה פנים… 😏'); return; } openMini(o.use); return; }
  if (o.btn) { doAct('button'); }
}
S.$('#aUse').onclick = () => { A.click(); useAct(); };
S.$('#aRep').onclick = () => { doAct('report'); };
S.$('#aKill').onclick = () => { doAct('kill'); };
S.$('#aSaw').onclick = () => { A.click(); doAct('saw'); };
S.$('#aVent').onclick = () => {
  A.click(); const st = cur(); if (!st || !st.view) return; const v = st.view;
  const nv = v.vn >= 0 ? I.VENTS[v.vn] : null; if (!nv || v.vcd > 0) return;
  if (nv.links.length === 1) { doAct('vent', nv.links[0]); }
  else { const pick = nv.links[0]; doAct('vent', pick); }
};
let mg = null;
function closeMini() { mini.hidden = true; if (mg && mg.iv) clearInterval(mg.iv); mg = null; }
function winMini() { const s = mg.s; closeMini(); if (doAct('task', s.i)) { SFX.task(); S.toast('✔ ' + s.n); S.vibrate(30); } }
function openMini(s) {
  closeMini(); mg = { s }; const b = mini.querySelector('.box'); mini.hidden = false;
  let h = '<button class="x" aria-label="סגירה">✕</button><h2>' + s.n + '</h2>';
  if (s.type === 'hold') {
    b.innerHTML = h + '<p>החזיקו את הכפתור עד שהפס מתמלא</p><div class="mg-bar"><i></i></div><button class="bb" id="mgH" style="width:100%;min-height:70px">✋ החזיקו</button>';
    let v = 0, on = false; const bar = b.querySelector('i'), bt = b.querySelector('#mgH');
    const st = e => { on = true; e.preventDefault(); }, sp = () => { on = false; };
    bt.addEventListener('pointerdown', st); ['pointerup', 'pointerleave', 'pointercancel'].forEach(k => bt.addEventListener(k, sp));
    mg.key = (c, d) => { if (c === 'Space' || c === 'KeyE') on = d; };
    mg.iv = setInterval(() => { v = on ? v + 0.05 / 2.4 : Math.max(0, v - 0.01); bar.style.width = (v * 100) + '%'; if (on && Math.random() < 0.3) A.tone(200 + v * 500, 0.05, 'sine', 0.05); if (v >= 1) winMini(); }, 50);
  } else if (s.type === 'seq') {
    const nums = [1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5); let nx = 1;
    b.innerHTML = h + '<p>לחצו על המספרים לפי הסדר: 1 עד 6</p><div class="mg-grid">' + nums.map(n => '<button data-n="' + n + '">' + n + '</button>').join('') + '</div>';
    b.querySelectorAll('[data-n]').forEach(bt => bt.onclick = () => { const n = +bt.dataset.n; if (n === nx) { bt.classList.add('on'); A.tone(400 + n * 80, 0.08, 'triangle', 0.12); nx++; if (nx > 6) setTimeout(winMini, 200); } else { SFX.bad(); nx = 1; b.querySelectorAll('[data-n]').forEach(x => x.classList.remove('on')); } });
  } else if (s.type === 'code') {
    const code = String(1000 + Math.floor(Math.random() * 9000)); let typed = '';
    b.innerHTML = h + '<p>הקלידו את הקוד</p><div class="mg-code">' + code + '</div><div class="mg-in"></div><div class="mg-grid">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✔'].map(n => '<button data-k="' + n + '">' + n + '</button>').join('') + '</div>';
    const out = b.querySelector('.mg-in');
    const press = k => { if (k === '⌫') typed = typed.slice(0, -1); else if (k === '✔') { if (typed === code) { winMini(); return; } SFX.bad(); typed = ''; } else if (typed.length < 4) { typed += k; A.tone(500 + (+k) * 40, 0.05, 'square', 0.08); if (typed === code) { setTimeout(winMini, 150); } } out.textContent = typed; };
    b.querySelectorAll('[data-k]').forEach(bt => bt.onclick = () => press(bt.dataset.k));
    mg.key = (c, d) => { if (!d) return; const m = /^(Digit|Numpad)(\d)$/.exec(c); if (m) press(m[2]); else if (c === 'Backspace') press('⌫'); else if (c === 'Enter') press('✔'); };
  } else {
    let hits = 0, x = 0, dir = 1, z0 = 0.35 + Math.random() * 0.35;
    b.innerHTML = h + '<p>לחצו כשהמחוג בתוך האזור הירוק (3 פעמים)</p><div class="mg-track"><div class="z"></div><div class="n"></div></div><div class="lb-st" id="mgT">0/3</div><button class="bb" id="mgS" style="width:100%;min-height:64px">🎯 עכשיו!</button>';
    const z = b.querySelector('.z'), n = b.querySelector('.n'); const setZ = () => { z.style.left = (z0 * 100) + '%'; z.style.width = '16%'; }; setZ();
    mg.iv = setInterval(() => { x += dir * (0.018 + hits * 0.006); if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } n.style.left = 'calc(' + (x * 100) + '% - 3px)'; }, 16);
    const shot = () => { if (x >= z0 && x <= z0 + 0.16) { hits++; A.tone(600 + hits * 200, 0.1, 'triangle', 0.14); b.querySelector('#mgT').textContent = hits + '/3'; z0 = 0.05 + Math.random() * 0.75; setZ(); if (hits >= 3) setTimeout(winMini, 150); } else { SFX.bad(); } };
    b.querySelector('#mgS').onclick = shot; mg.key = (c, d) => { if (d && (c === 'Space' || c === 'KeyE')) shot(); };
  }
  b.querySelector('.x').onclick = closeMini;
}
let meetSig = '', chatMode = null;
const QC = [['me', '📍 הייתי ב…'], ['sus', '🤨 חושד/ת ב…'], ['safe', '👍 מישהו בסדר'], ['where', '❓ איפה היית?'], ['tasks', '✔ עשיתי משימות'], ['body', '🔎 מי היה ליד הגופה?'], ['notme', '😤 זה לא אני!'], ['skip', '🤷 בואו נדלג'], ['agree', '👆 מסכים/ה']];
function sendChat(code) { const ok = doAct('chat', code); chatMode = null; meetSig = ''; if (ok) A.click(); else S.toast('רגע… עוד שנייה'); }
function drawMeet(st) {
  const v = st.view; if (!v || (v.ph !== 'meet')) { if (!meet.hidden) { meet.hidden = true; meetSig = ''; chatMode = null; } return; }
  closeMini();
  const m = v.meet; const me = myP(v);
  const stTxt = (m.stage === 'talk' ? '💬 דיון: ' + m.left + ' שנ׳' : '🗳️ הצבעה: ' + m.left + ' שנ׳') + (me && !me.a ? ' · את/ה רוח, צופה בלבד' : '');
  const sig = [m.stage, m.voted.join(), m.mine, m.n != null ? m.n : m.lines.length, m.lines.length, chatMode, me && me.a].join('|');
  if (sig === meetSig) { const el = meet.querySelector('.lb-st'); if (el && el.textContent !== stTxt) el.textContent = stTxt; return; }
  if (meet.hidden) { meet.hidden = false; chatMode = null; }
  meetSig = sig; const nm = id => (v.pl.find(p => p.id === id) || {}).n || '?'; const col = id => { const p = v.pl.find(p => p.id === id); return p ? I.COLORS[p.c] : '#999'; };
  const head = m.wit ? '👀 ' + nm(m.wit.by) + ' ראה/תה את ' + nm(m.wit.k) + ' חוסל/ת' + (m.wit.v ? ' את ' + nm(m.wit.v) : '') + '!' : (m.body ? '📢 ' + nm(m.by) + ' מצא/ה את ' + nm(m.body) + ' ב' + (I.ROOMS[m.br] || {}).n : '🚨 ' + nm(m.by) + ' כינס/ה ישיבת חירום');
  const canVote = m.stage === 'vote' && me && me.a && m.mine == null;
  const canChat = !!(me && me.a);
  const picking = chatMode === 'sus' || chatMode === 'safe' || chatMode === 'where';
  const b = meet.querySelector('.box');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let quick = '';
  if (canChat) {
    if (chatMode === 'me') { const order = [m.myr].concat(I.ROOMS.map((r, i) => i).filter(i => i !== m.myr)).filter(i => i != null && I.ROOMS[i]);
      quick = '<div class="mt-qh">איפה היית? <button class="mt-x" data-q="cancel">ביטול</button></div><div class="mt-q rooms">' + order.map(i => '<button data-q="me:' + i + '"' + (i === m.myr ? ' class="here"' : '') + '>' + (i === m.myr ? '📍 ' : '') + I.ROOMS[i].n + '</button>').join('') + '</div>'; }
    else if (picking) quick = '<div class="mt-qh">' + (chatMode === 'sus' ? '🤨 במי את/ה חושד/ת?' : chatMode === 'safe' ? '👍 מי בסדר?' : '❓ את מי לשאול?') + ' בחרו שחקן/ית למטה <button class="mt-x" data-q="cancel">ביטול</button></div>';
    else quick = '<div class="mt-q">' + QC.filter(([k]) => k !== 'body' || m.body).map(([k, t]) => '<button data-q="' + k + '">' + t + '</button>').join('') + '</div>';
  } else quick = '<div class="mt-qh">' + (me && !me.a ? '👻 רוחות לא מדברות בישיבה' : '') + '</div>';
  b.innerHTML = '<h2>' + head + '</h2><div class="lb-st">' + stTxt + '</div>' +
    '<div class="mt-body"><div class="mt-side"><div class="mt-chat" role="log" aria-live="polite">' + (m.lines.length ? m.lines.map(l => '<div class="' + (l.id === v.me ? 'mine' : '') + '"><i style="background:' + col(l.id) + '"></i><b>' + esc(nm(l.id)) + ':</b> ' + esc(l.t) + '</div>').join('') : '<div>…</div>') + '</div>' + quick + '</div>' +
    '<div class="mt-vote"><div class="mt-l' + (picking ? ' picking' : '') + '">' + v.pl.map(p => { const en = picking ? (p.a && p.id !== v.me) : (canVote && p.a); return '<button data-v="' + p.id + '" class="' + (p.a ? '' : 'dead') + (m.mine === p.id ? ' sel' : '') + '"' + (en ? '' : ' disabled') + '><i style="background:' + I.COLORS[p.c] + '"></i><span>' + esc(p.n) + (p.id === v.me ? ' (את/ה)' : '') + (v.imp && p.i === 1 ? ' 🗡️' : '') + '</span><span style="margin-inline-start:auto">' + (m.voted.includes(p.id) ? '✉️' : '') + '</span></button>'; }).join('') + '</div>' +
    '<button class="bb alt" data-v="skip"' + (canVote && !picking ? '' : ' disabled') + '>' + (m.mine === 'skip' ? '✔ ' : '') + 'דילוג על הצבעה</button></div></div>';
  const ch = b.querySelector('.mt-chat'); if (ch) ch.scrollTop = ch.scrollHeight;
  b.querySelectorAll('[data-v]').forEach(bt => bt.onclick = () => { if (chatMode === 'sus' || chatMode === 'safe' || chatMode === 'where') { if (bt.dataset.v !== 'skip') sendChat(chatMode + ':' + bt.dataset.v); return; } if (doAct('vote', bt.dataset.v)) {} SFX.vote(); });
  b.querySelectorAll('[data-q]').forEach(bt => bt.onclick = () => { const q = bt.dataset.q; A.click();
    if (q === 'cancel') { chatMode = null; meetSig = ''; return; }
    if (q === 'me' || q === 'sus' || q === 'safe' || q === 'where') { chatMode = q; meetSig = ''; return; }
    sendChat(q); });
}
function inputVec() {
  let dx = 0, dy = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
  if (joy && joy.on) { dx = joy.dx; dy = joy.dy; }
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  if (!mini.hidden) { dx = 0; dy = 0; }
  return [dx, dy];
}
function makeSolo(mode, opts) {
  const role = mode === 'crew' ? 'crew' : mode === 'imp' ? 'imp' : null;
  const sim = I.newGame({ seed: (Date.now() % 1e9) | 0, role, n: mode === 'big' ? 9 : 6, diff: S.prog.diff || 'norm', humans: [{ id: 'p0', name: myName(), hat: S.prog.hat || 0 }], c0: S.prog.col != null ? S.prog.col : null });
  return { net: 'solo', sim, me: 'p0' };
}
function makeHost() {
  const humans = [{ id: 'host', name: myName(), hat: S.prog.hat || 0 }].concat(N.lobby.filter(x => x.on).map(x => ({ id: x.cid, name: x.name })));
  const sim = I.newGame({ seed: (Date.now() % 1e9) | 0, n: Math.max(6, humans.length + 1), diff: S.prog.diff || 'norm', humans, c0: S.prog.col != null ? S.prog.col : null });
  N.playing = true; lobby.hidden = true;
  N.lobby.forEach(x => { if (x.on) N.H.send(x.cid, { t: 'start' }); });
  return { net: 'host', sim, me: 'host', bt: 0 };
}
function setup(st) {
  st.rp = {}; st.evN = 0; st.ft = 0; st.inT = 0; st.cam = null; st.lastS = performance.now(); st.hostGone = false; closeMini(); meet.hidden = true; meetSig = ''; chatMode = null; lastAct = '';
  if (st.sim) st.view = I.view(st.sim, st.me);
  return st;
}
const DEF = {
  modes: [
    { id: 'crew', ic: '🧑‍🚀', name: 'צוות החללית', desc: '6 שחקנים · בצעו משימות וגלו מי המתחזה' },
    { id: 'imp', ic: '🗡️', name: 'אני המתחזה', desc: 'חסלו בשקט, הטעו בהצבעה' },
    { id: 'rnd', ic: '🎲', name: 'תפקיד אקראי', desc: 'כמו במשחק אמיתי: לא יודעים מראש' },
    { id: 'big', ic: '🛸', name: 'ספינה מלאה', desc: '9 שחקנים ושני מתחזים' },
    { id: 'online', ic: '🌐', name: 'חדר אונליין', desc: 'מזמינים חברים בקישור, בוטים ממלאים מקום', click: () => openHost() }
  ],
  prog0: () => ({ xp: 0, games: 0, wins: 0, impWins: 0, tasks: 0, col: null, hat: 0, diff: 'norm' }),
  locked: id => id === 'big' && (S.prog.games || 0) < 1 ? 'נפתח אחרי משחק ראשון' : null,
  modeStatus: id => '',
  bestLine: () => 'דרגה ' + lvl() + ' · ' + (S.prog.wins || 0) + ' ניצחונות מתוך ' + (S.prog.games || 0) + ' משחקים',
  howHTML: '<p><b>הצוות</b>: הסתובבו בחללית ובצעו את המשימות שלכם (✋ ליד עמדה מסומנת !). כשכל המשימות של כל הצוות נגמרות, הצוות מנצח.</p><p><b>המתחזה</b>: נראה כמו כולם, מעמיד פנים שעושה משימות, ומחסל (🗡️) כשאף אחד לא רואה. הוא מנצח כשנשארים מולו מעט מדי אנשי צוות.</p><p>מצאתם גופה? 📢 דווחו. חושדים? לחצו על כפתור החירום בקפיטריה. בישיבה כולם מדברים ואז מצביעים; מי שמקבל הכי הרבה קולות נזרק לחלל.</p><p><b>פתחי איוורור 🕳️:</b> המתחזה יכול לקפוץ בין פתחים מסומנים ברחבי החללית (V). ראיתם מישהו חוסל? כפתור <b>👀 ראיתי!</b> (F) מכנס ישיבה מיד עם העדות — זמין כמה שניות אחרי החיסול.</p><p>שליטה: גררו אצבע על המסך (או WASD/חיצים), E להשתמש, R לדווח, Q לחסל.</p><p>חדר אונליין: שלחו את הקישור לחברים, הם נכנסים ישר לחדר, ובוטים ממלאים את שאר המקומות.</p>',
  hint: st => st.view && st.view.imp ? 'את/ה המתחזה 🗡️ חסלו כשאף אחד לא רואה, ודווחו או ברחו' : 'את/ה בצוות 🧑‍🚀 לכו לעמדות המסומנות ב-! ולחצו ✋',
  newGame(mode, W, H, opts) {
    if (mode === 'guest') return setup({ net: 'guest', me: N.G ? N.G.cid || NET.cidFor(N.code) : null, view: null });
    if (mode === 'online') { if (!N.H) { return setup(makeSolo('rnd')); } return setup(makeHost()); }
    return setup(makeSolo(mode, opts));
  },
  serialize: st => st.net === 'solo' ? { sim: st.sim, me: st.me } : null,
  deserialize: (s) => { if (!s || !s.sim) throw new Error('no'); return setup({ net: 'solo', sim: s.sim, me: s.me }); },
  noSave: st => st && st.net !== 'solo',
  step(st, dt) {
    const v0 = inputVec();
    if (st.net === 'guest') {
      st.inT -= dt; if (st.inT <= 0 && N.G) { st.inT = 1 / 15; const k = v0.join(); if (k !== st.lastIn || Math.random() < 0.1) { N.G.send({ t: 'in', dx: v0[0], dy: v0[1] }); st.lastIn = k; } }
      if (st.nv) { st.view = st.nv; st.nv = null; }
      if (st.view && !st.view.over && st.lastS) {
        const gap = performance.now() - st.lastS; st.hostGone = gap > 8000;
        if (gap > 25000) { st.hostGone = false; S.toast('החיבור למארח אבד — חוזרים לתפריט'); leaveOnline(); S.debug.menu(); return; }
      } else st.hostGone = false;
    } else {
      st.sim.inp[st.me] = v0; I.step(st.sim, dt); st.view = I.view(st.sim, st.me);
      if (st.net === 'host') { st.bt -= dt; if (st.bt <= 0) { st.bt = 1 / 12; for (const p of st.sim.players) if (!p.bot && p.id !== 'host') N.H.send(p.id, { t: 's', v: I.view(st.sim, p.id), ev: st.sim.ev.slice(-6) }); } }
    }
    const v = st.view; if (!v) return;
    const evs = st.sim ? st.sim.ev : (st.gev || []);
    if (st.sim) { while (st.evN < st.sim.ev.length) fx(st, st.sim.ev[st.evN++]); if (st.sim.ev.length >= 40) { st.sim.ev.length = 0; st.evN = 0; } }
    else if (st.gev) { st.gev.forEach(e => fx(st, e)); st.gev = null; }
    for (const p of v.pl) { const r = st.rp[p.id] || (st.rp[p.id] = { x: p.x, y: p.y, w: 0 }); const k = st.net === 'guest' ? Math.min(1, dt * 14) : 1; if (Math.hypot(p.x - r.x, p.y - r.y) > 200) k === k && (r.x = p.x, r.y = p.y); r.x += (p.x - r.x) * k; r.y += (p.y - r.y) * k; if (p.m) r.w += dt * 10; }
    if (mg) { const o = avail(v); if (!o.use || o.use.i !== mg.s.i) closeMini(); }
    drawMeet(st); updActs(st);
    if (st.lastPh !== v.ph) { if (v.ph === 'eject') SFX.eject(); st.lastPh = v.ph; }
  },
  over(st) {
    const v = st.view; if (!v || !v.over) return null;
    const win = v.over.crew ? !v.imp : v.imp;
    const imps = v.pl.filter(p => p.i === 1).map(p => p.n).join(', ');
    return { win, title: win ? (v.imp ? 'המתחזה ניצח! 🗡️' : 'הצוות ניצח! 🎉') : (v.imp ? 'נתפסת…' : 'המתחזה ניצח'), stats: [[v.over.why, '📋'], ['המתחזים', imps], ['משימות', v.td + '/' + v.tt]], stars: win ? 3 : 0 };
  },
  onEnd(st, res) {
    const v = st.view; meet.hidden = true; closeMini();
    const done = v.tk.filter(t => t.d).length; S.prog.games = (S.prog.games || 0) + 1; if (res.win) { S.prog.wins = (S.prog.wins || 0) + 1; if (v.imp) S.prog.impWins = (S.prog.impWins || 0) + 1; }
    const l0 = lvl(); S.prog.xp = (S.prog.xp || 0) + 40 + (res.win ? 100 : 0) + (v.imp ? 0 : done * 10); S.prog.tasks = (S.prog.tasks || 0) + (v.imp ? 0 : done);
    res.stats.push(['דרגה', lvl() + (lvl() > l0 ? ' ⬆️ חדש!' : '')]);
    if (lvl() > l0) setTimeout(() => S.toast('עליתם דרגה! נפתח כובע חדש 🎩'), 900);
  },
  forceEnd(st, win) { if (st.sim) { st.sim.over = { crew: win ? !st.sim.players[0].imp : st.sim.players[0].imp, why: 'סיום' }; st.sim.ph = 'over'; st.view = I.view(st.sim, st.me); } },
  bot(st, dt) { if (st.sim) { const p = I.P(st.sim, st.me); if (p && !p.bot) { p.bot = true; st._bot = 1; } } },
  hud(st) {
    const v = st.view; if (!v) return [{ t: '⏳ מחכים למארח…' }];
    const m = myP(v); const room = m ? (I.ROOMS[I.roomAt(m.x, m.y)] || {}).n : '';
    const out = [{ t: (v.imp ? '🗡️ מתחזה' : '🧑‍🚀 צוות') + (m && !m.a ? ' 👻' : ''), c: v.imp ? 'hot' : '' }, { t: '📋 ' + v.td + '/' + v.tt }, { t: '📍 ' + room }];
    if (st.net !== 'solo') out.push({ t: '🌐 ' + (N.code || '') });
    return out;
  },
  controls(st) { },
  key(st, c, d) {
    if (mg && mg.key) { mg.key(c, d); return; }
    if (d) keys.add(c); else keys.delete(c);
    if (d && (c === 'KeyE' || c === 'Space')) useAct();
    if (d && c === 'KeyR') doAct('report');
    if (d && c === 'KeyQ') doAct('kill');
    if (d && c === 'KeyF') doAct('saw');
    if (d && c === 'KeyV') S.$('#aVent').click();
  },
  down(st, x, y, id) { if (joy && joy.on) return; joy = { on: true, id, ox: x, oy: y, x, y, dx: 0, dy: 0 }; },
  move(st, x, y, id) { if (!joy || joy.id !== id) return; joy.x = x; joy.y = y; let dx = (x - joy.ox) / 46, dy = (y - joy.oy) / 46; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.dx = l < 0.15 ? 0 : dx; joy.dy = l < 0.15 ? 0 : dy; },
  up(st, x, y, id) { if (joy && joy.id === id) joy = null; },
  draw, logo
};
function fx(st, e) {
  const v = st.view; const m = myP(v); if (!m) return;
  if (e.k === 'chat') { if (e.id !== v.me && v.ph === 'meet') A.tone(760, 0.05, 'sine', 0.05); return; }
  const seen = (x, y) => Math.hypot(x - m.x, y - m.y) < (v.imp ? I.VIS_IMP : I.VIS) || !m.a;
  if (e.k === 'kill') { if (seen(e.x, e.y) || e.by === v.me || e.v === v.me) { SFX.kill(); st.flash = { x: e.x, y: e.y, t: 0.6 }; st.shake = 0.45; burst(st, e.x, e.y, '#E63946', 22); S.vibrate(80); } if (e.v === v.me) { st.dead = 2.5; } }
  if (e.k === 'vent') { if (e.id !== v.me && seen(e.x, e.y)) { burst(st, e.x, e.y, '#9B8AC4', 16); A.tone(160, 0.18, 'square', 0.1, 70); S.toast('🕳️ מישהו נכנס לפתח איוורור!'); } return; }
  if (e.k === 'meet') { SFX.alarm(); st.alarm = 1.6; st.banner = { t: 1.9, s: e.body ? '📢 נמצאה גופה!' : '🚨 ישיבת חירום!' }; S.vibrate([60, 40, 60]); }
  if (e.k === 'task' && e.id === v.me) { st.spark = { t: 0.8 }; const s = I.ST[e.s]; if (s) { burst(st, s.x, s.y, '#B6F03C', 26); st.floats = (st.floats || []).concat([{ x: s.x, y: s.y - 30, t: 1.2, s: '✔ +1' }]); } st.barPulse = 0.8; }
  if (e.k === 'task' && e.id !== v.me) st.barPulse = Math.max(st.barPulse || 0, 0.35);
}
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function burst(st, x, y, col, n) { st.parts = st.parts || []; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 60 + Math.random() * 170; st.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, t: 0.6 + Math.random() * 0.5, c: col, r: 2 + Math.random() * 3 }); } if (st.parts.length > 240) st.parts.splice(0, st.parts.length - 240); }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.round(f < 0 ? r * (1 + f) : r + (255 - r) * f); g = Math.round(f < 0 ? g * (1 + f) : g + (255 - g) * f); b = Math.round(f < 0 ? b * (1 + f) : b + (255 - b) * f); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
function creature(c, x, y, s, col, face, wob, hat, ghost, dead) {
  c.save(); c.translate(x, y); if (face < 0) c.scale(-1, 1);
  if (ghost) c.globalAlpha *= 0.45;
  const bob = Math.sin(wob) * 1.6;
  if (!dead) { c.fillStyle = shade(col, -0.45); const f = Math.sin(wob) * 4; c.beginPath(); c.ellipse(-6 + f, 13, 5, 4, 0, 0, TAU); c.ellipse(6 - f, 13, 5, 4, 0, 0, TAU); c.fill(); }
  c.translate(0, bob);
  const g = c.createRadialGradient(-5, -8, 2, 0, 0, 18); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.25));
  c.fillStyle = g; c.strokeStyle = '#14121F'; c.lineWidth = 2.4;
  c.beginPath(); if (dead) { c.arc(0, 4, 15, Math.PI, 0); c.closePath(); } else c.arc(0, 0, 15, 0, TAU); c.fill(); c.stroke();
  if (!dead) {
    c.fillStyle = '#14121F'; c.beginPath(); c.arc(5, -3, 7.5, 0, TAU); c.fill();
    const vg = c.createLinearGradient(0, -10, 8, 4); vg.addColorStop(0, '#E9FBFF'); vg.addColorStop(1, '#6FD3F2'); c.fillStyle = vg; c.beginPath(); c.arc(5, -3, 5.6, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(7, -5, 1.8, 0, TAU); c.fill();
    c.strokeStyle = '#14121F'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -14); c.quadraticCurveTo(-8, -22, -5, -26); c.stroke(); c.fillStyle = shade(col, 0.3); c.beginPath(); c.arc(-5, -27, 3.4, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = shade(col, -0.3); c.beginPath(); c.ellipse(-15, 2, 4, 7, 0.2, 0, TAU); c.fill(); c.stroke();
    drawHat(c, hat);
  } else { c.fillStyle = '#F5F0E6'; c.strokeStyle = '#14121F'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(-3, -8, 6, 12, 2) : c.rect(-3, -8, 6, 12); c.fill(); c.stroke(); c.beginPath(); c.arc(-3, -9, 3, 0, TAU); c.arc(3, -9, 3, 0, TAU); c.fill(); c.stroke(); }
  c.restore();
}
function drawHat(c, h) {
  c.strokeStyle = '#14121F'; c.lineWidth = 2;
  if (h === 1) { c.fillStyle = '#FFC93C'; c.beginPath(); c.moveTo(-8, -12); c.lineTo(-9, -22); c.lineTo(-4, -17); c.lineTo(0, -24); c.lineTo(4, -17); c.lineTo(9, -22); c.lineTo(8, -12); c.closePath(); c.fill(); c.stroke(); }
  else if (h === 2) { c.fillStyle = '#3B4BFF'; c.beginPath(); c.arc(0, -11, 10, Math.PI, 0); c.fill(); c.stroke(); c.fillRect(0, -12, 16, 4); c.strokeRect(0, -12, 16, 4); }
  else if (h === 3) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.fillStyle = '#FF7CC8'; c.beginPath(); c.arc(6 + Math.cos(a) * 4, -14 + Math.sin(a) * 4, 3.2, 0, TAU); c.fill(); } c.fillStyle = '#FFC93C'; c.beginPath(); c.arc(6, -14, 2.4, 0, TAU); c.fill(); }
  else if (h === 4) { c.fillStyle = '#14121F'; c.fillRect(-10, -15, 20, 3); c.fillRect(-6, -30, 12, 16); c.fillStyle = '#FF5B2E'; c.fillRect(-6, -18, 12, 3); }
  else if (h === 5) { c.strokeStyle = '#14121F'; c.lineWidth = 3; c.beginPath(); c.arc(0, -4, 15, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.fillStyle = '#B6F03C'; c.beginPath(); c.ellipse(-14, -6, 4, 6, 0, 0, TAU); c.ellipse(14, -6, 4, 6, 0, 0, TAU); c.fill(); c.stroke(); }
  else if (h === 6) { c.fillStyle = '#E63946'; c.beginPath(); c.moveTo(-9, -11); c.lineTo(-13, -24); c.lineTo(-4, -13); c.moveTo(9, -11); c.lineTo(13, -24); c.lineTo(4, -13); c.fill(); c.stroke(); }
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const RCOL = ['#3a3658', '#45405f', '#3d3a5c', '#3b4060', '#3a4a5e', '#3c3a62', '#433b52', '#3f3d55', '#373f5c'];
function ship(c, T) {
  c.fillStyle = '#14121F';
  for (const o of I.ROOMS) { rrect(c, o.x - o.w / 2 - 12, o.y - o.h / 2 - 12, o.w + 24, o.h + 24, 26); c.fill(); }
  for (const o of I.CORR) c.fillRect(o.x - o.w / 2 - 10, o.y - o.h / 2 - 10, o.w + 20, o.h + 20);
  c.fillStyle = '#6E6A8C';
  for (const o of I.ROOMS) { rrect(c, o.x - o.w / 2 - 5, o.y - o.h / 2 - 5, o.w + 10, o.h + 10, 20); c.fill(); }
  for (const o of I.CORR) c.fillRect(o.x - o.w / 2 - 4, o.y - o.h / 2 - 4, o.w + 8, o.h + 8);
  for (const o of I.CORR) { c.fillStyle = '#2E2B47'; c.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h); c.fillStyle = 'rgba(182,240,60,.18)'; if (o.hz) for (let x = o.x - o.w / 2; x < o.x + o.w / 2; x += 40) c.fillRect(x, o.y - 2, 18, 4); else for (let y = o.y - o.h / 2; y < o.y + o.h / 2; y += 40) c.fillRect(o.x - 2, y, 4, 18); }
  I.ROOMS.forEach((o, i) => {
    const x0 = o.x - o.w / 2, y0 = o.y - o.h / 2;
    c.fillStyle = RCOL[i]; rrect(c, x0, y0, o.w, o.h, 16); c.fill();
    c.save(); rrect(c, x0, y0, o.w, o.h, 16); c.clip(); c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2;
    for (let x = x0; x < x0 + o.w; x += 34) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + o.h); c.stroke(); } for (let y = y0; y < y0 + o.h; y += 34) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + o.w, y); c.stroke(); }
    c.restore();
    c.fillStyle = 'rgba(245,240,230,.16)'; c.font = '700 26px "Secular One",sans-serif'; c.textAlign = 'center'; c.fillText(o.n, o.x, o.y + o.h / 2 - 16);
  });
  c.fillStyle = '#5b5680'; c.beginPath(); c.arc(I.BTN.x, I.BTN.y, 42, 0, TAU); c.fill(); c.strokeStyle = '#14121F'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#E63946'; c.beginPath(); c.arc(I.BTN.x, I.BTN.y - 2, 16 + Math.sin(T * 3) * 1.2, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(I.BTN.x - 5, I.BTN.y - 8, 4, 0, TAU); c.fill();
  for (const vn of I.VENTS) {
    c.save(); c.translate(vn.x, vn.y);
    c.fillStyle = '#241f38'; rrect(c, -22, -14, 44, 28, 8); c.fill(); c.strokeStyle = '#14121F'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#5b5680'; for (let gi = -1; gi <= 1; gi++) c.fillRect(gi * 11 - 3, -9, 6, 18);
    c.restore();
  }
}
function stations(c, v, T) {
  const mine = {}; if (v) for (const t of v.tk) mine[t.s] = t.d ? 2 : 1;
  for (const s of I.ST) {
    c.save(); c.translate(s.x, s.y);
    c.fillStyle = '#1d1b30'; c.strokeStyle = '#14121F'; c.lineWidth = 3; rrect(c, -20, -15, 40, 30, 7); c.fill(); c.stroke();
    const col = s.type === 'hold' ? '#B6F03C' : s.type === 'seq' ? '#FF7CC8' : s.type === 'code' ? '#4CC9F0' : '#FFC93C';
    c.fillStyle = col; c.globalAlpha = 0.55 + 0.3 * Math.sin(T * 2 + s.i); rrect(c, -15, -10, 30, 15, 4); c.fill(); c.globalAlpha = 1;
    c.fillStyle = '#F5F0E6'; c.fillRect(-12, 9, 6, 3); c.fillRect(-3, 9, 6, 3); c.fillRect(6, 9, 6, 3);
    if (mine[s.i] === 1 && v) { c.strokeStyle = v.imp ? 'rgba(255,91,46,.55)' : 'rgba(255,201,60,.8)'; c.lineWidth = 3; const pr = 30 + 8 * ((T * 1.4 + s.i * 0.3) % 1); c.globalAlpha = 1 - ((T * 1.4 + s.i * 0.3) % 1); c.beginPath(); c.arc(0, 0, pr, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    if (mine[s.i] === 1 && v && !v.imp) { const b = Math.sin(T * 5) * 4; c.fillStyle = '#FFC93C'; c.strokeStyle = '#14121F'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -24 + b); c.lineTo(-10, -42 + b); c.lineTo(10, -42 + b); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#14121F'; c.font = '900 14px Heebo'; c.textAlign = 'center'; c.fillText('!', 0, -30 + b); }
    if (mine[s.i] === 2 && v && !v.imp) { c.fillStyle = '#B6F03C'; c.font = '900 18px Heebo'; c.textAlign = 'center'; c.fillText('✓', 0, -22); }
    c.restore();
  }
}
let starsDrawn = 0;
function draw(c, W, H, T, st) {
  const v = st.view;
  c.fillStyle = '#0b0a16'; c.fillRect(0, 0, W, H);
  if (!v) { drawStars(c, W, H, T, 0, 0, 1); c.fillStyle = '#F5F0E6'; c.font = '700 20px Heebo'; c.textAlign = 'center'; c.fillText('מחכים שהמארח יתחיל את הסבב…', W / 2, H / 2); c.font = '15px Heebo'; c.fillText('בינתיים בחרו שם 👇', W / 2, H / 2 + 28); return; }
  const m = myP(v); const r0 = st.rp[v.me] || { x: m.x, y: m.y };
  const sc = Math.max(0.6, Math.min(1.5, Math.min(W, H) / (W < 700 ? 500 : 600)));
  let cx = r0.x, cy = r0.y;
  if (st.shake > 0) { st.shake -= 1 / 60; if (!RM) { const k = st.shake * 14; cx += (Math.random() - 0.5) * k; cy += (Math.random() - 0.5) * k; } }
  if (v.ph === 'eject' && v.ej) return drawEject(c, W, H, T, v);
  drawStars(c, W, H, T, cx, cy, sc);
  c.save(); c.translate(W / 2, H / 2 + 10); c.scale(sc, sc); c.translate(-cx, -cy);
  ship(c, T); stations(c, v, T);
  if (v.vn >= 0 && v.vcd <= 0 && v.ph === 'play') { const vn = I.VENTS[v.vn]; const pr = 30 + 6 * Math.sin(T * 4); c.strokeStyle = 'rgba(255,124,200,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(vn.x, vn.y, pr, 0, TAU); c.stroke(); }
  for (const b of v.bo) creature(c, b.x, b.y, 1, I.COLORS[b.c], 1, 0, 0, false, true);
  const vis = v.imp ? I.VIS_IMP : I.VIS;
  const list = v.pl.slice().sort((a, b) => (st.rp[a.id] || a).y - (st.rp[b.id] || b).y);
  for (const p of list) {
    const r = st.rp[p.id] || p; const ghost = !p.a;
    if (ghost && m.a) continue;
    if (p.id !== v.me && m.a && Math.hypot(r.x - cx, r.y - cy) > vis + 20) continue;
    creature(c, r.x, r.y, 1, I.COLORS[p.c], p.f, r.w || 0, p.h, ghost, false);
    c.font = '700 13px Heebo'; c.textAlign = 'center'; c.lineWidth = 3.5; c.strokeStyle = '#14121F'; c.strokeText(p.n, r.x, r.y - 36); c.fillStyle = (v.imp && p.i === 1) ? '#FF5B2E' : '#F5F0E6'; c.fillText(p.n, r.x, r.y - 36);
  }
  if (st.parts && st.parts.length) { for (const q of st.parts) { q.t -= 1 / 60; q.x += q.vx / 60; q.y += q.vy / 60; q.vx *= 0.95; q.vy = q.vy * 0.95 + 4; c.globalAlpha = Math.max(0, Math.min(1, q.t * 2)); c.fillStyle = q.c; c.fillRect(q.x - q.r / 2, q.y - q.r / 2, q.r, q.r); } c.globalAlpha = 1; st.parts = st.parts.filter(q => q.t > 0); }
  if (st.floats && st.floats.length) { for (const f of st.floats) { f.t -= 1 / 60; f.y -= 0.7; c.globalAlpha = Math.max(0, Math.min(1, f.t * 1.5)); c.font = '900 22px Heebo'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#14121F'; c.strokeText(f.s, f.x, f.y); c.fillStyle = '#B6F03C'; c.fillText(f.s, f.x, f.y); } c.globalAlpha = 1; st.floats = st.floats.filter(f => f.t > 0); }
  if (st.flash) { st.flash.t -= 1 / 60; const f = st.flash; c.fillStyle = 'rgba(230,57,70,' + Math.max(0, f.t) * 0.7 + ')'; c.beginPath(); c.arc(f.x, f.y, 40 + (0.6 - f.t) * 120, 0, TAU); c.fill(); if (f.t <= 0) st.flash = null; }
  c.restore();
  if (m.a) { const R = vis * sc; const g = c.createRadialGradient(W / 2, H / 2 + 10, R * 0.72, W / 2, H / 2 + 10, R); g.addColorStop(0, 'rgba(8,7,20,0)'); g.addColorStop(1, 'rgba(8,7,20,.93)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  if (v.ph === 'play') {
    const R = (m.a ? vis : 9999) * sc, ox = W / 2, oy = H / 2 + 10; let best = null, bd = 1e9; const todo = [];
    for (const t of v.tk) { if (t.d) continue; const s = I.ST[t.s]; const d = Math.hypot(s.x - cx, s.y - cy); todo.push([s, d]); if (d < bd) { bd = d; best = s; } }
    for (const [s, d] of todo) {
      const sx = ox + (s.x - cx) * sc, sy = oy + (s.y - cy) * sc;
      const inView = d * sc < R * 0.8 && sx > 30 && sx < W - 30 && sy > 160 && sy < H - 100; if (inView) continue;
      const a = Math.atan2(s.y - cy, s.x - cx), big = s === best;
      let rr = Math.min(R * 0.86, 999); let px = ox + Math.cos(a) * rr, py = oy + Math.sin(a) * rr;
      px = Math.max(26, Math.min(W - 26, px)); py = Math.max(170, Math.min(H - 110, py));
      const bob = Math.sin(T * 6) * 3, k = big ? 1.25 : 0.8;
      c.save(); c.translate(px + Math.cos(a) * bob, py + Math.sin(a) * bob); c.rotate(a); c.scale(k, k);
      c.globalAlpha = big ? 1 : 0.7; c.fillStyle = v.imp ? '#FF8A5B' : '#FFC93C'; c.strokeStyle = '#14121F'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, -12); c.lineTo(-3, 0); c.lineTo(-8, 12); c.closePath(); c.fill(); c.stroke(); c.restore(); c.globalAlpha = 1;
      if (big) { c.font = '800 13px Heebo'; c.textAlign = 'center'; c.lineWidth = 3.5; c.strokeStyle = '#14121F'; const lx = Math.max(60, Math.min(W - 60, px - Math.cos(a) * 30)), ly = py - Math.sin(a) * 26 + 4; c.strokeText(s.n, lx, ly); c.fillStyle = '#FFE08A'; c.fillText(s.n, lx, ly); }
    }
  }
  {
    const fs = W < 700 ? 13 : 15, lh = fs + 6; c.font = '600 ' + fs + 'px Heebo'; c.textAlign = 'right'; const x = W - 10; let y = 150 + fs;
    let tw = c.measureText(v.imp ? '🎭 משימות מזויפות:' : '📋 המשימות שלך:').width; for (const t of v.tk) { const s = I.ST[t.s]; tw = Math.max(tw, c.measureText('✓ ' + s.n + ' · ' + I.ROOMS[s.r].n).width); }
    const bw2 = Math.min(W * 0.62, tw + 16);
    c.fillStyle = 'rgba(20,18,31,.78)'; rrect(c, W - 10 - bw2, y - fs - 4, bw2, 12 + (v.tk.length + 1) * lh, 10); c.fill();
    c.fillStyle = '#B6F03C'; c.fillText(v.imp ? '🎭 משימות מזויפות:' : '📋 המשימות שלך:', x - 8, y); y += lh;
    for (const t of v.tk) { const s = I.ST[t.s]; c.fillStyle = t.d ? '#7d7a95' : '#F5F0E6'; c.fillText((t.d ? '✓ ' : '• ') + s.n + ' · ' + I.ROOMS[s.r].n, x - 8, y); if (t.d) { const w2 = c.measureText((t.d ? '✓ ' : '• ') + s.n + ' · ' + I.ROOMS[s.r].n).width; c.fillRect(x - 8 - w2, y - fs * 0.35, w2, 1.5); } y += lh; }
  }
  { const bw = Math.min(W < 700 ? W * 0.34 : 280, W - 40), pul = st.barPulse > 0 ? (st.barPulse -= 1 / 60, st.barPulse) : 0, by = 150;
    c.fillStyle = 'rgba(20,18,31,.82)'; rrect(c, 10, by - 4, bw, 22, 10); c.fill();
    c.fillStyle = pul > 0 ? '#E8FF9A' : '#B6F03C'; rrect(c, 13, by - 1, Math.max(0, (bw - 6) * v.td / Math.max(1, v.tt)), 16, 7); c.fill();
    if (pul > 0) { c.strokeStyle = 'rgba(182,240,60,' + pul + ')'; c.lineWidth = 3; rrect(c, 10 - pul * 6, by - 4 - pul * 6, bw + pul * 12, 22 + pul * 12, 12); c.stroke(); }
    c.fillStyle = '#F5F0E6'; c.font = '700 ' + (W < 700 ? 12 : 14) + 'px Heebo'; c.textAlign = 'left'; c.fillText('משימות הצוות ' + Math.round(100 * v.td / Math.max(1, v.tt)) + '%', 14, by + 38); }
  if (joy && joy.on) { c.strokeStyle = 'rgba(245,240,230,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(joy.ox, joy.oy, 46, 0, TAU); c.stroke(); c.fillStyle = 'rgba(182,240,60,.6)'; c.beginPath(); c.arc(joy.ox + joy.dx * 46, joy.oy + joy.dy * 46, 20, 0, TAU); c.fill(); }
  if (st.alarm > 0) { st.alarm -= 1 / 60; c.fillStyle = 'rgba(230,57,70,' + (0.25 + 0.2 * Math.sin(T * 20)) + ')'; c.fillRect(0, 0, W, H); }
  if (v.t < 3.2 && v.ph === 'play') { const a = Math.min(1, (3.2 - v.t) * 1.5); c.fillStyle = 'rgba(11,10,22,' + 0.85 * a + ')'; c.fillRect(0, 0, W, H); c.globalAlpha = a; c.textAlign = 'center'; c.font = '700 46px "Secular One"'; c.fillStyle = v.imp ? '#FF5B2E' : '#4CC9F0'; c.fillText(v.imp ? 'מתחזה' : 'צוות', W / 2, H / 2 - 20); c.font = '600 17px Heebo'; c.fillStyle = '#F5F0E6'; c.fillText(v.imp ? 'חסלו בשקט. ' + (v.nImp > 1 ? 'השותף שלכם מסומן באדום' : '') : 'יש ' + v.nImp + ' מתחזה' + (v.nImp > 1 ? 'ים' : '') + ' בינינו', W / 2, H / 2 + 20); creature(c, W / 2, H / 2 + 80, 1, I.COLORS[m.c], 1, T * 4, m.h, false, false); c.globalAlpha = 1; }
  if (st.dead > 0) { st.dead -= 1 / 60; c.fillStyle = 'rgba(120,10,20,' + Math.min(0.7, st.dead) + ')'; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.font = '700 30px "Secular One"'; c.textAlign = 'center'; c.fillText('חוסלת! 👻', W / 2, H / 2); c.font = '16px Heebo'; c.fillText(v.imp ? '' : 'כרוח אפשר להמשיך לעשות משימות', W / 2, H / 2 + 30); }
  if (st.hostGone) { c.fillStyle = 'rgba(11,10,22,.78)'; c.fillRect(0, 0, W, H); c.fillStyle = '#14121F'; rrect(c, W / 2 - 210, H / 2 - 44, 420, 88, 18); c.fill(); c.strokeStyle = '#FF5B2E'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff'; c.font = '700 22px "Secular One"'; c.textAlign = 'center'; c.fillText('📡 איבוד קשר עם המארח', W / 2, H / 2 - 8); c.font = '600 15px Heebo'; c.fillText('מנסים להתחבר מחדש… אם זה נמשך, נחזיר אתכם לתפריט', W / 2, H / 2 + 22); }
  if (st.banner && st.banner.t > 0) { st.banner.t -= 1 / 60; const b = st.banner, a = Math.min(1, b.t * 3), z = 1 + Math.max(0, b.t - 1.6) * 2; c.save(); c.globalAlpha = a; c.translate(W / 2, H * 0.36); c.scale(z, z); c.fillStyle = '#14121F'; rrect(c, -Math.min(W * 0.45, 200), -34, Math.min(W * 0.9, 400), 62, 16); c.fill(); c.strokeStyle = '#FF5B2E'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff'; c.font = '700 ' + (W < 700 ? 26 : 32) + 'px "Secular One"'; c.textAlign = 'center'; c.fillText(b.s, 0, 10); c.restore(); }
  coach(c, W, H, T, st, v, m);
}
function coach(c, W, H, T, st, v, m) {
  if (st.net !== 'solo' || S.prog.coached || (S.prog.tasks || 0) > 0 || v.imp || v.ph !== 'play' || v.t < 3.2 || !m || !m.a) return;
  const touch = matchMedia('(pointer:coarse)').matches;
  if (st.cs == null) { st.cs = 0; st.c0 = { x: m.x, y: m.y }; }
  const o = avail(v);
  if (st.cs === 0 && Math.hypot(m.x - st.c0.x, m.y - st.c0.y) > 70) st.cs = 1;
  if (st.cs <= 1 && o.use) st.cs = 2;
  if (st.cs <= 2 && v.tk.some(t => t.d)) { st.cs = 3; st.ct = 4; }
  if (st.cs === 3) { st.ct -= 1 / 60; if (st.ct <= 0) { S.prog.coached = 1; S.saveProg(); return; } }
  const msg = [touch ? '👆 גררו אצבע על המסך כדי לזוז' : '⌨️ WASD או החיצים כדי לזוז', '➡️ עקבו אחרי החץ הצהוב אל משימה', touch ? '✋ לחצו "השתמש" למטה' : '✋ לחצו E או "השתמש"', '🎉 מעולה! סיימו את כל המשימות. גופה? 📢 דווחו'][st.cs];
  c.font = '800 ' + (W < 700 ? 16 : 19) + 'px Heebo'; const tw = c.measureText(msg).width + 30, bx = W / 2, byy = H - (W < 700 ? 140 : 120) + Math.sin(T * 3) * 3;
  c.fillStyle = 'rgba(245,240,230,.96)'; rrect(c, bx - tw / 2, byy - 24, tw, 42, 14); c.fill(); c.strokeStyle = '#14121F'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#14121F'; c.textAlign = 'center'; c.fillText(msg, bx, byy + 4);
}
function drawStars(c, W, H, T, cx, cy, sc) {
  for (const s of stars) { const x = ((s[0] - cx * 0.25) % 2200 + 2200) % 2200 - 400 + W / 2 - 700, y = ((s[1] - cy * 0.25) % 1900 + 1900) % 1900 - 400 + H / 2 - 600; if (x < -5 || y < -5 || x > W + 5 || y > H + 5) continue; c.fillStyle = 'rgba(245,240,230,' + (0.4 + 0.5 * Math.abs(Math.sin(T + s[3] * 9))) + ')'; c.fillRect(x, y, s[2] * 1.4, s[2] * 1.4); }
}
function drawEject(c, W, H, T, v) {
  drawStars(c, W, H, T * 6, T * 400, 0, 1);
  const e = v.ej; const p = v.pl.find(q => q.id === e.id); const k = Math.min(1, e.t / 4);
  if (p) { c.save(); c.translate(W * (1.1 - k * 1.25), H / 2 - 40); c.rotate(T * 3); creature(c, 0, 0, 1, I.COLORS[p.c], 1, 0, p.h, false, false); c.restore(); }
  c.textAlign = 'center'; c.fillStyle = '#F5F0E6'; c.font = '700 24px "Secular One"';
  const t1 = p ? p.n + ' נזרק/ה לחלל.' : 'אף אחד לא נזרק (דילוג או תיקו).';
  const t2 = p ? (e.imp ? 'הוא/היא היה/תה המתחזה! 🎯' : 'הוא/היא לא היה/תה המתחזה… 😬') : '';
  const n = Math.floor(Math.min(1, e.t / 2.2) * t1.length); c.fillText(t1.slice(0, n), W / 2, H / 2 + 50);
  if (e.t > 2.4) { c.font = '600 18px Heebo'; c.fillStyle = e.imp ? '#B6F03C' : '#FF7CC8'; c.fillText(t2, W / 2, H / 2 + 84); c.fillStyle = '#aaa'; c.fillText('נותרו ' + e.left + ' מתחזים', W / 2, H / 2 + 112); }
}
function logo(c, W, H, T) {
  c.clearRect(0, 0, W, H); drawStars(c, W, H, T, T * 30, 0, 1);
  const cols = [0, 1, 2, 3, 4]; const n = cols.length;
  for (let i = 0; i < n; i++) { const x = W / 2 + (i - 2) * Math.min(56, W / 6), y = H * 0.6 + Math.sin(T * 2 + i) * 6; creature(c, x, y, 1, I.COLORS[cols[i]], i % 2 ? -1 : 1, T * 5 + i, i === 2 ? 4 : 0, false, false); }
  c.fillStyle = '#FF5B2E'; c.font = '700 13px Heebo'; c.textAlign = 'center'; c.fillText('?', W / 2 + Math.sin(T) * 80, H * 0.6 - 40);
}
function setLobbyStatus(t) { N.st = t; renderLobby(); }
function renderLobby() {
  if (lobby.hidden) return; const b = lobby.querySelector('.box');
  const link = N.code && NET ? NET.roomLink(N.code) : '';
  const pls = N.role === 'host' ? [{ name: myName() + ' (מארח/ת)' }].concat(N.lobby.filter(x => x.on)) : (N.glist || []);
  b.innerHTML = '<button class="x" id="lbX" aria-label="יציאה">✕</button><h2>🌐 ' + (N.role === 'host' ? 'החדר שלך' : 'נכנסת לחדר') + '</h2>' +
    (N.code ? '<div class="lb-code">' + N.code + '</div>' : '') + '<div class="lb-st">' + (N.st || '') + '</div>' +
    '<div class="lb-pl">' + pls.map(p => '<span>' + String(p.name).replace(/[<>&]/g, '') + '</span>').join('') + (N.role === 'host' && N.dialing > 0 ? '<span style="background:#FFE07A">⏳ מישהו מתחבר…</span>' : '') + '</div>' +
    (N.role === 'host' ? '<p>שלחו לחברים את הקישור: הם נכנסים ישר לחדר. בוטים ימלאו עד 6 שחקנים.<br><small>מי שמצטרף מרשת חסומה עלול להופיע רק אחרי דקה-שתיים — זה תקין.</small></p><button class="bb alt" id="lbCopy">🔗 העתק קישור</button>' + (navigator.share ? '<button class="bb alt" id="lbShare">📤 שיתוף</button>' : '') + '<br><button class="bb" id="lbGo">▶ התחל סבב</button>' : '<p>המארח/ת יתחיל/תתחיל את הסבב בקרוב.</p><button class="bb alt" id="lbName">✏️ שינוי שם</button><button class="bb alt" id="lbSolo">🤖 שחק מול בוטים</button>' + (N.relayOffer ? '<button class="bb" id="lbRelay">🛰️ נסה חיבור דרך ממסר (ניסיוני)</button>' : ''));
  b.querySelector('#lbX').onclick = leaveOnline;
  const q = id => b.querySelector(id);
  if (q('#lbCopy')) q('#lbCopy').onclick = () => { try { navigator.clipboard.writeText(link); S.toast('הקישור הועתק'); } catch (e) { S.toast(link); } };
  if (q('#lbShare')) q('#lbShare').onclick = () => { navigator.share({ title: 'המתחזה בחללית', text: 'בואו לשחק איתי! חדר ' + N.code, url: link }).catch(() => { }); };
  if (q('#lbGo')) q('#lbGo').onclick = () => { A.click(); S.debug.start('online'); };
  if (q('#lbName')) q('#lbName').onclick = () => askName();
  if (q('#lbSolo')) q('#lbSolo').onclick = () => { leaveOnline(); S.debug.start('rnd'); };
  if (q('#lbRelay')) q('#lbRelay').onclick = async () => {
    N.relayOffer = false; setLobbyStatus('מתחבר דרך ממסר…');
    const ok = await NET.fetchRelay();
    if (!ok) { setLobbyStatus('הממסר לא זמין כרגע. אפשר לשחק מול בוטים.'); return; }
    if (N.G && N.G.retryNow) N.G.retryNow(true);
  };
}
function hostSend(cid, m) { if (N.H) N.H.send(cid, m); }
function lobbyCast() { const list = [{ name: myName() + ' (מארח/ת)' }].concat(N.lobby.filter(x => x.on).map(x => ({ name: x.name }))); N.lobby.forEach(x => x.on && hostSend(x.cid, { t: 'lobby', list, code: N.code, playing: N.playing })); }
function openHost() {
  if (!NET) { S.toast('אין חיבור לרשת כרגע'); return; }
  if (N.role === 'guest') leaveOnline();
  lobby.hidden = false;
  if (N.H) { N.playing = false; setLobbyStatus('החדר פתוח'); return; }
  N.role = 'host'; N.code = NET.newRoom(); N.lobby = []; setLobbyStatus('פותח חדר…');
  N.H = NET.host(N.code, {
    onOpen() { setLobbyStatus('החדר פתוח · מחכים לחברים'); },
    onState(s) { if (s === 'retry' || s === 'reconnecting') setLobbyStatus('מתחבר מחדש…'); },
    onDial() { N.dialing = (N.dialing || 0) + 1; renderLobby(); },
    onDialEnd() { N.dialing = Math.max(0, (N.dialing || 0) - 1); renderLobby(); },
    onHello(cid, msg) { N.dialing = Math.max(0, (N.dialing || 0) - 1); let x = N.lobby.find(y => y.cid === cid); const nm = (window.TabName ? TabName.clean(msg.name) : String(msg.name || '')) || 'אורח/ת'; if (!x) { x = { cid, name: nm, on: true }; N.lobby.push(x); S.toast('👋 ' + nm + ' נכנס/ה'); } else { x.on = true; x.name = nm; }
      const st = cur(); if (st && st.sim && st.net === 'host') { const p = I.P(st.sim, cid); if (p) { p.name = nm; p.bot = false; hostSend(cid, { t: 'start' }); } }
      lobbyCast(); renderLobby(); },
    onMsg(cid, m) { const st = cur(); if (!st || st.net !== 'host' || !st.sim) return; const p = I.P(st.sim, cid); if (!p || p.bot) return;
      if (m.t === 'in') { const dx = Math.max(-1, Math.min(1, +m.dx || 0)), dy = Math.max(-1, Math.min(1, +m.dy || 0)); st.sim.inp[cid] = [dx, dy]; }
      else if (m.t === 'act' && ['kill', 'report', 'saw', 'vent', 'button', 'vote', 'task', 'chat'].includes(m.a)) I.act(st.sim, cid, m.a, typeof m.arg === 'string' ? m.arg.slice(0, 40) : m.arg); },
    onLeave(cid) { const x = N.lobby.find(y => y.cid === cid); if (x) { x.on = false; S.toast('👋 ' + x.name + ' יצא/ה'); } const st = cur(); if (st && st.sim && st.net === 'host') { const p = I.P(st.sim, cid); if (p) { p.bot = true; p.ai.wp = []; } } lobbyCast(); renderLobby(); },
    onIdTaken() { return false; },
    onFatal() { setLobbyStatus('אי אפשר לפתוח חדר מהדפדפן הזה'); }
  });
}
function askName() { if (!window.TabName) return; N.named = true; TabName.prompt({ ns: NS, onName(n) { if (N.G) N.G.rename(n); renderLobby(); } }); }
function joinRoom(code) {
  if (!NET || !code) return;
  N.role = 'guest'; N.code = code; N.glist = []; lobby.hidden = false; setLobbyStatus('מצטרף לחדר ' + code + '…');
  const cid = NET.cidFor(code);
  N.G = NET.join(code, cid, myName(), {
    onUp() { setLobbyStatus('✔ את/ה בחדר!'); if (!N.named) askName(); },
    onMsg(m) {
      if (m.t === 'lobby') { N.glist = m.list; if (!m.playing && !lobby.hidden) renderLobby(); return; }
      if (m.t === 'start') { lobby.hidden = true; const st = cur(); if (!st || st.net !== 'guest' || (st.view && st.view.over)) S.debug.start('guest'); return; }
      if (m.t === 's') { let st = cur(); if (!st || st.net !== 'guest') { lobby.hidden = true; S.debug.start('guest'); st = cur(); } if (st) { st.lastS = performance.now(); st.nv = m.v; st.me = m.v.me; st.gev = (st.gev || []).concat((m.ev || []).filter(e => e.k && (st.seenEv = st.seenEv || {}, !st.seenEv[JSON.stringify(e)] && (st.seenEv[JSON.stringify(e)] = 1)))); } }
    },
    onDown() { S.toast('החיבור נקטע, מתחבר מחדש…'); },
    onBye() { S.toast('המארח/ת סגר/ה את החדר'); leaveOnline(); S.debug.menu(); },
    onNoHost() { setLobbyStatus('מחפש את המארח… (ודאו שהחדר עדיין פתוח)'); },
    onNoBroker() { setLobbyStatus('השרת המתווך לא עונה, מנסה שוב…'); },
    onFail(state) {
      if (state === 'final' && NET && NET.fetchRelay && !NET.relayActive()) {
        N.relayOffer = true;
        setLobbyStatus('החיבור הישיר נכשל — כנראה שהרשת חוסמת (סלולר או Wi‑Fi מוגבל). אפשר לנסות חיבור דרך ממסר (ניסיוני):');
      } else if (NET && NET.relayActive && NET.relayActive()) setLobbyStatus('מתחבר דרך ממסר…');
      else setLobbyStatus('מנסה שוב להתחבר…');
    },
    onVer() { setLobbyStatus('הגרסה שלך שונה מהמארח. רעננו את הדף.'); }
  });
  N.G.cid = cid;
  setTimeout(() => { if (N.role === 'guest' && !N.named) askName(); }, 3500);
}
function leaveOnline() {
  lobby.hidden = true; if (window.TabName) TabName.close();
  try { N.H && N.H.close && N.H.close(); } catch (e) { } try { N.G && N.G.close && N.G.close(); } catch (e) { }
  N.H = null; N.G = null; N.role = null; N.code = null; N.lobby = []; N.playing = false; if (NET) NET.clearPending();
  try { history.replaceState(null, '', location.pathname); } catch (e) { }
}
function openLook() {
  look.hidden = false; const b = look.querySelector('.box'); const L = lvl();
  b.innerHTML = '<button class="x" aria-label="סגירה">✕</button><h2>🎨 הדמות שלי</h2><p>צבע:</p><div class="sw">' + I.COLORS.map((c, i) => '<button data-c="' + i + '" class="' + (S.prog.col === i ? 'on' : '') + '" style="background:' + c + '" aria-label="' + I.CNAMES[i] + '"></button>').join('') + '</div><p>כובע (נפתח בכל דרגה, את/ה בדרגה ' + L + '):</p><div class="sw h">' + HATS.map((h, i) => '<button data-h="' + i + '" class="' + ((S.prog.hat || 0) === i ? 'on' : '') + '"' + (i + 1 > L ? ' disabled' : '') + '>' + (i + 1 > L ? '🔒 ' : '') + h + '</button>').join('') + '</div><p>רמת הבוטים:</p><div class="sw h">' + [['easy', 'קלה'], ['norm', 'רגילה'], ['hard', 'קשה']].map(d => '<button data-d="' + d[0] + '" class="' + ((S.prog.diff || 'norm') === d[0] ? 'on' : '') + '">' + d[1] + '</button>').join('') + '</div><button class="bb" id="lkOk">שמירה</button>';
  b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { S.prog.col = +x.dataset.c; S.saveProg(); openLook(); });
  b.querySelectorAll('[data-h]').forEach(x => x.onclick = () => { S.prog.hat = +x.dataset.h; S.saveProg(); openLook(); });
  b.querySelectorAll('[data-d]').forEach(x => x.onclick = () => { S.prog.diff = x.dataset.d; S.saveProg(); openLook(); });
  b.querySelector('.x').onclick = b.querySelector('#lkOk').onclick = () => { look.hidden = true; };
}
const lk = el('<div class="row"><button id="bLook" class="btn">🎨 הדמות שלי</button><button id="bName" class="btn">✏️ השם שלי</button></div>');
S.$('#modes').parentNode.insertBefore(lk, S.$('#best'));
S.$('#bLook').onclick = () => { A.click(); openLook(); };
S.$('#bName').onclick = () => { A.click(); if (window.TabName) TabName.prompt({ ns: NS, title: 'איך לקרוא לך?', onName() { } }); };
window.HM = { N, joinRoom, openHost, leaveOnline };
S.run(DEF);
const inv = NET && (NET.roomFromHash() || NET.pendingRoom());
if (inv) joinRoom(inv);
})();
