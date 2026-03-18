import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Court, CourtStatus } from '../types/court'
import { STATUS_LABEL, SOURCE_LABEL } from '../data/courts'

const STATUS_COLOR: Record<CourtStatus, string> = {
  available: '#22c55e',
  taken:     '#ef4444',
  partial:   '#f59e0b',
  unknown:   '#6b7280',
}

interface Props {
  courts: Court[]
  onSelect: (court: Court) => void
  selected: Court | null
}

export default function CourtMap({ courts, onSelect, selected }: Props) {
  return (
    <MapContainer
      center={[25.0478, 121.5319]}  // Taipei city center
      zoom={12}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {courts.map((court) => (
        <CircleMarker
          key={court.id}
          center={[court.lat, court.lng]}
          radius={selected?.id === court.id ? 14 : 10}
          pathOptions={{
            color: STATUS_COLOR[court.status],
            fillColor: STATUS_COLOR[court.status],
            fillOpacity: 0.85,
            weight: selected?.id === court.id ? 3 : 1.5,
          }}
          eventHandlers={{ click: () => onSelect(court) }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{court.name}</p>
              <p className="text-gray-500">{court.district} · {SOURCE_LABEL[court.source]}</p>
              <p>{STATUS_LABEL[court.status]}</p>
              {court.walkUpOnly && (
                <p className="text-amber-600 text-xs mt-1">⚠️ 現場排隊（無線上預約）</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
