# Architecture

## Project Structure

```
Index Monitor/
  index.html              # Entry point (GitHub Pages root)
  config/
    indices.js             # Index definitions and coordinates
    api.js                 # CORS proxy list and API settings
  src/
    js/
      app.js               # Orchestration (init, refresh, events)
      api.js               # Batched network layer (proxyFetch, fetchAllIndices)
      charts.js            # SVG sparkline generation
      formatters.js        # Price and change formatting
      map.js               # Leaflet map setup and marker management
      state.js             # Global state (cache, timers, results)
      ui.js                # Popup and summary panel rendering
      utils.js             # Date helpers and session-state logic
    css/
      style.css            # All styles
  docs/
    ARCHITECTURE.md        # This file
```

## Data Flow

1. **Initialization** -- Map created, loading markers placed
2. **Data Fetching** -- Each index fetched via CORS proxy from Yahoo Finance
3. **Streaming Updates** -- Markers update as data arrives
4. **Global Date Alignment** -- Tooltips rebound with full date context
5. **Auto-refresh** -- Optional 60-second refresh cycle

## CORS Proxy Strategy

GitHub Pages is static-only so all Yahoo Finance requests go through
public CORS proxies. The `proxyFetch` function tries each proxy in order
until one returns valid data. No custom headers are sent so the browser
never triggers a preflight OPTIONS request.

## Key Technologies

- **Leaflet.js** -- Interactive map rendering
- **Yahoo Finance v8 chart API** -- Market data source
- **AllOrigins CORS proxy** -- Carries one batched market request around browser CORS
- **Intl.DateTimeFormat** -- Timezone-aware date handling
