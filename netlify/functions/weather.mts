import type { Context } from '@netlify/functions'

// Districts we need weather for (matching court data)
const DISTRICTS = [
  // 台北市
  '中山區', '內湖區', '萬華區', '文山區', '中正區', '松山區',
  '大同區', '士林區', '大安區', '南港區', '信義區', '北投區',
  // 新北市
  '板橋區', '新莊區', '三重區', '中和區', '永和區', '新店區',
  '汐止區', '土城區', '蘆洲區', '林口區', '淡水區',
]

interface DistrictWeather {
  district: string
  wx: string
  temp: number
  pop: number
}

export default async function handler(_req: Request, _ctx: Context) {
  const apiKey = Netlify.env.get('PERPLEXITY_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const now = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    const districtList = DISTRICTS.join('、')

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a weather data API. Return ONLY valid JSON, no markdown, no explanation.',
          },
          {
            role: 'user',
            content: `現在是 ${now}。請查詢台北市和新北市以下行政區的目前天氣：${districtList}。

回傳嚴格 JSON 格式如下，不要加任何其他文字：
[{"district":"中山區","wx":"晴","temp":28,"pop":10},...]

wx = 天氣描述（晴/多雲/陰/雨 等）
temp = 目前氣溫（整數°C）
pop = 降雨機率（整數 0-100）

只回傳 JSON array，不要 markdown code block。`,
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) throw new Error(`Perplexity API ${res.status}`)
    const json = await res.json()

    const content: string = json.choices?.[0]?.message?.content ?? ''

    // Extract JSON array from response (handle markdown code blocks if any)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const parsed: DistrictWeather[] = JSON.parse(jsonMatch[0])

    // Validate and clean
    const districts: DistrictWeather[] = parsed
      .filter(d => d.district && typeof d.temp === 'number')
      .map(d => ({
        district: d.district,
        wx: d.wx || '—',
        temp: Math.round(d.temp),
        pop: Math.round(d.pop ?? 0),
      }))

    return new Response(
      JSON.stringify({ ok: true, districts }),
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
