import type { Context } from '@netlify/functions'

const VBS_VENUE_URL = 'https://vbs.sports.taipei/venues/?K=266'
const LOAD_SCHED_URL = 'https://vbs.sports.taipei/_/x/xhrworkv3.php'

// All tennis court VSNs found via API scan
const TENNIS_VSNS = [
  174, 201, 210, 239, 253, 267,
  305, 312, 320, 324, 341, 342, 343, 352, 425, 489,
]

const PLAY_HOURS = Array.from({ length: 17 }, (_, i) => `${String(6 + i).padStart(2, '0')}:00`)

function todayTaipei() {
  const now = new Date()
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(now)
  const year  = Number(parts.find(p => p.type === 'year')!.value)
  const month = Number(parts.find(p => p.type === 'month')!.value)
  const day   = Number(parts.find(p => p.type === 'day')!.value)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { year, month, day, dateStr }
}

async function getSession(): Promise<string> {
  const res = await fetch(VBS_VENUE_URL, {
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })
  const cookie = res.headers.get('set-cookie') ?? ''
  const m = cookie.match(/PHPSESSID=([^;]+)/)
  return m ? m[1] : ''
}

async function loadSched(vsn: number, sessionId: string, dateInfo: ReturnType<typeof todayTaipei>) {
  const form = new FormData()
  form.append('FUNC', 'LoadSched')
  form.append('SY', String(dateInfo.year))
  form.append('SM', String(dateInfo.month))
  form.append('RSD', dateInfo.dateStr)
  form.append('RED', dateInfo.dateStr)
  form.append('VenueSN', String(vsn))
  form.append('OrderNo', '')
  form.append('ZRMode', 'N')
  form.append('ZRTTimes', '1')
  form.append('AddOrderMode', 'N')

  const res = await fetch(LOAD_SCHED_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Referer': VBS_VENUE_URL,
      'Cookie': `PHPSESSID=${sessionId}`,
    },
    body: form,
  })

  const text = await res.text()
  if (!text || text === 'RETURN_FALSE') return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default async function handler(_req: Request, _ctx: Context) {
  const dateInfo = todayTaipei()

  try {
    const sessionId = await getSession()
    const results: Record<number, {
      status: string
      bookedCount: number
      availCount: number
      slots: { time: string; available: boolean }[]
    }> = {}

    await Promise.all(
      TENNIS_VSNS.map(async (vsn) => {
        const data = await loadSched(vsn, sessionId, dateInfo)
        if (!data) return

        const daySlots = data.RT?.[String(dateInfo.day)] ?? {}

        const slots = PLAY_HOURS.map((time) => {
          const key = time.replace(':', '')  // "0800"
          const slot = daySlots[key]
          if (!slot) return { time, available: false }
          // D=1 → booked, D=0 + IR=1 → available, IR=0 → closed
          const available = slot.D === '0' && slot.IR !== '0'
          return { time, available }
        })

        const bookedCount = slots.filter((s) => !s.available).length
        const availCount  = slots.filter((s) => s.available).length
        const total = bookedCount + availCount

        const status =
          total === 0        ? 'unknown' :
          bookedCount === 0  ? 'available' :
          availCount === 0   ? 'taken' :
                               'partial'

        results[vsn] = { status, bookedCount, availCount, slots }
      })
    )

    return new Response(
      JSON.stringify({ ok: true, date: dateInfo.dateStr, courts: results }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': 'https://taiwantennispro.netlify.app',
        },
      }
    )
  } catch (err) {
    console.error('availability API error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: '伺服器暫時無法取得場地資料，請稍後再試' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const config = { path: '/api/availability' }
