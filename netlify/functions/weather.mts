import type { Context } from '@netlify/functions'

// CWA Open Data API — 鄉鎮天氣預報 (2天)
// 台北市: F-D0047-061, 新北市: F-D0047-069
const CWA_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
const DATASETS = ['F-D0047-061', 'F-D0047-069'] as const
const ELEMENTS = 'Wx,T,PoP6h'

interface DistrictWeather {
  district: string
  wx: string
  temp: number
  pop: number
}

// ── CWA response types (PascalCase keys) ──

interface CwaElementValue {
  // Wx → { Weather: "晴", WeatherCode: "01" }
  // T  → { Temperature: "25" }
  // PoP6h → { ProbabilityOfPrecipitation: "30" }
  [key: string]: string
}

interface CwaTimePeriod {
  StartTime?: string
  EndTime?: string
  DataTime?: string        // T (temperature) uses DataTime instead of Start/End
  ElementValue: CwaElementValue[]
}

interface CwaElement {
  ElementName: string
  Time: CwaTimePeriod[]
}

interface CwaLocation {
  LocationName: string
  WeatherElement: CwaElement[]
}

/** Pick the forecast period that covers "now" (or the nearest upcoming one) */
function pickCurrentPeriod(times: CwaTimePeriod[]): CwaTimePeriod | undefined {
  const now = new Date()

  const current = times.find(t => {
    // Period-based (Wx, PoP6h): StartTime / EndTime
    if (t.StartTime && t.EndTime) {
      return now >= new Date(t.StartTime) && now < new Date(t.EndTime)
    }
    // Point-in-time (T): DataTime — pick the closest one not in the future
    return false
  })
  if (current) return current

  // For DataTime-based elements, pick the closest past or present entry
  if (times[0]?.DataTime) {
    const past = times.filter(t => new Date(t.DataTime!) <= now)
    return past.length > 0 ? past[past.length - 1] : times[0]
  }

  // Fallback: first future period, or just the first entry
  return times.find(t => t.StartTime && new Date(t.StartTime) > now) ?? times[0]
}

function parseLocations(locations: CwaLocation[]): DistrictWeather[] {
  return locations.map((loc) => {
    const wxEl = loc.WeatherElement.find(e => e.ElementName === 'Wx')
    const tEl = loc.WeatherElement.find(e => e.ElementName === 'T')
    const popEl = loc.WeatherElement.find(e => e.ElementName === 'PoP6h')

    const wxPeriod = wxEl ? pickCurrentPeriod(wxEl.Time) : undefined
    const tPeriod = tEl ? pickCurrentPeriod(tEl.Time) : undefined
    const popPeriod = popEl ? pickCurrentPeriod(popEl.Time) : undefined

    // Extract values from CWA's named-key format
    const wx = wxPeriod?.ElementValue?.[0]?.Weather ?? '—'
    const temp = Math.round(Number(tPeriod?.ElementValue?.[0]?.Temperature ?? 0))
    const pop = Math.round(Number(popPeriod?.ElementValue?.[0]?.ProbabilityOfPrecipitation ?? 0))

    return { district: loc.LocationName, wx, temp, pop }
  })
}

export default async function handler(_req: Request, _ctx: Context) {
  const apiKey = Netlify.env.get('CWA_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'CWA API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Fetch both Taipei & New Taipei in parallel
    const results = await Promise.all(
      DATASETS.map(async (dataset) => {
        const url = `${CWA_BASE}/${dataset}?Authorization=${apiKey}&elementName=${ELEMENTS}&format=JSON`
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) throw new Error(`CWA API ${dataset} returned ${res.status}`)
        return res.json()
      })
    )

    const districts: DistrictWeather[] = results.flatMap((json) => {
      // CWA uses PascalCase: records.Locations[0].Location[]
      const locations: CwaLocation[] =
        json?.records?.Locations?.[0]?.Location ?? []
      return parseLocations(locations)
    })

    return new Response(
      JSON.stringify({ ok: true, districts }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800',
          'Access-Control-Allow-Origin': 'https://taiwantennispro.netlify.app',
        },
      }
    )
  } catch (err) {
    console.error('weather API error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: '無法取得天氣資料' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = { path: '/api/weather' }
