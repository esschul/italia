#!/usr/bin/env node
// Fetches today's itinerary entry, enriches it with Open-Meteo weather,
// and upserts into Supabase. Run by the GitHub Action every morning.

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ── WMO weather code → human label ───────────────────────────────────────────
function wmoToCondition(code) {
  if (code === 0)                   return "☀️ Clear";
  if (code === 1)                   return "🌤️ Mainly clear";
  if (code === 2)                   return "⛅ Partly cloudy";
  if (code === 3)                   return "☁️ Overcast";
  if ([45, 48].includes(code))      return "🌫️ Fog";
  if ([51, 53, 55].includes(code))  return "🌦️ Drizzle";
  if ([61, 63, 65].includes(code))  return "🌧️ Rain";
  if ([66, 67].includes(code))      return "🌨️ Freezing rain";
  if ([71, 73, 75, 77].includes(code)) return "❄️ Snow";
  if ([80, 81, 82].includes(code))  return "🌦️ Showers";
  if ([85, 86].includes(code))      return "🌨️ Snow showers";
  if (code === 95)                  return "⛈️ Thunderstorm";
  if ([96, 99].includes(code))      return "⛈️ Heavy thunderstorm";
  return "🌡️ Unknown";
}

// ── Fetch weather from Open-Meteo (no API key needed) ────────────────────────
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
    timezone: "Europe/Rome",
    forecast_days: "1",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const json = await res.json();
  const d = json.daily;
  return {
    weather_temp_max:   Math.round(d.temperature_2m_max[0]),
    weather_temp_min:   Math.round(d.temperature_2m_min[0]),
    weather_precip_pct: d.precipitation_probability_max[0] ?? 0,
    weather_condition:  wmoToCondition(d.weathercode[0]),
  };
}

// ── Upsert into Supabase via REST API ────────────────────────────────────────
async function upsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/daily_content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert failed: ${res.status} ${text}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
console.log(`Running for date: ${today}`);

const itinerary = JSON.parse(
  readFileSync(resolve(__dirname, "../content/itinerary.json"), "utf8")
);

const entry = itinerary.find((e) => e.date === today);
if (!entry) {
  console.log(`No itinerary entry for ${today} — skipping.`);
  process.exit(0);
}

console.log(`Found entry: ${entry.title} @ ${entry.location}`);

const weather = await fetchWeather(entry.lat, entry.lon);
console.log(`Weather: ${weather.weather_condition}, ${weather.weather_temp_max}°/${weather.weather_temp_min}°, ${weather.weather_precip_pct}% rain`);

await upsert({
  display_date:       entry.date,
  type:               "itinerary",
  category:           "itinerary",
  title:              entry.title,
  location:           entry.location,
  description:        entry.description,
  fun_fact:           entry.fun_fact,
  illustration_url:   entry.illustration_url ?? null,
  ...weather,
});

console.log(`✓ Upserted ${entry.date} — ${entry.title}`);
