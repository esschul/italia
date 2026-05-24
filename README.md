# Italy Trip Widget

iPhone home screen widget (Scriptable) backed by Supabase Edge Functions.

**Trip starts: July 11, 2026**

## Two views

**Countdown** (before July 11) — big number, fun facts, recipes, history  
**Italy** (during the trip) — day title, location, live weather, day plan, fun fact

## Architecture

```
itinerary.json  ──▶  GitHub Action (daily 06:00 Rome)
                          │
                          ├── Open-Meteo weather API (free, no key)
                          └── Supabase daily_content table
                                    │
                              Edge function /today
                                    │
                              Scriptable widget
```

## Setup

### 1. Supabase — run migrations in order
```
supabase/migrations/001_daily_content.sql
supabase/migrations/002_add_illustration.sql
supabase/migrations/003_add_weather.sql
```

### 2. Seed countdown content
Run `content/seed_countdown.sql` in the Supabase SQL editor.

### 3. Deploy edge function
```
supabase functions deploy today
```

### 4. Scriptable widget
1. Install [Scriptable](https://scriptable.app) on your iPhone
2. New script → paste `scriptable/ItalyWidget.js`
3. Add a Scriptable widget (medium) to your home screen

### 5. GitHub Actions secrets
Add these two secrets to the repo (Settings → Secrets → Actions):
- `SUPABASE_URL` — e.g. `https://cxgxnqxnocwippgeduex.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase → Project Settings → API

The Action runs every morning at 06:00 Rome time, reads `content/itinerary.json`
for that day's entry, fetches live weather, and upserts the row into Supabase.

## Adding itinerary days
Edit `content/itinerary.json` — add an object per day:
```json
{
  "date": "2026-07-14",
  "title": "Day 4 — Naples & Pompeii 🌋",
  "location": "Naples",
  "lat": 40.8518,
  "lon": 14.2681,
  "description": "Early train to Naples. Pompeii in the morning. Pizza al portafoglio for lunch.",
  "fun_fact": "Pompeii was buried so quickly that excavators found bread still in the oven."
}
```

## Testing
Append `?date=2026-07-11` to the edge function URL to preview any date.
