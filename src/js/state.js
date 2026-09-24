/* ================================================================== */
/*  State Management                                                  */
/* ================================================================== */

const PRICE_CACHE_KEY = "world-index-monitor-prices-v1";
const PRICE_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

let cache = loadPersistedCache();
let latestResults = [];
let autoRefreshTimer = null;

function loadPersistedCache() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRICE_CACHE_KEY));
    if (!saved || !saved.updatedAt || Date.now() - saved.updatedAt > PRICE_CACHE_MAX_AGE) return {};
    return saved.data || {};
  } catch {
    return {};
  }
}

function persistCache() {
  try {
    localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), data: cache }));
  } catch {
    // Storage can be unavailable in private browsing; the in-memory cache still works.
  }
}

/**
 * Gets the current cache
 * @returns {Object} Cache object
 */
function getCache() {
  return cache;
}

/**
 * Sets a value in the cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 */
function setCache(key, value) {
  cache[key] = value;
  persistCache();
}

/**
 * Gets the latest results array
 * @returns {Object[]} Array of latest index results
 */
function getLatestResults() {
  return latestResults;
}

/**
 * Sets the latest results array
 * @param {Object[]} results - Array of index results
 */
function setLatestResults(results) {
  latestResults = results;
}

/**
 * Gets the auto-refresh timer
 * @returns {number|null} Timer ID or null
 */
function getAutoRefreshTimer() {
  return autoRefreshTimer;
}

/**
 * Sets the auto-refresh timer
 * @param {number|null} timer - Timer ID or null
 */
function setAutoRefreshTimer(timer) {
  autoRefreshTimer = timer;
}

/**
 * Clears the auto-refresh timer
 */
function clearAutoRefreshTimer() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
}
