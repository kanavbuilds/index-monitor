/* ================================================================== */
/*  UI Rendering Functions                                            */
/* ================================================================== */

/**
 * Builds HTML for a marker popup
 * @param {Object} data - Index data object
 * @param {string[]} globalDates - Array of global dates for alignment
 * @returns {string} HTML markup for the popup
 */
function buildPopupHTML(data, globalDates) {
  const days = data.days || [];
  const dayByDate = {};
  days.forEach((d) => (dayByDate[d.date] = d));

  const [newestDate, olderDate] = globalDates || [];
  const newestDay = newestDate ? dayByDate[newestDate] : days[days.length - 1];
  const olderDay  = olderDate  ? dayByDate[olderDate]  : (days.length > 1 ? days[days.length - 2] : null);

  const displayDay = newestDay || days[days.length - 1];
  const positive = displayDay ? displayDay.changePercent >= 0 : data.change >= 0;
  const arrow = positive ? "\u25B2" : "\u25BC";
  const chgClass = positive ? "pos" : "neg";

  const statusHTML = data.stale
    ? '<span class="popup-closed">\u25CF Recent price</span>'
    : data.session === "open"
    ? '<span class="popup-open">\u25CF Live</span>'
    : '<span class="popup-closed">\u25CF Closed</span>';

  let newestSection;
  if (newestDay) {
    newestSection = `
      <div class="popup-price">${formatPrice(newestDay.lastClose)} <span class="popup-date">${newestDay.label}</span></div>
      <div class="popup-chg ${chgClass}">
        ${arrow} ${formatChange(newestDay.change)}
        <span class="popup-badge">${formatPercent(newestDay.changePercent)}</span>
      </div>`;
  } else {
    const lastActual = days[days.length - 1];
    const traded = newestDate ? shouldHaveTraded(data, newestDate) : false;
    const noDataLabel = traded ? "Holiday" : "Not opened yet";
    newestSection = `
      <div class="popup-price">${lastActual ? formatPrice(lastActual.lastClose) : "\u2014"}</div>
      <div class="popup-chg" style="color:var(--text-muted)">${newestDate ? friendlyDate(newestDate) : ""}: ${noDataLabel}</div>`;
  }

  let prevSessionHTML = "";
  if (olderDay) {
    const prevPos = olderDay.changePercent >= 0;
    const prevArrow = prevPos ? "\u25B2" : "\u25BC";
    const prevCls = prevPos ? "pos" : "neg";
    prevSessionHTML = `
      <div class="popup-prev">
        <span class="popup-prev-label">${olderDay.label}</span>
        <span class="popup-prev-chg ${prevCls}">${prevArrow} ${formatPercent(olderDay.changePercent)}</span>
      </div>`;
  }

  const sparkDay = displayDay || {};

  return `
    <div class="popup-card">
      <div class="popup-hdr">
        <span>${data.fl} ${data.co}</span>
        ${statusHTML}
      </div>
      <div class="popup-name">${data.name}</div>
      ${newestSection}
      ${prevSessionHTML}
      <div class="popup-spark">${buildSparkline(sparkDay.closes || data.closes, positive)}</div>
      <div class="popup-details">
        <span>
          <span class="popup-detail-label">Prev Close</span>
          <span class="popup-detail-val">${formatPrice(displayDay ? displayDay.prevClose : data.previousClose)}</span>
        </span>
        <span>
          <span class="popup-detail-label">Day Range</span>
          <span class="popup-detail-val">${formatPrice(displayDay ? displayDay.dayLow : data.dayLow)} \u2013 ${formatPrice(displayDay ? displayDay.dayHigh : data.dayHigh)}</span>
        </span>
      </div>
      <div class="popup-desc">${data.desc}</div>
    </div>`;
}

/**
 * Computes market sentiment label and CSS class
 * @param {number} up - Count of advancing indices
 * @param {number} total - Total count
 * @param {number} avg - Average change percentage
 * @returns {[string, string]} Tuple of [label, cssClass]
 */
function computeSentiment(up, total, avg) {
  if (!total) return ["Neutral", ""];
  let label, cls;
  if      (avg > 1)     { label = "Highly bullish";   cls = "up"; }
  else if (avg > 0.5)   { label = "Bullish";          cls = "up"; }
  else if (avg > 0.1)   { label = "Slightly bullish"; cls = "up"; }
  else if (avg >= -0.1) { label = "Neutral";           cls = ""; }
  else if (avg >= -0.5) { label = "Slightly bearish";  cls = "down"; }
  else if (avg >= -1)   { label = "Bearish";           cls = "down"; }
  else                   { label = "Highly bearish";   cls = "down"; }
  return [label, cls];
}

/**
 * Renders the summary panel with market statistics
 * @param {Object[]} list - Array of index data objects
 * @param {number} total - Total number of indices
 */
function renderSummary(list, total) {
  const loaded = list.filter((d) => d.ok);
  const failed = list.filter((d) => d.err);
  const doneCount = loaded.length + failed.length;
  const loading = doneCount < total;

  // Collect ALL day entries from ALL indices, grouped by date
  const dateGroups = {};
  loaded.forEach((d) => {
    (d.days || []).forEach((day) => {
      if (!dateGroups[day.date]) dateGroups[day.date] = { label: day.label, entries: [] };
      dateGroups[day.date].entries.push({ idx: d, day });
    });
  });

  // Keep only the 2 most recent dates
  const sortedDates = Object.keys(dateGroups).sort().reverse().slice(0, 2);

  let html = `<div class="panel-heading">Market Overview</div>`;

  if (loaded.length === 0) {
    const openMarkets = INDICES.filter((index) => getSessionState(index) === "open");
    const closedCount = INDICES.length - openMarkets.length;
    html += `<div class="panel-date">Right now</div>`;
    html += `<div class="panel-row"><span class="panel-dot live"></span><span class="panel-label">Open markets</span><span class="panel-val">${openMarkets.length}</span></div>`;
    html += `<div class="panel-row"><span class="panel-dot closed"></span><span class="panel-label">Closed markets</span><span class="panel-val">${closedCount}</span></div>`;
    if (openMarkets.length) {
      html += `<div class="panel-open-list">${openMarkets.map((index) => index.name).join(" · ")}</div>`;
    }
    html += `<div class="panel-divider"></div>`;
    html += `<div class="panel-progress">${loading ? "Loading price data…" : "Price feed unavailable · market hours still update live"}</div>`;
    document.getElementById("summaryPanel").innerHTML = html;
    return;
  }

  for (let i = 0; i < sortedDates.length; i++) {
    const dateKey = sortedDates[i];
    const group = dateGroups[dateKey];
    const entries = group.entries;
    const isNewest = i === 0;

    // Count live/closed: "live" only if session=open AND this day is the index's latest
    let live = 0, closed = 0;
    entries.forEach(({ idx, day }) => {
      const isLatest = idx.days && idx.days[idx.days.length - 1] === day;
      if (idx.session === "open" && isLatest) live++;
      else closed++;
    });

    const up   = entries.filter(({ day }) => day.changePercent > 0).length;
    const down = entries.filter(({ day }) => day.changePercent < 0).length;
    const avg  = entries.reduce((s, { day }) => s + day.changePercent, 0) / entries.length;
    const avgCls = avg >= 0 ? "up" : "down";
    const [sentiment, sentCls] = computeSentiment(up, entries.length, avg);

    // Indices without data for this date: holiday vs not opened yet
    const missing = loaded.filter((d) => !(d.days || []).some((dy) => dy.date === dateKey));
    let holidayCount = 0, notYetCount = 0;
    missing.forEach((d) => {
      if (shouldHaveTraded(d, dateKey)) holidayCount++;
      else notYetCount++;
    });

    html += `<div class="panel-date">${group.label}</div>`;
    if (live)   html += `<div class="panel-row"><span class="panel-dot live"></span><span class="panel-label">${live} live</span></div>`;
    if (closed) html += `<div class="panel-row"><span class="panel-dot closed"></span><span class="panel-label">${closed} closed</span></div>`;
    if (isNewest && holidayCount > 0) {
      html += `<div class="panel-row muted"><span class="panel-dot nyo"></span><span class="panel-label">${holidayCount} holiday</span></div>`;
    }
    if (isNewest && notYetCount > 0) {
      html += `<div class="panel-row muted"><span class="panel-dot nyo"></span><span class="panel-label">${notYetCount} not opened yet</span></div>`;
    }
    html += `<div class="panel-row"><span class="panel-dot up"></span><span class="panel-label">Advancing</span><span class="panel-val">${up}</span></div>`;
    html += `<div class="panel-row"><span class="panel-dot down"></span><span class="panel-label">Declining</span><span class="panel-val">${down}</span></div>`;
    html += `<div class="panel-metric"><span class="panel-metric-label">Avg</span><span class="panel-metric-val ${avgCls}">${formatPercent(avg)}</span></div>`;
    html += `<div class="panel-metric"><span class="panel-metric-label">Sentiment</span><span class="panel-metric-val ${sentCls}">${sentiment}</span></div>`;

    html += `<div class="panel-divider"></div>`;
  }

  if (loading) {
    html += `<div class="panel-progress">Loading ${doneCount}/${total}\u2026</div>`;
  }

  document.getElementById("summaryPanel").innerHTML = html;
}

/**
 * Rebinds all tooltips with global date alignment
 * @param {Object[]} latestResults - Array of latest index results
 */
function rebindAllTooltips(latestResults) {
  const allDates = new Set();
  latestResults.forEach((d) => {
    if (!d.ok || !d.days) return;
    d.days.forEach((day) => allDates.add(day.date));
  });
  const globalDates = [...allDates].sort().reverse().slice(0, 2);
  const [newestDate, olderDate] = globalDates;
  if (!newestDate) return;

  const newestLabel = friendlyDate(newestDate);
  const olderLabel  = olderDate ? friendlyDate(olderDate) : null;
  const markerMap = getMarkerMap();

  latestResults.forEach((data) => {
    if (!data.ok) return;
    const marker = markerMap[data.sym];
    if (!marker) return;

    const days = data.days || [];
    const dayByDate = {};
    days.forEach((d) => (dayByDate[d.date] = d));

    const isOpen = data.session === "open";

    const newestDay = dayByDate[newestDate];
    const olderDay  = olderDate ? dayByDate[olderDate] : null;

    let ttHtml = `<span class="tt-name">${data.name}</span>`;

    if (newestDay) {
      const p = newestDay.changePercent >= 0;
      ttHtml += ` <span class="tt-pct ${p ? "up" : "down"}">${formatPercent(newestDay.changePercent)}</span>`;
      ttHtml += `<span class="tt-status">${isOpen && newestDay === days[days.length - 1] ? "live" : newestLabel}</span>`;
    } else {
      const traded = shouldHaveTraded(data, newestDate);
      const noDataLabel = traded ? "holiday" : "not opened";
      ttHtml += ` <span class="tt-pct nyo">\u2014</span>`;
      ttHtml += `<span class="tt-status nyo">${newestLabel}: ${noDataLabel}</span>`;
    }

    if (olderDay) {
      const op = olderDay.changePercent >= 0;
      ttHtml += `<span class="tt-sep">|</span><span class="tt-prev">${olderLabel}: <span class="${op ? "up" : "down"}">${formatPercent(olderDay.changePercent)}</span></span>`;
    }

    // Gray out markers with no data for the newest date (holiday / not opened)
    if (!newestDay) {
      marker.off("mouseover mouseout");
      marker.unbindTooltip();
      marker.unbindPopup();
      marker.setStyle({ fillColor: "#334155", color: "#475569", fillOpacity: 0.4, opacity: 0.5, weight: 2 });
      marker.setRadius(6);
      marker.on("mouseover", function () { this.setRadius(8); this.setStyle({ fillOpacity: 0.6, opacity: 0.7 }); });
      marker.on("mouseout",  function () { this.setRadius(6); this.setStyle({ fillOpacity: 0.4, opacity: 0.5 }); });
      marker.bindTooltip(ttHtml, { className: "idx-tooltip", direction: "top", offset: [0, -8] });
      marker.bindPopup(buildPopupHTML(data, globalDates), { className: "idx-popup", maxWidth: 340, minWidth: 280 });
    } else {
      marker.unbindTooltip();
      marker.bindTooltip(ttHtml, { className: "idx-tooltip", direction: "top", offset: [0, -8] });
      marker.unbindPopup();
      marker.bindPopup(buildPopupHTML(data, globalDates), { className: "idx-popup", maxWidth: 340, minWidth: 280 });
    }
  });
}
