import type { Context } from '@netlify/functions'

// CWA Open Data API — 鄉鎮天氣預報 (2天, 6小時解析度)
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

/** Pick the forecast period that covers "now" (or the nearest upcoming one) */
function pickCurrentPeriod(times: CwaTimePeriod[]): CwaTimePeriod | undefined {
  const now = new Date()
  // Find the period where now falls between start and end
  const current = times.find(t => {
    const start = new Date(t.startTime)
    const end = new Date(t.endTime)
    return now >= start && now < end
  })
  // Fallback: first future period
  return current ?? times.find(t => new Date(t.startTime) > now) ?? times[0]
}

interface CwaTimePeriod {
  startTime: string
  endTime: string
  elementValue: { value: string; measures: string }[]
}

interface CwaElement {
  elementName: string
  time: CwaTimePeriod[]
}

interface CwaLocation {
  locationName: string
  weatherElement: CwaElement[]
}

function parseLocations(locations: CwaLocation[]): DistrictWeather[] {
  return locations.map((loc) => {
    const wxEl = loc.weatherElement.find(e => e.elementName === 'Wx')
    const tEl = loc.weatherElement.find(e => e.elementName === 'T')
    const popEl = loc.weatherElement.find(e => e.elementName === 'PoP6h')

    const wxPeriod = wxEl ? pickCurrentPeriod(wxEl.time) : undefined
    const tPeriod = tEl ? pickCurrentPeriod(tEl.time) : undefined
    const popPeriod = popEl ? pickCurrentPeriod(popEl.time) : undefined

    return {
      district: loc.locationName,
      wx: wxPeriod?.elementValue?.[0]?.value ?? '—',
      temp: Math.round(Number(tPeriod?.elementValue?.[0]?.value ?? 0)),
      pop: Math.round(Number(popPeriod?.elementValue?.[0]?.value ?? 0)),
    }
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
      const locations: CwaLocation[] =
        json?.records?.locations?.[0]?.location ?? []
      return parseLocations(locations)
    })

    return new Response(
      JSON.stringify({ ok: true, districts }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800', // 30 min — CWA updates every 6h
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
