/**
 * Air-quality data via the Open-Meteo Air Quality API — free, keyless, global,
 * and returns ground-level PM2.5 which is the pollutant that matters most for
 * Indian cities. Failure here is non-fatal: the hook treats a null result as
 * "air unavailable" and still returns greenery + walkability.
 */
export async function fetchPm25(lat, lon, signal) {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5&hourly=pm2_5&timezone=auto`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Air quality ${res.status}`);
  const json = await res.json();

  // Prefer the "current" reading; fall back to the latest valid hourly value.
  let pm25 = json?.current?.pm2_5;
  if (pm25 == null && Array.isArray(json?.hourly?.pm2_5)) {
    const series = json.hourly.pm2_5.filter((v) => v != null);
    pm25 = series.length ? series[series.length - 1] : null;
  }
  return pm25 == null ? null : Number(pm25);
}
