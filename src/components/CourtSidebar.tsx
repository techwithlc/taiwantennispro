import type { Court, CourtStatus } from '../types/court'
import { STATUS_LABEL, SOURCE_LABEL } from '../data/courts'

const STATUS_COLOR: Record<CourtStatus, string> = {
  available: '#16a34a',
  taken:     '#dc2626',
  partial:   '#d97706',
  unknown:   '#9ca3af',
}
const STATUS_BG: Record<CourtStatus, string> = {
  available: '#dcfce7',
  taken:     '#fee2e2',
  partial:   '#fef3c7',
  unknown:   '#f3f4f6',
}

interface Props {
  courts: Court[]
  selected: Court | null
  onSelect: (court: Court) => void
  filterDistrict: string
  onFilterChange: (d: string) => void
}

export default function CourtSidebar({ courts, selected, onSelect, filterDistrict, onFilterChange }: Props) {
  const districts = ['全部', ...Array.from(new Set(courts.map((c) => c.district)))]
  const allCourts = courts  // full list for district options
  void allCourts

  return (
    <aside className="flex flex-col h-full bg-white">

      {/* Header section inside sidebar */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🎾</span>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">台灣網球場地圖</h1>
            <p className="text-xs text-gray-400 mt-0.5">Taiwan Tennis Pro</p>
          </div>
        </div>

        {/* District filter */}
        <select
          className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
                     text-gray-700 cursor-pointer"
          value={filterDistrict}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {districts.map((d) => (
            <option key={d} value={d}>{d === '全部' ? '🗺 全部區域' : d}</option>
          ))}
        </select>

        <p className="text-xs text-gray-400 mt-2">{courts.length} 個球場</p>
      </div>

      {/* Court list */}
      <ul className="flex-1 overflow-y-auto">
        {courts.map((court) => {
          const isSelected = selected?.id === court.id
          return (
            <li
              key={court.id}
              onClick={() => onSelect(court)}
              className="cursor-pointer transition-colors"
              style={{
                background: isSelected ? '#f0fdf4' : undefined,
                borderLeft: isSelected ? '3px solid #16a34a' : '3px solid transparent',
              }}
            >
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 leading-tight"
                       style={{ fontSize: 12.5 }}>
                      {court.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {court.district} · {SOURCE_LABEL[court.source]}
                    </p>
                    {court.walkUpOnly && (
                      <p className="text-xs mt-1" style={{ color: '#d97706' }}>⚠ 現場排隊</p>
                    )}
                  </div>
                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                    style={{
                      background: STATUS_BG[court.status],
                      color: STATUS_COLOR[court.status],
                    }}
                  >
                    {STATUS_LABEL[court.status]}
                  </span>
                </div>

                {/* Slot dots — show when selected or has data */}
                {court.slots.length > 0 && (
                  <div className="flex gap-0.5 mt-2 flex-wrap">
                    {court.slots.filter(s => {
                      const h = parseInt(s.time)
                      return h >= 6 && h <= 21
                    }).map((slot) => (
                      <div
                        key={slot.time}
                        title={slot.time}
                        className="rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: slot.available ? '#16a34a' : '#dc2626',
                          opacity: slot.available ? 0.8 : 0.9,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="border-b border-gray-50 mx-4" />
            </li>
          )
        })}
      </ul>

      {/* Selected court detail panel */}
      {selected && (
        <div className="border-t border-gray-100 bg-gray-50">
          <div className="px-4 py-4">
            <div className="flex items-start justify-between mb-1">
              <p className="font-bold text-gray-900" style={{ fontSize: 13 }}>{selected.name}</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: STATUS_BG[selected.status], color: STATUS_COLOR[selected.status] }}
              >
                {STATUS_LABEL[selected.status]}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">{selected.address}</p>

            {/* Time slots grid */}
            {selected.slots.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1.5">今日時段</p>
                <div className="flex flex-wrap gap-1">
                  {selected.slots.filter(s => {
                    const h = parseInt(s.time)
                    return h >= 6 && h <= 22
                  }).map((slot) => (
                    <span
                      key={slot.time}
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{
                        background: slot.available ? '#dcfce7' : '#fee2e2',
                        color: slot.available ? '#166534' : '#991b1b',
                        textDecoration: slot.available ? 'none' : 'line-through',
                        opacity: slot.available ? 1 : 0.7,
                        fontSize: 10.5,
                      }}
                    >
                      {slot.time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <a
              href={selected.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-semibold
                         text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#16a34a' }}
            >
              前往預約 →
            </a>

            {selected.lastUpdated && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                資料更新 {new Date(selected.lastUpdated).toLocaleTimeString('zh-TW', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
