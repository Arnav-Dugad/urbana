/**
 * Air-quality data via the Open-Meteo Air Quality API — free, keyless, global.
 * PM2.5 drives the score (the pollutant that matters most for Indian cities);
 * the rest is shown as context. Failure here is non-fatal: the hook treats a
 * null result as "air unavailable" and still returns the other pillars.
 */
export async function fetchAirQuality(lat, lon, signal) {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5,pm10,nitrogen_dioxide,ozone,us_aqi,uv_index` +
    `&hourly=pm2_5&past_days=1&forecast_days=1&timezone=auto`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Air quality ${res.status}`);
  const json = await res.json();

  const cur = json?.current || {};
  let pm25 = cur.pm2_5;

  // Build a compact 24h PM2.5 trend ending at "now" from the hourly series.
  let trend = [];
  const times = json?.hourly?.time;
  const series = json?.hourly?.pm2_5;
  if (Array.isArray(times) && Array.isArray(series)) {
    const nowIdx = nearestHourIndex(times, cur.time);
    const start = Math.max(0, nowIdx - 23);
    trend = series
      .slice(start, nowIdx + 1)
      .map((v) => (v == null ? null : Number(v)))
      .filter((v) => v != null);
    if (pm25 == null && trend.length) pm25 = trend[trend.length - 1];
  }

  if (pm25 == null) return null;

  return {
    pm25: Number(pm25),
    pm10: numOrNull(cur.pm10),
    no2: numOrNull(cur.nitrogen_dioxide),
    o3: numOrNull(cur.ozone),
    usAqi: numOrNull(cur.us_aqi),
    uv: numOrNull(cur.uv_index),
    trend,
  };
}

function numOrNull(v) {
  return v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10;
}

function nearestHourIndex(times, currentTime) {
  if (currentTime) {
    const i = times.indexOf(currentTime);
    if (i >= 0) return i;
    // current time may not align exactly — match on the hour prefix
    const prefix = currentTime.slice(0, 13);
    const j = times.findIndex((t) => t.slice(0, 13) === prefix);
    if (j >= 0) return j;
  }
  return times.length - 1;
}
