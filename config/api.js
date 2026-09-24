/* ================================================================== */
/*  API Configuration -- GitHub Pages (static site, no backend)       */
/* ================================================================== */

// AllOrigins /get endpoint returns { contents: "...", status: {...} }
// and always sets Access-Control-Allow-Origin: *
// The &cb= param busts Cloudflare's CDN cache per request so a rate-limited
// error response for one symbol does not poison subsequent fetches.
const CORS_PROXIES = [
  {
    wrap: (u) => {
      const cb = Date.now() + Math.floor(Math.random() * 100000);
      return `https://api.allorigins.win/get?url=${encodeURIComponent(u)}&cb=${cb}`;
    },
    unwrap: true,
  },
];

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

const API_CONFIG = {
  timeout: 8000,
  range: "5d",
  interval: "15m",
};
