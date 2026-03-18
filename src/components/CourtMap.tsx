import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Court, CourtStatus } from '../types/court'
import { STATUS_LABEL, SOURCE_LABEL } from '../data/courts'

const STATUS_COLOR: Record<CourtStatus, string> = {
  available: '#16a34a',
  taken:     '#dc2626',
  partial:   '#d97706',
  unknown:   '#9ca3af',
}

const STATUS_GLOW: Record<CourtStatus, string> = {
  available: 'rgba(22,163,74,0.35)',
  taken:     'rgba(220,38,38,0.35)',
  partial:   'rgba(217,119,6,0.35)',
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

function makeIcon(status: CourtStatus, selected: boolean): L.DivIcon {
  const size = selected ? 42 : 28
  const html = tennisBallHtml(STATUS_COLOR[status], STATUS_GLOW[status], size, selected)
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  })
}

interface Props {
  courts: Court[]
  onSelect: (court: Court) => void
  selected: Court | null
}

export default function CourtMap({ courts, onSelect, selected }: Props) {
  return (
    <MapContainer
      center={[25.048, 121.532]}
      zoom={12}
      className="h-full w-full"
      style={{ borderRadius: '16px' }}
      zoomControl={false}
    >
      {/* CartoDB Positron — clean minimal tiles */}
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
          icon={makeIcon(court.status, selected?.id === court.id)}
          eventHandlers={{ click: () => onSelect(court) }}
          zIndexOffset={selected?.id === court.id ? 1000 : 0}
        >
          <Popup closeButton={false} className="tennis-popup">
            <div style={{ minWidth: 180, padding: '2px 0' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', marginBottom: 4 }}>
                🎾 {court.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                {court.district} · {SOURCE_LABEL[court.source]}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                background: STATUS_COLOR[court.status] + '22',
                color: STATUS_COLOR[court.status],
                border: `1px solid ${STATUS_COLOR[court.status]}44`,
              }}>
                {STATUS_LABEL[court.status]}
              </div>
              {court.walkUpOnly && (
                <div style={{ fontSize: 11, color: '#d97706', marginTop: 6 }}>
                  ⚠️ 現場排隊
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
