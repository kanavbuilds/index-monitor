/* ================================================================== */
/*  Map & Marker Management                                           */
/* ================================================================== */

let map;
const markerMap = {};

/**
 * Initializes the Leaflet map
 */
function initMap() {
  map = L.map("map", {
    center: [25, 15],
    zoom: 2.5,
    minZoom: 2,
    maxZoom: 8,
    zoomControl: false,
    attributionControl: true,
    worldCopyJump: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: "abc",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  L.control.zoom({ position: "topright" }).addTo(map);
}

/**
 * Places loading markers for all indices on the map
 */
function placeLoadingMarkers() {
  INDICES.forEach((idx) => {
    const isOpen = getSessionState(idx) === "open";
    const marker = L.circleMarker([idx.lat, idx.lng], {
      radius: isOpen ? 8 : 6,
      fillColor: isOpen ? "#60a5fa" : "#334155",
      fillOpacity: isOpen ? 0.92 : 0.55,
      color: isOpen ? "#93c5fd" : "#64748b",
      weight: isOpen ? 5 : 2,
      opacity: isOpen ? 0.4 : 0.8,
    }).addTo(map);

    marker.bindTooltip(
      `<span class="tt-name">${idx.name}</span> <span class="tt-status ${isOpen ? "hours-open" : ""}">${isOpen ? "open now" : "closed"}</span>`,
      { className: "idx-tooltip", direction: "top", offset: [0, -8] }
    );

    markerMap[idx.sym] = marker;
  });
}

/**
 * Updates a marker's appearance and data based on index data
 * @param {Object} data - Index data object
 */
function updateMarker(data) {
  const marker = markerMap[data.sym];
  if (!marker) return;

  marker.unbindTooltip();
  marker.unbindPopup();
  marker.off("mouseover mouseout");

  if (data.err) {
    const isOpen = getSessionState(data) === "open";
    marker.setStyle({
      fillColor: isOpen ? "#60a5fa" : "#334155",
      color: isOpen ? "#93c5fd" : "#64748b",
      fillOpacity: isOpen ? 0.92 : 0.55,
      opacity: isOpen ? 0.4 : 0.8,
      weight: isOpen ? 5 : 2,
    });
    marker.setRadius(isOpen ? 8 : 6);
    marker.bindTooltip(
      `<span class="tt-name">${data.name}</span> <span class="tt-status ${isOpen ? "hours-open" : ""}">${isOpen ? "open now" : "closed"}</span> <span class="tt-prev">price unavailable</span>`,
      { className: "idx-tooltip", direction: "top", offset: [0, -8] }
    );
    return;
  }

  // Color by performance, style by session state
  const positive = data.change >= 0;
  const isOpen = data.session === "open";

  let baseRadius, baseFill, baseWeight, baseOpacity, fillColor, strokeColor;

  if (isOpen) {
    // Live: bright solid dot with soft glow
    fillColor   = positive ? "#4ade80" : "#f87171";
    strokeColor = fillColor;
    baseRadius  = 9;
    baseFill    = 0.92;
    baseWeight  = 6;
    baseOpacity = 0.35;
  } else {
    // Closed today: hollow ring, muted fill, prominent stroke
    fillColor   = positive ? "#0a2618" : "#2a0f0f";
    strokeColor = positive ? "#15803d" : "#991b1b";
    baseRadius  = 7;
    baseFill    = 0.5;
    baseWeight  = 2.5;
    baseOpacity = 0.9;
  }

  marker.setStyle({ fillColor, color: strokeColor, fillOpacity: baseFill, opacity: baseOpacity, weight: baseWeight });
  marker.setRadius(baseRadius);

  // Simple tooltip during streaming (will be replaced by global-date tooltip later)
  const statusLabel = data.stale ? "cached" : (isOpen ? "live" : "closed");
  const ttHtml = `<span class="tt-name">${data.name}</span> <span class="tt-pct ${positive ? "up" : "down"}">${formatPercent(data.changePercent)}</span> <span class="tt-status">${statusLabel}</span>`;
  marker.bindTooltip(ttHtml, { className: "idx-tooltip", direction: "top", offset: [0, -8] });

  marker.bindPopup(buildPopupHTML(data), { className: "idx-popup", maxWidth: 340, minWidth: 280 });

  marker.on("mouseover", function () { 
    this.setRadius(baseRadius + 3); 
    this.setStyle({ fillOpacity: Math.min(baseFill + 0.2, 1), opacity: Math.min(baseOpacity + 0.2, 1), weight: baseWeight + 2 }); 
  });
  marker.on("mouseout", function () { 
    this.setRadius(baseRadius); 
    this.setStyle({ fillOpacity: baseFill, opacity: baseOpacity, weight: baseWeight }); 
  });
}

/**
 * Resets all markers to loading state
 */
function resetMarkersToLoading() {
  INDICES.forEach((idx) => {
    const m = markerMap[idx.sym];
    if (m) {
      const isOpen = getSessionState(idx) === "open";
      m.setStyle({
        fillColor: isOpen ? "#60a5fa" : "#334155",
        color: isOpen ? "#93c5fd" : "#64748b",
        fillOpacity: isOpen ? 0.92 : 0.55,
        opacity: isOpen ? 0.4 : 0.8,
        weight: isOpen ? 5 : 2,
      });
      m.setRadius(isOpen ? 8 : 6);
      m.unbindPopup();
      m.unbindTooltip();
      m.bindTooltip(
        `<span class="tt-name">${idx.name}</span> <span class="tt-status ${isOpen ? "hours-open" : ""}">${isOpen ? "open now" : "closed"}</span>`,
        { className: "idx-tooltip", direction: "top", offset: [0, -8] }
      );
      m.off("mouseover mouseout");
    }
  });
}

/**
 * Gets the marker map for external access
 * @returns {Object} Map of symbol to marker
 */
function getMarkerMap() {
  return markerMap;
}
