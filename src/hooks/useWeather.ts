import { useState, useEffect, useCallback, useRef } from 'react'

export interface DistrictWeather {
  district: string
  wx: string
  temp: number
  pop: number
}

export function useWeather() {
  const [data, setData] = useState<Record<string, DistrictWeather>>({})
  const [loading, setLoading] = useState(true)
  const isInFlight = useRef(false)

  const fetch_ = useCallback(async () => {
    if (isInFlight.current) return
    isInFlight.current = true
    setLoading(true)
    try {
      const res = await fetch('/api/weather')
      if (!res.ok) throw new Error(`weather ${res.status}`)
      const json = await res.json()
      if (!json.ok) throw new Error('weather API failed')
      const map: Record<string, DistrictWeather> = {}
      for (const d of json.districts as DistrictWeather[]) {
        map[d.district] = d
      }
      setData(map)
    } catch {
      // silently fail — weather is supplementary info
    } finally {
      setLoading(false)
      isInFlight.current = false
    }
  }, [])

  useEffect(() => {
    fetch_()
    const timer = setInterval(fetch_, 30 * 60 * 1000) // 30 min refresh
    return () => clearInterval(timer)
  }, [fetch_])

  return { weather: data, loading }
}
