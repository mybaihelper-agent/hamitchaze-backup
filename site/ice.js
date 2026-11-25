window.TABICE = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: 'stun:stun.cloudflare.com:3478' }
  ],
  failMs: 12000,
  regMs: 8000,
  // TURN relay fallback (test build 1.0.4-turn1): short-lived credentials are
  // issued by the same-origin /ice function; the Metered secret key never
  // reaches the client. Offered only after repeated direct-connection failure.
  relayEndpoint: '/ice'
};
