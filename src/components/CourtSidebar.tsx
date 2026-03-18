import type { Court, CourtStatus } from '../types/court'
import { STATUS_LABEL, SOURCE_LABEL } from '../data/courts'

const STATUS_BG: Record<CourtStatus, string> = {
  available: 'bg-green-100 text-green-800',
  taken:     'bg-red-100 text-red-800',
  partial:   'bg-amber-100 text-amber-800',
  unknown:   'bg-gray-100 text-gray-600',
}

interface Props {
  courts: Court[]
  selected: Court | null
  onSelect: (court: Court) => void
  filterDistrict: string
  onFilterChange: (d: string) => void
}

export default function CourtSidebar({
  courts,
  selected,
  onSelect,
  filterDistrict,
  onFilterChange,
}: Props) {
  const districts = ['全部', ...Array.from(new Set(courts.map((c) => c.district)))]

  return (
    <aside className="flex flex-col h-full">
      {/* Filter */}
      <div className="p-3 border-b border-gray-200">
        <select
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={filterDistrict}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Court list */}
      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {courts.map((court) => (
          <li
            key={court.id}
            onClick={() => onSelect(court)}
            className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
              selected?.id === court.id ? 'bg-green-50 border-l-4 border-green-500' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{court.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {court.district} · {SOURCE_LABEL[court.source]}
                </p>
                {court.walkUpOnly && (
                  <p className="text-xs text-amber-600 mt-0.5">⚠️ 現場排隊</p>
                )}
              </div>
              <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BG[court.status]}`}>
                {STATUS_LABEL[court.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Selected court detail */}
      {selected && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <p className="font-semibold text-gray-900 text-sm">{selected.name}</p>
          <p className="text-xs text-gray-500 mt-1">{selected.address}</p>
          {selected.slots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.slots.map((slot) => (
                <span
                  key={slot.time}
                  className={`text-xs px-2 py-0.5 rounded ${
                    slot.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-400 line-through'
                  }`}
                >
                  {slot.time}
                </span>
              ))}
            </div>
          )}
          <a
            href={selected.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 transition-colors"
          >
            前往預約 →
          </a>
          <p className="text-xs text-gray-400 mt-2 text-center">
            更新：{new Date(selected.lastUpdated).toLocaleTimeString('zh-TW')}
          </p>
        </div>
      )}
    </aside>
  )
}
