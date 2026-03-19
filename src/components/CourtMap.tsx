import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Court, CourtStatus } from '../types/court'
import { SOURCE_LABEL } from '../data/courts'
import type { DistrictWeather } from '../hooks/useWeather'

// Booking-based marker colors
const BOOK_COLOR: Record<CourtStatus, string> = {
  available: '#16a34a',
  taken:     '#dc2626',
  partial:   '#d97706',
  unknown:   '#9ca3af',
}
const BOOK_GLOW: Record<CourtStatus, string> = {
  available: 'rgba(22,163,74,0.35)',
  taken:     'rgba(220,38,38,0.35)',
  partial:   'rgba(217,119,6,0.35)',
  unknown:   'rgba(156,163,175,0.2)',
}
// Walk-up facility-open marker colors (blue = open)
const OPEN_COLOR: Record<CourtStatus, string> = {
  available: '#0284c7',
  partial:   '#d97706',
  taken:     '#dc2626',
  unknown:   '#9ca3af',
}
const OPEN_GLOW: Record<CourtStatus, string> = {
  available: 'rgba(2,132,199,0.35)',
  partial:   'rgba(217,119,6,0.35)',
  taken:     'rgba(220,38,38,0.35)',
  unknown:   'rgba(156,163,175,0.2)',
}

function tennisBallHtml(color: string, glow: string, size: number, selected: boolean): string {
  const s = size
  const shadow = selected ? `drop-shadow(0 0 ${s * 0.3}px ${glow})` : 'none'
  const ring = selected
    ? `<circle cx="${s/2}" cy="${s/2}" r="${s/2-2}" fill="none" stroke="white" stroke-width="2.5" opacity="0.9"/>`
    : ''
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"
         style="filter:${shadow};overflow:visible;display:block">
      <circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="${color}"/>
      <radialGradient id="g${s}" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.1"/>
      </radialGradient>
      <circle cx="${s/2}" cy="${s/2}" r="${s/2}" fill="url(#g${s})"/>
      <path d="M${s*.18},${s*.5} Q${s*.32},${s*.17} ${s*.5},${s*.13} Q${s*.68},${s*.09} ${s*.82},${s*.5}"
        fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="${s*.065}" stroke-linecap="round"/>
      <path d="M${s*.18},${s*.5} Q${s*.32},${s*.83} ${s*.5},${s*.87} Q${s*.68},${s*.91} ${s*.82},${s*.5}"
        fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="${s*.065}" stroke-linecap="round"/>
      ${ring}
    </svg>`
}

function makeIcon(court: Court, selected: boolean): L.DivIcon {
  const colors = court.walkUpOnly ? OPEN_COLOR : BOOK_COLOR
  const glows = court.walkUpOnly ? OPEN_GLOW : BOOK_GLOW
  const size = selected ? 42 : 28
  const html = tennisBallHtml(colors[court.status], glows[court.status], size, selected)
  return L.divIcon({
    html,
    className: selected ? 'marker-selected' : '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  })
}

function popupStatusLabel(court: Court): string {
  const hasData = court.vsn && court.status !== 'unknown'
  if (!hasData) return court.walkUpOnly ? '現場排隊' : '可預約'
  if (court.walkUpOnly) {
    if (court.status === 'available') return '今日開放'
    if (court.status === 'partial') return '部分時段'
    return '今日未開放'
  }
  if (court.status === 'available') return '可約有位'
  if (court.status === 'partial') return '部分有位'
  return '已約滿'
}

function popupStatusColor(court: Court): string {
  const hasData = court.vsn && court.status !== 'unknown'
  if (!hasData) return '#94a3b8'
  return court.walkUpOnly ? OPEN_COLOR[court.status] : BOOK_COLOR[court.status]
}

function wxEmoji(wx: string, pop: number): string {
  if (pop >= 60 || /雨/.test(wx)) return '🌧'
  if (/陰/.test(wx)) return '☁️'
  if (/雲/.test(wx)) return '⛅'
  return '☀️'
}

interface Props {
  courts: Court[]
  onSelect: (court: Court) => void
  selected: Court | null
  weather?: Record<string, DistrictWeather>
}

export default function CourtMap({ courts, onSelect, selected, weather }: Props) {
  return (
    <MapContainer
      center={[25.02, 121.50]}
      zoom={11}
      className="h-full w-full"
      style={{ borderRadius: '16px' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {courts.map((court) => (
        <Marker
          key={court.id}
          position={[court.lat, court.lng]}
          icon={makeIcon(court, selected?.id === court.id)}
          eventHandlers={{ click: () => onSelect(court) }}
          zIndexOffset={selected?.id === court.id ? 1000 : 0}
        >
          <Popup closeButton={false} className="tennis-popup">
            <div style={{ minWidth: 190, padding: '2px 0' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#1a4731', marginBottom: 4 }}>
                🎾 {court.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b9080', marginBottom: 8 }}>
                {court.district} · {SOURCE_LABEL[court.source]}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 12px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: popupStatusColor(court) + '18',
                color: popupStatusColor(court),
                border: `1.5px solid ${popupStatusColor(court)}33`,
              }}>
                {popupStatusLabel(court)}
              </div>
              {court.walkUpOnly && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  🚶 現場排隊制
                </div>
              )}
              {!court.vsn && (
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                  📡 未接入即時系統
                </div>
              )}
              {weather?.[court.district] && (() => {
                const w = weather[court.district]
                return (
                  <div style={{ fontSize: 11, color: '#6b9080', marginTop: 6 }}>
                    {wxEmoji(w.wx, w.pop)} {w.temp}° · 降雨 {w.pop}%
                  </div>
                )
              })()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
