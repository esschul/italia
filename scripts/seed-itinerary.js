#!/usr/bin/env node
// Seeds all entries from content/itinerary.json into Supabase.
// Weather is skipped for dates too far in the future (Open-Meteo only
// forecasts ~16 days ahead) and will be filled in by the daily Action.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-itinerary.js

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function wmoToCondition(code) {
  if (code === 0)                      return "☀️ Clear";
  if (code === 1)                      return "🌤️ Mainly clear";
  if (code === 2)                      return "⛅ Partly cloudy";
  if (code === 3)                      return "☁️ Overcast";
  if ([45, 48].includes(code))         return "🌫️ Fog";
  if ([51, 53, 55].includes(code))     return "🌦️ Drizzle";
  if ([61, 63, 65].includes(code))     return "🌧️ Rain";
  if ([80, 81, 82].includes(code))     return "🌦️ Showers";
  if (code === 95)                     return "⛈️ Thunderstorm";
  return "🌡️ Unknown";
}

async function fetchWeather(lat, lon, date) {
  try {
    const params = new URLSearchParams({
      latitude:     lat,
      longitude:    lon,
      daily:        "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
      timezone:     "Europe/Rome",
      start_date:   date,
      end_date:     date,
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.daily;
    if (!d?.weathercode?.length) return null;
    return {
      weather_temp_max:   Math.round(d.temperature_2m_max[0]),
      weather_temp_min:   Math.round(d.temperature_2m_min[0]),
      weather_precip_pct: d.precipitation_probability_max[0] ?? 0,
      weather_condition:  wmoToCondition(d.weathercode[0]),
    };
  } catch {
    return null;
  }
}

async function upsert(row) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/daily_content`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey":        SUPABASE_SERVICE_ROLE_KEY,
      "Prefer":        "resolution=merge-duplicates",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Upsert failed: ${res.status} ${await res.text()}`);
}

const itinerary = JSON.parse(
  readFileSync(resolve(__dirname, "../content/itinerary.json"), "utf8")
);

for (const entry of itinerary) {
  process.stdout.write(`${entry.date}  ${entry.title} … `);
  const weather = await fetchWeather(entry.lat, entry.lon, entry.date);
  if (weather) {
    process.stdout.write(`${weather.weather_condition} ${weather.weather_temp_max}°/${weather.weather_temp_min}° … `);
  } else {
    process.stdout.write(`(no weather yet) … `);
  }
  await upsert({
    display_date:     entry.date,
    type:             "itinerary",
    category:         "itinerary",
    title:            entry.title,
    location:         entry.location,
    description:      entry.description,
    fun_fact:         entry.fun_fact,
    illustration_url: entry.illustration_url ?? null,
    ...(weather ?? {}),
  });
  console.log("✓");
}
