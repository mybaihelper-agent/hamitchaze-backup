(function () {
  'use strict';
  const ICE = window.TABICE || {};
  const BASE_ICE = ICE.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
  // ?forcerelay=1 (QA hook): route all ICE traffic through the TURN relay, simulating a blocked network.
  const FORCE_RELAY = typeof location !== 'undefined' && /[?&]forcerelay=1/.test(location.search);
  // ?failice=1 (QA hook): pretend every direct path is dead (unreachable TURN only) until the user opts into the real relay.
  const FORCE_FAIL = typeof location !== 'undefined' && /[?&]failice=1/.test(location.search);
  let RELAY_SERVERS = null; // extra TURN iceServers from the /ice endpoint, once the user opts in
  function peerOpts() {
    if (FORCE_FAIL && !RELAY_SERVERS) {
      return { debug: 0, config: { iceServers: [{ urls: 'turn:127.0.0.1:9?transport=tcp', username: 'x', credential: 'x' }], iceTransportPolicy: 'relay' } };
    }
    const config = { iceServers: RELAY_SERVERS ? BASE_ICE.concat(RELAY_SERVERS) : BASE_ICE.slice() };
    if (FORCE_RELAY) config.iceTransportPolicy = 'relay';
    return { debug: 0, config };
  }
  async function fetchRelay() {
    if (!ICE.relayEndpoint) return false;
    try {
      const r = await fetch(ICE.relayEndpoint, { headers: { Accept: 'application/json' } });
      if (!r || !r.ok) return false;
      const j = await r.json();
      if (!j || !Array.isArray(j.iceServers) || !j.iceServers.length) return false;
      RELAY_SERVERS = j.iceServers;
      return true;
    } catch (e) { return false; }
  }
  const RELAY_PROMISE = FORCE_RELAY ? fetchRelay().catch(() => false) : null;
  let relayReady = !RELAY_PROMISE;
  if (RELAY_PROMISE) RELAY_PROMISE.then(() => { relayReady = true; });
  const FAIL_MS = ICE.failMs || 12000;
  const REG_MS = ICE.regMs || 8000;
  const ICE_STRIKES = 2;
  const FATAL = { 'browser-incompatible': 1, 'ssl-unavailable': 1, 'invalid-key': 1, 'invalid-id': 1 };
  const SOCK = { network: 1, 'server-error': 1, 'socket-error': 1, 'socket-closed': 1, disconnected: 1 };
  const DOC = typeof document !== 'undefined' ? document : null;
  const on = (t, k, f) => { try { t && t.addEventListener && t.addEventListener(k, f); } catch (e) { } };
  const off = (t, k, f) => { try { t && t.removeEventListener && t.removeEventListener(k, f); } catch (e) { } };
  const hidden = () => !!(DOC && DOC.visibilityState === 'hidden');
  const hasPeerLib = () => typeof window.Peer === 'function';
  function hex(n) { const b = new Uint8Array(n); crypto.getRandomValues(b); return Array.from(b, x => x.toString(16).padStart(2, '0')).join(''); }
  function make(cfg) {
  const NS = String(cfg.ns || 'game').replace(/[^a-z0-9-]/g, '');
  const VER = String(cfg.ver || '0');
  const LEN = cfg.codeLen || 5;
  const CODE_RE = new RegExp('^[0-9]{' + LEN + '}$');
  const normRoom = r => { const s = String(r == null ? '' : r).replace(/[^0-9]/g, ''); return CODE_RE.test(s) ? s : null; };
  const newRoom = () => { const b = new Uint32Array(LEN); crypto.getRandomValues(b); let s = String(1 + b[0] % 9); for (let i = 1; i < LEN; i++) s += b[i] % 10; return s; };
  const PID = room => 'tabkit-' + NS + '-' + normRoom(room);
  const roomLink = room => window.location.origin + window.location.pathname + '?r=' + normRoom(room) + '#r=' + normRoom(room);
  const RX = new RegExp('(?:^|[?#&])r=([0-9]{' + LEN + '})(?![0-9])');
  function roomFromUrl() { const m = RX.exec(window.location.hash || '') || RX.exec(window.location.search || ''); return m ? m[1] : null; }
  const PK = NS + '.pendingRoom', PEND_MS = 2 * 3600 * 1000;
  function savePending(r) { try { if (r) sessionStorage.setItem(PK, JSON.stringify({ r, t: Date.now() })); } catch (e) { } }
  function pendingRoom() { try { const j = JSON.parse(sessionStorage.getItem(PK) || 'null'); if (j && normRoom(j.r) && Date.now() - (+j.t || 0) < PEND_MS) return j.r; } catch (e) { } return null; }
  function clearPending() { try { sessionStorage.removeItem(PK); } catch (e) { } }
  savePending(roomFromUrl());
  function roomFromHash() { const r = roomFromUrl(); if (r) savePending(r); return r; }
  function cidFor(room) { const k = NS + '.cid.' + room; let c = null; try { c = localStorage.getItem(k); } catch (e) { } if (!c) { c = hex(12); try { localStorage.setItem(k, c); } catch (e) { } } return c; }
  function host(room, h) {
    const H = { room: normRoom(room), conns: {}, closed: false, peer: null, tries: 0, st: 'connecting', idTaken: 0, everOpen: false };
    let wd = null, rt = null, recon = 0;
    const setSt = s => { if (H.st === s) return; H.st = s; try { h.onState && h.onState(s); } catch (e) { } };
    const live = () => Object.values(H.conns).some(c => c && c.open);
    function arm(ms) { clearTimeout(wd); wd = setTimeout(watch, ms); }
    function watch() {
      const p = H.peer; if (H.closed || (p && p.open)) return;
      if (p && !p.destroyed && H.everOpen && live() && recon < 6) {
        recon++; setSt('reconnecting'); try { if (p.disconnected) p.reconnect(); else p.disconnect(); } catch (e) { } arm(Math.min(20000, REG_MS * (1 + recon / 2))); return;
      }
      restart('timeout');
    }
    function restart(why, now) {
      if (H.closed) return; clearTimeout(rt); clearTimeout(wd); const p = H.peer; H.peer = null; if (p) try { p.destroy(); } catch (e) { }
      H.tries++; setSt('retry'); try { h.onRetry && h.onRetry(why, H.tries); } catch (e) { }
      rt = setTimeout(start, now ? 30 : Math.min(10000, Math.round(700 * Math.pow(1.6, H.tries - 1))));
    }
    function start() {
      rt = null; if (H.closed) return;
      if (!relayReady) { RELAY_PROMISE.then(() => { if (!H.closed) start(); }); return; }
      if (!hasPeerLib()) { setSt('nolib'); try { h.onFatal && h.onFatal('nolib'); } catch (e) { } rt = setTimeout(start, 3000); return; }
      let peer; try { peer = new window.Peer(PID(H.room), peerOpts()); } catch (e) { return restart('ctor'); }
      H.peer = peer; recon = 0; const mine = () => H.peer === peer && !H.closed;
      setSt(H.tries ? 'retry' : 'connecting'); arm(REG_MS);
      peer.on('open', id => {
        if (!mine()) return;
        if (id !== PID(H.room)) return restart('wrong-id');
        clearTimeout(wd); H.tries = 0; H.idTaken = 0; recon = 0; H.everOpen = true; setSt('open'); try { h.onOpen && h.onOpen(id); } catch (e) { }
      });
      peer.on('connection', conn => {
        if (!mine()) { try { conn.close(); } catch (e) { } return; }
        if (conn.metadata && conn.metadata.probe) { conn.on('open', () => setTimeout(() => { try { conn.close(); } catch (e) { } }, 300)); return; }
        try { h.onDial && h.onDial(); } catch (e) { }
        setTimeout(() => { if (!conn._cid && !conn._dialEnd) { conn._dialEnd = 1; try { conn.close(); } catch (e) { } try { h.onDialEnd && h.onDialEnd(); } catch (e) { } } }, FAIL_MS * 2);
        conn.on('data', msg => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.t === 'hello' && typeof msg.cid === 'string') {
            if (msg.v !== VER) {
              conn._bad = 1;
              if (typeof msg.v === 'string') { try { conn.send({ t: 'ver', v: VER }); } catch (e) { } setTimeout(() => { try { conn.close(); } catch (e) { } }, 1500); }
              else { try { conn.send({ t: 'ver', v: VER }); } catch (e) { } setTimeout(() => { try { conn.close(); } catch (e) { } }, 1500); }
              h.onVerReject && h.onVerReject(msg.v || null, msg.name);
              return;
            }
            const old = H.conns[msg.cid]; if (old && old !== conn) try { old.close(); } catch (e) { } H.conns[msg.cid] = conn; conn._cid = msg.cid;
            try { conn.send({ t: 'hv', v: VER }); } catch (e) { }
            h.onHello && h.onHello(msg.cid, msg); return;
          }
          if (!conn._cid) return;
          h.onMsg && h.onMsg(conn._cid, msg);
        });
        const gone = () => { if (conn._cid && H.conns[conn._cid] === conn) { delete H.conns[conn._cid]; h.onLeave && h.onLeave(conn._cid); } else if (!conn._cid && !conn._dialEnd) { conn._dialEnd = 1; try { h.onDialEnd && h.onDialEnd(); } catch (e) { } } };
        conn.on('close', gone); conn.on('error', gone);
      });
      peer.on('disconnected', () => {
        if (!mine() || peer.destroyed) return;
        setSt('reconnecting'); arm(REG_MS);
        setTimeout(() => { if (mine() && peer.disconnected && !peer.destroyed) try { peer.reconnect(); } catch (e) { restart('reconnect'); } }, 500);
      });
      peer.on('close', () => { if (mine()) restart('closed'); });
      peer.on('error', err => {
        if (!mine()) return; const ty = (err && err.type) || 'unknown';
        try { h.onError && h.onError(ty); } catch (e) { }
        if (FATAL[ty]) { clearTimeout(wd); setSt('fatal'); try { h.onFatal && h.onFatal(ty); } catch (e) { } return; }
        if (ty === 'unavailable-id') {
          H.idTaken++; let moved = false; try { moved = !!(h.onIdTaken && h.onIdTaken(H.idTaken) === true); } catch (e) { }
          if (!moved) restart('unavailable-id'); return;
        }
        if (peer.destroyed || !H.everOpen) return restart(ty);
        if (SOCK[ty]) return;
      });
    }
    const kick = () => {
      if (H.closed || hidden()) return; const p = H.peer;
      if (rt) { clearTimeout(rt); rt = null; start(); }
      else if (p && p.disconnected && !p.destroyed) { try { p.reconnect(); } catch (e) { } arm(REG_MS); }
    };
    on(DOC, 'visibilitychange', kick); on(window, 'online', kick); on(window, 'pageshow', kick);
    start();
    H.state = () => H.st;
    H.retryNow = () => { if (H.closed || H.st === 'open') return; H.tries = 0; restart('manual', true); };
    H.rename = r => { r = normRoom(r); if (!r || H.closed) return false; H.room = r; H.tries = 0; H.idTaken = 0; H.everOpen = false; restart('rename', true); return true; };
    H.send = (cid, msg) => { const c = H.conns[cid]; if (c && c.open) try { c.send(msg); return true; } catch (e) { } return false; };
    H.online = cid => !!(H.conns[cid] && H.conns[cid].open);
    H.peerOf = cid => (H.conns[cid] && H.conns[cid].open && H.conns[cid].peer) || null;
    H.close = () => {
      H.closed = true; clearTimeout(wd); clearTimeout(rt); setSt('closed');
      off(DOC, 'visibilitychange', kick); off(window, 'online', kick); off(window, 'pageshow', kick);
      Object.values(H.conns).forEach(c => { try { c.send({ t: 'bye' }); c.close(); } catch (e) { } }); try { H.peer && H.peer.destroy(); } catch (e) { }
    };
    return H;
  }
  function join(room, cid, name, h) {
    room = normRoom(room);
    const G = { room, cid, closed: false, conn: null, peer: null, up: false, na: 0 };
    let pw = null;
    function newPeer() {
      if (!hasPeerLib()) { h.onFatal && h.onFatal('nolib'); return retry(3000); }
      let peer; try { peer = new window.Peer(peerOpts()); } catch (e) { return retry(); }
      G.peer = peer; const mine = () => G.peer === peer && !G.closed;
      clearTimeout(pw); pw = setTimeout(() => { if (mine() && !peer.open) { G.peer = null; try { peer.destroy(); } catch (e) { } brokerFail(); retry(300); } }, REG_MS);
      peer.on('open', () => { clearTimeout(pw); G.bf = 0; if (mine()) dial(); });
      peer.on('error', err => {
        if (!mine()) return; const ty = (err && err.type) || 'unknown';
        try { h.onError && h.onError(ty); } catch (e) { }
        if (ty === 'peer-unavailable') {
          if (G.conn) { G.conn._na = 1; try { G.conn.close(); } catch (e) { } }
          return noHost('peer-unavailable');
        }
        if (FATAL[ty]) { G.failed = ty; try { h.onFatal && h.onFatal(ty); } catch (e) { } return; }
        if (peer.destroyed || SOCK[ty] || !peer.open) { G.peer = null; try { peer.destroy(); } catch (e) { } brokerFail(); retry(); }
      });
      peer.on('disconnected', () => { if (mine() && !peer.destroyed) setTimeout(() => { if (mine() && peer.disconnected && !peer.destroyed) try { peer.reconnect(); } catch (e) { } }, 1000); });
    }
    function brokerFail() { G.bf = (G.bf || 0) + 1; if (G.bf === 2) try { h.onNoBroker && h.onNoBroker(); } catch (e) { } }
    function connect() {
      if (G.closed || G.failed) return;
      if (!relayReady) { RELAY_PROMISE.then(() => { if (!G.closed && !G.failed) connect(); }); return; }
      if (!G.peer || G.peer.destroyed) newPeer();
      else if (G.peer.open) dial();
      else if (G.peer.disconnected) { try { G.peer.reconnect(); } catch (e) { } retry(); }
      else retry();
    }
    function noHost(why) {
      G.na++; G.lastWhy = why; G.up = false;
      if (G.na === 1) try { h.onNoHost && h.onNoHost(why); } catch (e) { }
      return retry(Math.min(15000, 2000 + 1500 * G.na));
    }
    function dial() {
      if (G.closed || G.failed) return;
      const conn = G.conn = G.peer.connect(PID(room), { reliable: true });
      const seen = () => { if (conn._seen) return true; const pc = conn.peerConnection; if (pc && (pc.remoteDescription || /^(checking|connected|completed|failed|disconnected)$/.test(pc.iceConnectionState || ''))) conn._seen = true; return !!conn._seen; };
      const fail = why => {
        if (G.conn !== conn || conn.open || conn._na || G.closed || G.failed) return;
        try { conn.close(); } catch (e) { }
        if (why !== 'ice' && !seen()) { conn._na = 1; return noHost('no-answer'); }
        const n = iceFails(1);
        // With the relay on, keep trying longer: fresh TURN credentials can take ~2 min to propagate.
        const LIMIT = RELAY_SERVERS ? 10 : ICE_STRIKES;
        if (n >= LIMIT) { G.failed = 'final'; h.onFail && h.onFail('final', n); return; }
        try { h.onFail && h.onFail(why, n); } catch (e) { }
        return retry(RELAY_SERVERS ? 12000 : 1500);
      };
      const ft = setTimeout(() => fail('timeout'), FAIL_MS);
      const watchIce = () => { if (G.conn !== conn) return; const pc = conn.peerConnection; if (!pc) return setTimeout(watchIce, 300);
        const chk = () => { seen(); if (pc.iceConnectionState === 'failed') fail('ice'); };
        try { pc.addEventListener('iceconnectionstatechange', chk); pc.addEventListener('signalingstatechange', chk); } catch (e) { } chk(); };
      watchIce();
      conn.on('open', () => { clearTimeout(ft); conn._seen = true; G.up = true; G.na = 0; iceFails(0); conn.send({ t: 'hello', cid, name: G.name || name, v: VER }); h.onUp && h.onUp(); });
      conn.on('data', msg => {
        if (!msg || typeof msg !== 'object' || G.closed) return;
        if (msg.t === 'bye') { G.closed = true; h.onBye && h.onBye(); return; }
        if (msg.t === 'hv') { G.hv = msg.v; if (msg.v !== VER) mismatch(msg.v); return; }
        if (msg.t === 'ver') { mismatch(msg.v); return; }
        if (!G.hv && msg.t !== 'hv' && msg.t !== 'ping') { mismatch(null); return; }
        h.onMsg && h.onMsg(msg);
      });
      const lost = () => { clearTimeout(ft); if (G.conn !== conn || G.failed || conn._na) return; G.up = false; h.onDown && h.onDown(); retry(); };
      conn.on('close', lost); conn.on('error', lost);
    }
    function iceFails(d) {
      const k = NS + '.icefail.' + room; let n = 0;
      try { n = parseInt(sessionStorage.getItem(k), 10) || 0; } catch (e) { n = G._icef || 0; }
      n = d ? n + 1 : 0; G._icef = n;
      try { if (n) sessionStorage.setItem(k, String(n)); else sessionStorage.removeItem(k); } catch (e) { }
      return n;
    }
    function mismatch(v) { if (G.closed) return; G.closed = true; G.up = false; G.verBlocked = v || 'old'; try { G.conn && G.conn.close(); } catch (e) { } try { G.peer && G.peer.destroy(); } catch (e) { } h.onVer && h.onVer(v || null); }
    let rt = null; function retry(ms) { if (G.closed || G.failed || rt) return; rt = setTimeout(() => { rt = null; connect(); }, ms || 2000); }
    const kick = () => { if (G.closed || G.failed || G.up || hidden()) return; if (rt) { clearTimeout(rt); rt = null; connect(); } };
    on(DOC, 'visibilitychange', kick); on(window, 'online', kick);
    G.send = msg => { if (G.conn && G.conn.open) try { G.conn.send(msg); return true; } catch (e) { } return false; };
    G.rename = n => { G.name = String(n || '').slice(0, 14) || G.name; if (G.conn && G.conn.open) try { G.conn.send({ t: 'hello', cid, name: G.name, v: VER }); } catch (e) { } };
    G.retryNow = force => { if (G.failed === 'final' && !force) return false; G.failed = false; clearTimeout(rt); rt = null;
      if (force && G.peer) { try { G.peer.destroy(); } catch (e) { } G.peer = null; } // rebuild the Peer so new ICE config (relay) applies
      connect(); return true; };
    G.iceFails = () => { try { return parseInt(sessionStorage.getItem(NS + '.icefail.' + room), 10) || 0; } catch (e) { return G._icef || 0; } };
    G.drop = () => { try { G.conn && G.conn.close(); } catch (e) { } };
    G.close = () => { G.closed = true; clearTimeout(rt); clearTimeout(pw); off(DOC, 'visibilitychange', kick); off(window, 'online', kick); try { G.conn && G.conn.close(); } catch (e) { } try { G.peer && G.peer.destroy(); } catch (e) { } };
    connect();
    return G;
  }
  return { newRoom, roomLink, roomFromHash, pendingRoom, clearPending, normRoom, PID, cidFor, host, join, VER, NS, LEN, hasPeerLib, fetchRelay, relayActive: () => !!RELAY_SERVERS, forceRelay: FORCE_RELAY, iceLimit: () => (RELAY_SERVERS ? 10 : ICE_STRIKES) };
  }
  window.OnlineNet = { make, hasPeerLib };
})();
