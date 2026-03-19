import type { Context } from '@netlify/functions'

// CWA Open Data — 鄉鎮天氣預報
// F-D0047-061 = 台北市, F-D0047-069 = 新北市
const CWA_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
const DATASETS = ['F-D0047-061', 'F-D0047-069']

interface WeatherElement {
  elementName: string
  time: { startTime: string; endTime: string; elementValue: { value: string }[] }[]
}

interface LocationData {
  locationName: string
  weatherElement: WeatherElement[]
}

interface DistrictWeather {
  district: string
  wx: string          // weather description (e.g. "晴" "多雲")
  temp: number        // temperature °C
  pop: number         // probability of precipitation %
}

function pickCurrentPeriod(times: WeatherElement['time'][]): WeatherElement['time'][number] | null {
  // times is an array from the element — pick the period that covers "now"
  const flat = times.flat()
  const now = new Date()
  for (const t of flat) {
    if (new Date(t.startTime) <= now && now <= new Date(t.endTime)) return t
  }
  return flat[0] ?? null // fallback to first period
}

function extractElement(loc: LocationData, name: string): string | null {
  const el = loc.weatherElement.find(e => e.elementName === name)
  if (!el) return null
  const period = pickCurrentPeriod([el.time])
  return period?.elementValue?.[0]?.value ?? null
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
    const allDistricts: DistrictWeather[] = []

    await Promise.all(
      DATASETS.map(async (dataset) => {
        const url = `${CWA_BASE}/${dataset}?Authorization=${apiKey}&format=JSON`
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) throw new Error(`CWA API ${res.status}`)
        const json = await res.json()

        const locations: LocationData[] =
          json?.records?.locations?.[0]?.location ?? []

        for (const loc of locations) {
          const wx = extractElement(loc, 'Wx') ?? '—'
          const tempStr = extractElement(loc, 'T') ?? extractElement(loc, 'AT')
          const popStr = extractElement(loc, 'PoP6h') ?? extractElement(loc, 'PoP12h')

          allDistricts.push({
            district: loc.locationName,
            wx,
            temp: tempStr ? Math.round(Number(tempStr)) : 0,
            pop: popStr ? Math.round(Number(popStr)) : 0,
          })
        }
      })
    )

    return new Response(
      JSON.stringify({ ok: true, districts: allDistricts }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=1800', // 30 min
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
