(function () {
  'use strict';
  var KEY = 'tab.playerName', SKEY = 'tab.playerName.tmp', MAX = 18;
  var A = ['שועל', 'נמר', 'דולפין', 'ינשוף', 'צב', 'פיל', 'זאב', 'נשר', 'קיפוד', 'לוטרה', 'ג׳ירפה', 'פנדה', 'תוכי', 'אריה', 'סנאי', 'כריש'];
  var B = ['מהיר', 'אמיץ', 'חכם', 'שקט', 'עליז', 'זריז', 'נועז', 'ממזר', 'סקרן', 'רגוע', 'ערמומי', 'מבריק'];
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { } return null; }
  function clean(s) { s = String(s == null ? '' : s).replace(/[\u0000-\u001f<>"'`\\]/g, '').replace(/\s+/g, ' ').trim(); return s.slice(0, MAX); }
  function random() { return A[Math.floor(Math.random() * A.length)] + ' ' + B[Math.floor(Math.random() * B.length)]; }
  function get(ns) {
    var n = clean((ns && ls(ns + '.playerName')) || ls(KEY));
    if (n) return n;
    n = clean(ss(SKEY)); if (n) return n;
    n = random(); ss(SKEY, n); return n;
  }
  function set(name, ns) { var n = clean(name) || get(ns); ls(KEY, n); if (ns) ls(ns + '.playerName', n); return n; }
  var EL = null, ST = null;
  function close() { if (EL && EL.parentNode) EL.parentNode.removeChild(EL); EL = null; }
  function css() {
    if (ST) return; ST = document.createElement('style'); ST.id = 'tabname-css';
    ST.textContent = '.tabname{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483000;direction:rtl;' +
      'width:min(92vw,380px);box-sizing:border-box;background:rgba(20,24,36,.96);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:12px 12px 10px;' +
      'box-shadow:0 10px 32px rgba(0,0,0,.45);font:15px/1.35 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;animation:tabnameIn .22s ease-out}' +
      '@keyframes tabnameIn{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '.tabname b{display:block;font-size:15px;margin:0 0 8px}.tabname .tn-row{display:flex;gap:8px;align-items:center}' +
      '.tabname input{flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:#0d1018;color:#fff;outline:none}' +
      '.tabname input:focus{border-color:#7cc4ff}.tabname button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:10px 12px;min-height:44px}' +
      '.tabname .tn-ok{background:#2fbf71;color:#04210f;font-weight:700}.tabname .tn-dice{background:#2a3146;color:#fff}' +
      '.tabname .tn-x{position:absolute;top:6px;left:8px;background:transparent;color:#aab;min-height:0;padding:4px 8px;font-size:18px}' +
      '.tabname small{display:block;opacity:.7;margin-top:6px;font-size:12px}';
    (document.head || document.documentElement).appendChild(ST);
  }
  function prompt(o) {
    o = o || {}; close(); css();
    var cur = clean(o.current) || get(o.ns);
    EL = document.createElement('div'); EL.className = 'tabname'; EL.id = 'tabName'; EL.setAttribute('role', 'dialog'); EL.setAttribute('aria-label', 'בחירת שם');
    EL.innerHTML = '<button class="tn-x" data-k="x" aria-label="סגירה">×</button><b></b>' +
      '<div class="tn-row"><input id="tabNameIn" maxlength="' + MAX + '" autocomplete="nickname" enterkeyhint="done" dir="auto" aria-label="השם שלך">' +
      '<button class="tn-dice" data-k="dice" aria-label="שם אקראי">🎲</button><button class="tn-ok" data-k="ok">יאללה ✔</button></div><small>אתם כבר בחדר. אפשר להחליף שם גם אחר כך.</small>';
    EL.querySelector('b').textContent = o.title || 'נכנסתם! איך לקרוא לכם?';
    var inp = EL.querySelector('input'); inp.value = cur;
    var done = false;
    function ok() { if (done) return; done = true; var n = set(inp.value || cur, o.ns); close(); try { o.onName && o.onName(n); } catch (e) { if (window.console) console.warn('TabName onName', e); } }
    EL.addEventListener('click', function (e) {
      var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return; e.stopPropagation();
      if (k === 'ok') ok(); else if (k === 'dice') { inp.value = random(); inp.focus(); } else if (k === 'x') { done = true; close(); try { o.onClose && o.onClose(cur); } catch (e2) { } }
    });
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'keyup', 'wheel'].forEach(function (t) { EL.addEventListener(t, function (e) { e.stopPropagation(); if (t === 'keydown' && e.key === 'Enter') { e.preventDefault(); ok(); } }, { passive: t !== 'keydown' }); });
    (document.body || document.documentElement).appendChild(EL);
    return { close: close, input: inp };
  }
  window.TabName = { VERSION: '1.0.0', get: get, set: set, random: random, prompt: prompt, close: close, isOpen: function () { return !!EL; }, clean: clean };
})();
