/* ================================================================== */
/*  Main Application                                                  */
/* ================================================================== */

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
  const cachedPrices = getCache();
  setLatestResults(INDICES.map((index) => cachedPrices[index.sym]
    ? { ...cachedPrices[index.sym], stale: true, err: false }
    : { ...index, ok: false, err: false }));
  getLatestResults().filter((result) => result.ok).forEach(updateMarker);
  renderSummary(getLatestResults(), INDICES.length);

  let batchResults;
  try {
    batchResults = await fetchAllIndices(INDICES);
  } catch {
    // One retry uses a new cache-busting URL and is still far lighter than the
    // old 19-request fanout.
    try {
      batchResults = await fetchAllIndices(INDICES);
    } catch {
      batchResults = INDICES.map((index) => ({ ...index, ok: false, err: true }));
    }
  }

  const results = batchResults.map((result, index) => {
    if (result.ok) {
      setCache(result.sym, result);
      return { ...result, stale: false };
    }
    const cachedResult = getCache()[INDICES[index].sym];
    return cachedResult
      ? { ...cachedResult, stale: true, err: false }
      : result;
  });

  setLatestResults(results);
  results.forEach(updateMarker);

  rebindAllTooltips(getLatestResults());
  renderSummary(getLatestResults(), INDICES.length);
  const availablePrices = getLatestResults().filter((result) => result.ok);
  const freshCount = availablePrices.filter((result) => !result.stale).length;
  const cachedCount = availablePrices.length - freshCount;
  if (availablePrices.length > 0) {
    feedStatus.textContent = cachedCount > 0
      ? `${freshCount} live · ${cachedCount} cached`
      : `${freshCount}/${INDICES.length} prices live`;
    feedStatus.className = "feed-status live";
    document.getElementById("ts").textContent = freshCount > 0
      ? "Updated " + new Date().toLocaleTimeString()
      : "Using recent prices";
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
