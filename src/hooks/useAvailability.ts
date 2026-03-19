import { useState, useEffect, useCallback, useRef } from 'react'
import type { Court, CourtStatus, TimeSlot } from '../types/court'

interface ApiResponse {
  ok: boolean
  date: string
  courts: Record<number, {
    status: string
    slots: { time: string; available: boolean }[]
  }>
}

export function useAvailability(courts: Court[]) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const isInFlight = useRef(false)

  const fetch_ = useCallback(async () => {
    if (isInFlight.current) return
    isInFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/availability')
      if (!res.ok) throw new Error(`伺服器錯誤 ${res.status}`)
      const json: ApiResponse = await res.json()
      if (!json.ok) throw new Error('API 回傳失敗')
      setData(json)
      setLastFetch(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : '無法取得資料，請稍後再試')
    } finally {
      setLoading(false)
      isInFlight.current = false
    }
  }, [])

  useEffect(() => {
    fetch_()
    const timer = setInterval(fetch_, 5 * 60 * 1000)  // refresh every 5 min
    return () => clearInterval(timer)
  }, [fetch_])

  // Merge API data into court objects
  const enriched: Court[] = courts.map((court) => {
    if (!data || !court.vsn || !data.courts[court.vsn]) {
      return court
    }

    const api = data.courts[court.vsn]
    return {
      ...court,
      status: api.status as CourtStatus,
      slots: api.slots as TimeSlot[],
      lastUpdated: lastFetch?.toISOString() ?? court.lastUpdated,
    }
  })

  return { courts: enriched, loading, error, lastFetch, refresh: fetch_ }
}
