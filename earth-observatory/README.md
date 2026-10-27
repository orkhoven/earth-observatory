# Earth Observatory — iPad Air 1 edition

A lightweight static dashboard designed for an **iPad Air 1 (A1474), iOS 12.5.x, Safari 12**. No jailbreak, paid API, app installation, or always-running home computer is required. The iPad needs Wi‑Fi and the published web page.

## Features

- **Earthquake map:** USGS GeoJSON feeds, with 24-hour M2.5+ and 7-day M4.5+ views. Tap a dot or recent event for magnitude, location, time and depth.
- **Global activity summary:** event count, largest magnitude, and most recent event.
- **Space weather:** NOAA observed planetary Kp value (reported for 3-hour periods), with a simple qualitative interpretation. It is not an aurora forecast.
- **Lyon weather:** current modeled local temperature, condition, and wind from Open-Meteo.
- **Refresh:** every 10 minutes while the dashboard is visible, plus a manual refresh button. Browser background throttling or locked-screen behavior may interrupt scheduled refresh.
- **Low-memory design:** vector coastline embedded in HTML, no map tiles, no framework, no account, no analytics/tracking, no downloaded JavaScript libraries.

Sources: [USGS](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php), [NOAA SWPC](https://www.swpc.noaa.gov/content/data-access), [Open-Meteo](https://open-meteo.com/). Basemap geography sourced from the public-domain Natural Earth low-resolution dataset.

## How to put it on the iPad (one-time setup)

### Option A: GitHub Pages (recommended)

1. Sign in to GitHub on any computer (you can turn the computer off afterward).
2. Create a new **public** repository, e.g. `earth-observatory`.
3. Upload **`index.html`, `style.css`, `app.js`, and `icon.png`** to the root of the repository (not inside another folder). Commit the files.
4. Open **Settings → Pages** in the repository. In *Build and deployment*, choose **Deploy from a branch**, then **main / (root)**, and save.
5. Once Pages indicates the site is published, open the exact URL displayed in the repository's Pages settings using **Safari on the iPad**. Its usual form is `https://YOUR_USERNAME.github.io/earth-observatory/`.
6. In old iOS Safari, choose **Share → Add to Home Screen**. Launch from the new icon. In **Settings → Display & Brightness → Auto-Lock**, set **Never** if offered, and keep the tablet on power when used as a permanent panel.

GitHub Pages provides the static file hosting only. External feeds are fetched from the iPad itself, so this is not a backend proxy and won't resolve upstream CORS restrictions.

### Option B: test on a Mac before publishing

From the project folder, run `python3 -m http.server 8000` and open `http://localhost:8000` on that same Mac. For the iPad, host the files on a public/static hosting service as in Option A; **the Mac is not needed afterward**.

## Known limits

- **Physical iPad validation pending.** The interface and interactions have been tested using a desktop Chromium browser at the original iPad Air's 1024×768 landscape resolution, but not on the device's Safari 12 implementation.
- Public feeds and CORS can change. If a feed fails, its panel displays a missing/unavailable state instead of invented values. The weather and NOAA feeds have not been end-to-end verified in real Safari 12.
- The quake data is a USGS subset, not all seismic activity in the world; the two filters have deliberately different magnitude cutoffs.
- The built-in world map is not draggable or zoomable; this is deliberate for low CPU and RAM use. Marker taps are supported.
- A webpage cannot ensure live updating while Safari/iOS suspends it or the screen is locked.
- No offline scientific-data mode: the map base remains visible without internet, but current data cannot be retrieved.
- This is an informational dashboard, not an earthquake early-warning or emergency alert system.

## Files

- `index.html` — dashboard and public-domain low-res coastline vector
- `style.css` — responsive appearance, including a compact 1024×768 landscape layout
- `app.js` — feed loading, interactive map markers and UI updates (ES5 syntax)
- `icon.png` — Home Screen icon

## Changing the home city

The Open-Meteo URL inside `app.js` currently uses central Lyon (`latitude=45.764`, `longitude=4.8357`). Change those coordinates and update the label in `index.html` if needed.

This project is intended for personal/non-commercial use. Follow the attribution and usage terms of each external provider if republishing.
