import type { Context } from '@netlify/functions'

const VBS_BASE = 'https://vbs.sports.taipei'
const GIS_URL  = `${VBS_BASE}/gis/`
const API_URL  = `${VBS_BASE}/gis/x/xhrfunc.php`

// VSNs of courts with online booking data (discovered via API scan)
// walk-up only courts return RETURN_FALSE — we mark them accordingly
const BOOKABLE_VSNS = [267, 342, 489, 117]

function todayTaipei(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' })
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// All possible 1-hour slots 08:00–22:00
const ALL_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = String(8 + i).padStart(2, '0')
  return `${h}:00`
})

async function getSession(): Promise<string> {
  const res = await fetch(GIS_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaiwanTennisPro/1.0)' },
  })
  const cookie = res.headers.get('set-cookie') ?? ''
  const match = cookie.match(/PHPSESSID=([^;]+)/)
  return match ? match[1] : ''
}

async function getRent(vsn: number, sessionId: string): Promise<Record<string, { StartTime: string; EndTime: string }[]> | null> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': GIS_URL,
      'User-Agent': 'Mozilla/5.0 (compatible; TaiwanTennisPro/1.0)',
      'Cookie': `PHPSESSID=${sessionId}`,
    },
    body: `FUNC=getRent&VSN=${vsn}`,
  })
  const text = await res.text()
  if (text === 'RETURN_FALSE' || text === '[]') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default async function handler(_req: Request, _ctx: Context) {
  const today = todayTaipei()

  try {
    const sessionId = await getSession()
    const results: Record<number, { status: string; slots: { time: string; available: boolean }[] }> = {}

    await Promise.all(
      BOOKABLE_VSNS.map(async (vsn) => {
        const rentData = await getRent(vsn, sessionId)

        if (!rentData) {
          // Walk-up only or not in system
          results[vsn] = { status: 'unknown', slots: [] }
          return
        }

        const todayBooked = rentData[today] ?? {}
        const bookedMinutes = new Set(
          Object.values(todayBooked).map((s) => timeToMinutes(s.StartTime))
        )

        const slots = ALL_SLOTS.map((time) => ({
          time,
          available: !bookedMinutes.has(timeToMinutes(time)),
        }))

        const availCount = slots.filter((s) => s.available).length
        const status =
          availCount === 0 ? 'taken' :
          availCount === slots.length ? 'available' :
          'partial'

        results[vsn] = { status, slots }
      })
    )

    return new Response(
      JSON.stringify({ ok: true, date: today, courts: results }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',  // cache 5 min
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = { path: '/api/availability' }
