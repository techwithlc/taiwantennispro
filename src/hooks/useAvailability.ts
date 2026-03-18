import { useState, useEffect, useCallback } from 'react'
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
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/availability')
      const json: ApiResponse = await res.json()
      setData(json)
      setLastFetch(new Date())
    } catch {
      // silently keep previous data
    } finally {
      setLoading(false)
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
      // Walk-up only courts: show as unknown
      if (court.walkUpOnly) return { ...court, status: 'unknown' as CourtStatus }
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

  return { courts: enriched, loading, lastFetch, refresh: fetch_ }
}
