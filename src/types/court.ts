export type CourtStatus = 'available' | 'taken' | 'partial' | 'unknown'

export interface TimeSlot {
  time: string       // e.g. "08:00"
  available: boolean
}

export interface Court {
  id: string
  vsn: number | null   // vbs.sports.taipei venue serial number
  name: string
  nameEn: string
  district: string
  lat: number
  lng: number
  source: 'vbs' | 'sporetrofit' | 'tsc' | 'private'
  status: CourtStatus
  slots: TimeSlot[]
  bookingUrl: string
  address: string
  walkUpOnly: boolean
  lastUpdated: string  // ISO timestamp
}
