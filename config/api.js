/* ================================================================== */
/*  API Configuration -- GitHub Pages (static site, no backend)       */
/* ================================================================== */

// AllOrigins /get endpoint returns { contents: "...", status: {...} }
// and always sets Access-Control-Allow-Origin: *
// The upstream URL already includes a cache-busting query parameter. Adding a
// second AllOrigins cache key causes large batched responses to time out.
const CORS_PROXIES = [
  {
    wrap: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    unwrap: true,
  },
];

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

const API_CONFIG = {
  timeout: 20000,
  range: "5d",
  interval: "15m",
};
