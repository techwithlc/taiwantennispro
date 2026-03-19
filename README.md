# 台灣網球場地圖 🎾

Real-time availability map for 47 public tennis courts across Greater Taipei. Scrapes government booking systems, overlays weather data, and distinguishes between bookable vs walk-up courts — because "available" means very different things depending on the venue type.

**Live:** [taiwantennispro.netlify.app](https://taiwantennispro.netlify.app)

## Why this exists

Taipei has 47+ public tennis courts spread across riverside parks, sports centers, and city parks. The booking data lives in a legacy PHP system (VBS) that wasn't designed for quick lookups. Riverside courts are free but walk-up only — the VBS system still tracks them, but "available" just means the facility is open, not that courts are empty. This distinction trips up every player who checks online and shows up expecting an empty court.

This project fixes that by:
1. Scraping the VBS API and presenting it honestly
2. Separating **booking availability** (green) from **facility hours** (blue) in the UI
3. Adding crowd-sourced occupancy tips for courts with known issues (coach occupation, elderly regulars, etc.)

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Netlify CDN     │────▶│  Static Assets  │
│  React SPA   │     │  (edge cache)    │     │  (Vite build)   │
└──────┬───────┘     └──────────────────┘     └─────────────────┘
       │
       │ /api/availability (5 min poll)
       │ /api/weather      (30 min poll)
       ▼
┌──────────────────┐
│ Netlify Functions │
│  (serverless)     │
└──────┬──────┬─────┘
       │      │
       ▼      ▼
┌──────────┐ ┌──────────────┐
│ VBS API  │ │ Perplexity   │
│ (Taipei  │ │ AI API       │
│  Gov PHP)│ │ (weather)    │
└──────────┘ └──────────────┘
```

### Data flow: VBS scraping

The Taipei Sports Bureau runs `vbs.sports.taipei` — a PHP app with session-based auth. To get court schedules:

1. `GET /venues/?K=266` → grab `PHPSESSID` from `Set-Cookie`
2. `POST /_/x/xhrworkv3.php` with `FUNC=LoadSched` + venue serial number (VSN) → JSON schedule for the day
3. Parse `slot.D` (booked flag) and `slot.IR` (open flag) per hour

We fan out 16 parallel requests (one per VSN) with 8s timeouts. The serverless function caches responses for 5 minutes via `Cache-Control`.

**Key insight:** For walk-up courts (`walkUpOnly: true`), the VBS "available" flag means "the facility is open during this hour" — not "the court is physically empty." These courts can't be booked online, so `D` is always `0`. We surface this as "今日開放" (blue) instead of "有空位" (green) to avoid misleading users.

### Display logic

Courts split into two semantic tracks with different status vocabularies:

| | Has live data | No live data |
|---|---|---|
| **Bookable** | 🟢 可約有位 / 🟡 部分有位 / 🔴 已約滿 | Gray: 可預約 |
| **Walk-up** | 🔵 今日開放 / 🟡 部分時段 / 🔴 今日未開放 | Gray: 現場排隊 |

Map markers use the same color coding: green/red for bookable courts, blue for walk-up. A gray marker means no real-time data — go check the venue's website.

### Weather

Weather is supplementary — it silently fails without breaking the app (`useWeather` swallows errors). We use Perplexity's sonar model to get per-district weather as structured JSON. Cache: 30 min server-side, 30 min client-side polling.

**Why Perplexity instead of CWA (Central Weather Administration)?** CWA's open data API requires navigating forecast dataset codes (`F-D0047-061` for Taipei, `F-D0047-069` for New Taipei) and parsing deeply nested XML/JSON forecast intervals. Perplexity gives us a single structured response for all 23 districts in one call, with current conditions instead of 3-hour forecast windows.

Trade-off: we're dependent on an LLM for weather accuracy. Acceptable because weather here is a "should I bring an umbrella" hint, not safety-critical data.

### Security

- **URL allowlisting:** All booking links are validated against `APPROVED_DOMAINS` before rendering as `<a>` tags. No user-generated URLs.
- **CORS:** API responses are locked to the production origin.
- **No API keys in client:** Both API keys (VBS session, Perplexity) live in serverless functions only. Client never sees them.
- **AbortSignal timeouts:** All upstream fetches have 8s/15s hard timeouts to prevent function hangs.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 19 + TypeScript | Type safety across court data model; React for component reuse (sidebar = desktop + mobile sheet) |
| Map | Leaflet + react-leaflet | Lightweight, no API key needed (vs Google Maps), CartoDB Positron tiles for clean look |
| Styling | Tailwind CSS + inline styles | Tailwind for layout utilities, inline for dynamic status-based colors (computed at render) |
| Backend | Netlify Functions | Zero-config serverless, same deploy as frontend, free tier handles the traffic |
| Weather | Perplexity AI (sonar) | One API call for all 23 districts vs CWA's per-dataset approach |
| Deploy | Netlify | Git push → deploy. Edge CDN. Environment variables for secrets |

**Dependency count: 4 runtime deps** (react, react-dom, leaflet, react-leaflet). Intentionally minimal.

## Court Data (47 venues)

| Type | Count | Data source | Real-time? |
|------|-------|-------------|------------|
| Taipei riverside parks | 14 | VBS API (16 VSNs) | Yes — facility open hours |
| Taipei bookable venues | 2 | VBS API | Yes — actual booking status |
| Taipei sports centers | 10 | Official websites | No — link-only |
| Taipei city parks | 5 | Walk-up only | No |
| New Taipei sports centers | 11 | Official websites | No — link-only |
| New Taipei riverside | 3 | Walk-up only | No |
| Taipei Tennis Center | 1 | tsc.taipei | No — link-only |
| Private | 1 | taipeitenniscourt.com | No — link-only |

## Known Limitations

- **VBS is a scraping target, not a stable API.** If Taipei City changes their PHP endpoints or session logic, the scraper breaks. No SLA.
- **Walk-up court "availability" is inherently unknowable remotely.** We show facility hours + community tips, but can't tell you if someone's physically on the court. A crowdsourcing feature (user-reported status) is the real fix — it's on the roadmap.
- **Weather via LLM is approximate.** Perplexity may hallucinate or return stale weather. We treat it as best-effort supplementary info.
- **Sports center data is static.** We link to their booking sites but don't scrape them — each center uses a different vendor system (CYC, teamXports, etc.). Not worth the maintenance cost for 21 different scrapers.
- **Single-region.** Currently Taipei + New Taipei only. Expanding to other cities requires finding their booking systems (each city runs its own).

## Development

```bash
npm install         # 4 runtime deps, ~15 dev deps
netlify dev         # local dev with serverless functions
npm run build       # tsc + vite production build
```

### Environment Variables (Netlify)

| Variable | Required | Description |
|----------|----------|-------------|
| `PERPLEXITY_API_KEY` | Yes | Perplexity AI API key for weather queries |

## Project Structure

```
src/
  App.tsx                    # Layout: top bar + sidebar + map + mobile sheet
  components/
    CourtSidebar.tsx         # Court list, district filter, detail panel, weather
    CourtMap.tsx             # Leaflet map with status-colored markers
    WeatherBadge.tsx         # Weather display (temp, rain probability, emoji)
  data/courts.ts             # Static court data: coordinates, addresses, VSNs, crowd notes
  hooks/
    useAvailability.ts       # VBS polling hook (5 min interval, dedup with ref)
    useWeather.ts            # Weather polling hook (30 min, silent failure)
  types/court.ts             # Court, CourtStatus, TimeSlot types
netlify/functions/
  availability.mts           # VBS session + parallel schedule fetch for 16 VSNs
  weather.mts                # Perplexity structured weather query for 23 districts
```

## Roadmap

- [x] 47 courts across Greater Taipei with verified GPS + booking URLs
- [x] Real-time VBS integration with honest walk-up vs bookable distinction
- [x] Per-district weather overlay
- [x] Community-sourced crowd notes (11 courts with known issues)
- [ ] **User-reported occupancy** — "I'm here, 2 of 4 courts occupied" — the real fix for walk-up courts
- [ ] **Push notifications** — subscribe to a court, get pinged when slots open
- [ ] **Expand to other cities** — Taichung, Kaohsiung (requires per-city scraper work)
- [ ] **Court condition reviews** — surface quality, lighting, drainage ratings

## License

MIT

---

*Built by Lawrence Chen*
