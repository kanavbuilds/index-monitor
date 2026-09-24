# World Index Monitor

A lightweight dashboard that shows the live trading status of 19 major stock market indices on an interactive world map. Price data is loaded when the public feed is available; market hours always work locally with no API key.

**[Live Demo](https://kanavbuilds.github.io/index-monitor/)**

## Tracked Indices

| Region | Index | Country |
|---|---|---|
| Americas | S&P 500 | United States |
| | S&P/TSX Composite | Canada |
| | Ibovespa | Brazil |
| | S&P/BMV IPC | Mexico |
| Europe | FTSE 100 | United Kingdom |
| | DAX | Germany |
| | CAC 40 | France |
| | SMI | Switzerland |
| | AEX | Netherlands |
| | FTSE MIB | Italy |
| | IBEX 35 | Spain |
| Asia Pacific | Nikkei 225 | Japan |
| | CSI 300 | China |
| | NIFTY 50 | India |
| | KOSPI | South Korea |
| | S&P/ASX 200 | Australia |
| | Hang Seng Index | Hong Kong |
| | Straits Times Index | Singapore |
| Africa | FTSE/JSE Top 40 | South Africa |

## Features

- Interactive Leaflet world map with color-coded markers at each exchange city
- Always-available open/closed market status, computed in each exchange's timezone
- **Open markets** shown as bright green or red dots with a glow effect
- **Closed markets** shown as smaller muted ring-style dots displaying the last session date on hover
- Click any marker for a detailed popup with current price, daily change, sparkline chart, intraday range, and previous close
- Progressive price-data loading with a graceful market-hours fallback
- Summary panel with advancing/declining counts, average change, and market sentiment indicator
- Timezone-aware session detection using `Intl.DateTimeFormat` and hardcoded exchange hours
- Manual refresh button and optional 60-second auto-refresh toggle
- Dark-themed, responsive UI

## How It Works

Market data is fetched client-side from the Yahoo Finance chart API through a public CORS proxy. Because public proxies can be unavailable, prices are treated as an enhancement: the map, exchange locations, and open/closed market status remain useful without them.

Session state (open vs. closed) is computed from each exchange's timezone and trading hours. No server-side code, API keys, or scheduled jobs are involved -- the page fetches live data on every load and refresh.

## Project Structure

```
index.html                  Entry point
config/
  indices.js                Index definitions, coordinates, and trading hours
  api.js                    CORS proxy configuration and API settings
src/
  js/
    app.js                  Orchestration, refresh loop, event handlers
    api.js                  Network layer (proxyFetch, fetchIndex)
    charts.js               SVG sparkline generation
    formatters.js           Price and change formatting
    map.js                  Leaflet map initialization and marker management
    state.js                Global state (cache, timers, latest results)
    ui.js                   Popup and summary panel rendering
    utils.js                Date helpers and session-state logic
  css/
    style.css               All styles
```

## Running Locally

Open `index.html` in any modern browser. No build step or dependencies to install.

```sh
# or use any local server
python3 -m http.server 8000
```

## License

MIT
