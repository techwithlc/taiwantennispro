import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Court, CourtStatus } from '../types/court'
import { STATUS_LABEL, SOURCE_LABEL } from '../data/courts'

// Tennis ball SVG with status color — the seam curves are the signature look
function tennisBallSvg(color: string, size: number, ring: boolean): string {
  // Seam lines in white, slightly transparent
  const seam = `
    <path d="M${size * 0.2},${size * 0.5} Q${size * 0.35},${size * 0.2} ${size * 0.5},${size * 0.15} Q${size * 0.65},${size * 0.1} ${size * 0.8},${size * 0.5}"
      fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="${size * 0.06}" stroke-linecap="round"/>
    <path d="M${size * 0.2},${size * 0.5} Q${size * 0.35},${size * 0.8} ${size * 0.5},${size * 0.85} Q${size * 0.65},${size * 0.9} ${size * 0.8},${size * 0.5}"
      fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="${size * 0.06}" stroke-linecap="round"/>
  `
  const ringEl = ring
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="none" stroke="white" stroke-width="2.5" opacity="0.9"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${color}"/>
    ${seam}
    ${ringEl}
  </svg>`
}

const STATUS_COLOR: Record<CourtStatus, string> = {
  available: '#16a34a',   // green-600
  taken:     '#dc2626',   // red-600
  partial:   '#d97706',   // amber-600
  unknown:   '#9ca3af',   // gray-400
}

function makeIcon(status: CourtStatus, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 40 : 30
  const svg = tennisBallSvg(STATUS_COLOR[status], size, isSelected)
  return L.divIcon({
    html: svg,
    className: '',   // clear Leaflet's default white box
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
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
      center={[25.0478, 121.5319]}
      zoom={12}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {courts.map((court) => (
        <Marker
          key={court.id}
          position={[court.lat, court.lng]}
          icon={makeIcon(court.status, selected?.id === court.id)}
          eventHandlers={{ click: () => onSelect(court) }}
        >
          <Popup>
            <div className="text-sm min-w-[160px]">
              <p className="font-semibold text-gray-900">🎾 {court.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">{court.district} · {SOURCE_LABEL[court.source]}</p>
              <p className="mt-1 font-medium" style={{ color: STATUS_COLOR[court.status] }}>
                {STATUS_LABEL[court.status]}
              </p>
              {court.walkUpOnly && (
                <p className="text-amber-600 text-xs mt-1">⚠️ 現場排隊</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
