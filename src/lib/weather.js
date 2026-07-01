/**
 * Current weather context via the Open-Meteo Forecast API (free, keyless).
 * Purely contextual chips (temperature / humidity / conditions) — best-effort
 * and non-fatal; a null result simply hides the chips.
 */
const WMO = {
  0: 'Clear',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm + hail',
  99: 'Severe thunderstorm',
};

export async function fetchWeather(lat, lon, signal) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather ${res.status}`);
  const json = await res.json();
  const c = json?.current;
  if (!c || c.temperature_2m == null) return null;

  return {
    temp: Math.round(c.temperature_2m),
    humidity: c.relative_humidity_2m ?? null,
    code: c.weather_code ?? null,
    condition: WMO[c.weather_code] ?? '—',
  };
}
