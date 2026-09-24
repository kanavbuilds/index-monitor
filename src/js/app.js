/* ================================================================== */
/*  Main Application                                                  */
/* ================================================================== */

/**
 * Runs an array of async tasks with a concurrency limit.
 * @param {Function[]} tasks - Array of () => Promise functions
 * @param {number} limit - Max concurrent tasks
 * @param {number|Function} stagger - ms delay between starting each task, or function returning delay
 */
async function runConcurrent(tasks, limit, stagger) {
  const results = [];
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const idx = next++;
      if (idx > 0) {
        const delay = typeof stagger === 'function' ? stagger() : stagger;
        await new Promise((r) => setTimeout(r, delay));
      }
      results[idx] = await tasks[idx]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Refreshes all index data and updates the UI
 */
async function refresh() {
  const btn = document.getElementById("btnRef");
  const feedStatus = document.getElementById("feedStatus");
  btn.classList.add("spin");
  btn.disabled = true;
  feedStatus.textContent = "Updating prices";
  feedStatus.className = "feed-status loading";

  resetMarkersToLoading();
  setLatestResults(INDICES.map((i) => ({ ...i, ok: false, err: false })));
  renderSummary(getLatestResults(), INDICES.length);

  const failed = [];

  // Build tasks -- each is a closure that fetches one index
  const tasks = INDICES.map((idx, i) => async () => {
    try {
      const result = await fetchIndex(idx);
      setCache(idx.sym, result);
      const results = getLatestResults();
      results[i] = result;
      setLatestResults(results);
      updateMarker(result);
      rebindAllTooltips(getLatestResults());
      renderSummary(getLatestResults(), INDICES.length);
    } catch {
      failed.push(i);
      const errData = { ...idx, ok: false, err: true };
      const results = getLatestResults();
      results[i] = errData;
      setLatestResults(results);
      updateMarker(errData);
      renderSummary(getLatestResults(), INDICES.length);
    }
  });

  // Price data is an enhancement. Market-hours data renders immediately,
  // so a slow public proxy never leaves the dashboard unusable.
  await runConcurrent(tasks, 3, () => 250 + Math.random() * 250);

  rebindAllTooltips(getLatestResults());
  renderSummary(getLatestResults(), INDICES.length);
  const loadedCount = getLatestResults().filter((result) => result.ok).length;
  if (loadedCount > 0) {
    feedStatus.textContent = `${loadedCount}/${INDICES.length} prices live`;
    feedStatus.className = "feed-status live";
    document.getElementById("ts").textContent = "Updated " + new Date().toLocaleTimeString();
  } else {
    feedStatus.textContent = "Market hours live";
    feedStatus.className = "feed-status";
    document.getElementById("ts").textContent = "Price feed unavailable";
  }
  btn.classList.remove("spin");
  btn.disabled = false;
}

/* ================================================================== */
/*  Bootstrap                                                         */
/* ================================================================== */

document.getElementById("headerDate").textContent =
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

document.getElementById("arToggle").addEventListener("change", function () {
  clearAutoRefreshTimer();
  setAutoRefreshTimer(this.checked ? setInterval(refresh, 60_000) : null);
});

document.getElementById("btnRef").addEventListener("click", refresh);

initMap();
placeLoadingMarkers();
setLatestResults(INDICES.map((index) => ({ ...index, ok: false, err: false })));
renderSummary(getLatestResults(), INDICES.length);
refresh();
