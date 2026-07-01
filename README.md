# Urbana — Urban Livability Analysis

Measure the **greenery**, **walkability** and **air quality** of any neighbourhood on Earth from a single click on the map. Urbana runs entirely in the browser on free, keyless open data, and is tuned to be accurate across Indian cities.

![Analysis covers a 1 km radius around any point.](public/favicon.svg)

## What it does

Pick a location (search, "use my location", or click the map) and Urbana analyses everything within a **1 km radius**:

| Score | 0–100 | Based on |
| ----- | ----- | -------- |
| **Greenery** | green land-cover fraction (parks, gardens, grass, woodland) + mapped trees | OpenStreetMap via Overpass |
| **Walkability** | distance-weighted, diversity-adjusted access to pharmacies, supermarkets, schools (+ Indian convenience stores, markets, clinics) | OpenStreetMap via Overpass |
| **Air quality** | inverse of ground-level PM2.5 | Open-Meteo Air Quality API |
| **Livability** | weighted blend of the three (0.35 / 0.35 / 0.30) | — |

Plus: place search & reverse-geocoding (Nominatim), **shareable URLs** (`?lat=&lon=`), and a **compare mode** to pit two neighbourhoods against each other.

## Why it's accurate for India

- Green space leans on **polygon area** (parks/gardens/recreation grounds/woodland), because individual trees are sparsely mapped in Indian OSM data — counting only `natural=tree` would badly under-rate green Indian neighbourhoods.
- Walkability includes **convenience/kirana stores, local marketplaces and clinics** alongside the canonical pharmacy/supermarket/school, so dense-but-informal Indian retail areas aren't scored as "unwalkable".
- Air-quality bands reflect India's real PM2.5 reality (WHO/CPCB-aligned), and search is biased to India (but works worldwide).

Every scoring constant lives in [`src/config/tags.js`](src/config/tags.js) so the model is transparent and tunable — no hidden magic numbers.

## Tech

React + Vite · Tailwind CSS · react-leaflet (CARTO dark basemap) · Turf.js (geodesic areas) · Framer Motion. No backend, no API keys, no secrets.

The core is a reusable hook:

```js
const { data, loading, error, refetch } = useUrbanAnalysis(lat, lon);
// data.greeneryScore, data.walkabilityScore, data.airQualityScore,
// data.livabilityScore, data.breakdown, data.elements
```

It fetches Overpass + Open-Meteo **in parallel**, cancels stale requests with `AbortController`, degrades gracefully if air data is unavailable, retries across Overpass mirrors on rate-limits, and caches results in `localStorage`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle → dist/
npm run preview  # serve the production build
```

> **Note on data:** the public Overpass API is free but shared and rate-limited. Urbana automatically falls back across several mirrors and caches results for 12 h. If an analysis fails, the in-app "Try again" button retries.

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), **Add New → Project → Import** your repo.
3. Vercel auto-detects Vite (Build `npm run build`, Output `dist`). No environment variables needed.
4. Deploy. [`vercel.json`](vercel.json) adds an SPA rewrite so shared deep links (`?lat=&lon=`) resolve correctly.

To show the "view source" link in the header, set `REPO_URL` in [`src/App.jsx`](src/App.jsx).

## Data & credits

- Map data © OpenStreetMap contributors (ODbL) · Overpass API
- Basemap © CARTO
- Air quality © Open-Meteo
- Geocoding © OpenStreetMap / Nominatim

Scores are model estimates derived from open data and depend on local mapping completeness. Treat them as directional, not authoritative.
