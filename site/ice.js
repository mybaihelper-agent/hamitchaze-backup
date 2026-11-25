window.TABICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  failMs: 12000,
  regMs: 8000,
  // TURN relay fallback (auto since 1.0.6): short-lived credentials are
  // issued by the same-origin /ice function; the Metered secret key never
  // reaches the client. Automatic after 2 failed direct attempts (Ron 25.11: no user action); 503 warming is retried after readyIn.
  relayEndpoint: '/ice'
};
