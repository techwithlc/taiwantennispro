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

function MiniTennisBall({ color, size = 10 }: { color: string; size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'inline-block', flexShrink: 0 }}>
      <circle cx={s/2} cy={s/2} r={s/2} fill={color}/>
      <path d={`M${s*.18},${s*.5} Q${s*.32},${s*.17} ${s*.5},${s*.13} Q${s*.68},${s*.09} ${s*.82},${s*.5}`}
        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={s*.07} strokeLinecap="round"/>
      <path d={`M${s*.18},${s*.5} Q${s*.32},${s*.83} ${s*.5},${s*.87} Q${s*.68},${s*.91} ${s*.82},${s*.5}`}
        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={s*.07} strokeLinecap="round"/>
    </svg>
  )
}

function statusLabel(court: Court): string {
  if (court.walkUpOnly && court.status !== 'taken') return '現場排隊'
  return STATUS_LABEL[court.status]
}

function statusColor(court: Court): string {
  if (court.walkUpOnly && court.status !== 'taken') return '#6b7280'
  return STATUS_COLOR[court.status]
}

function statusBg(court: Court): string {
  if (court.walkUpOnly && court.status !== 'taken') return '#f1f5f9'
  return STATUS_BG[court.status]
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

  return (
    <aside className="flex flex-col h-full" style={{ background: '#fafdf7' }}>

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #e8efe5' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2d6a4f, #1a4731)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(45,106,79,0.25)',
          }}>
            <span style={{ fontSize: 18 }}>🎾</span>
          </div>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 800, color: '#1a4731', lineHeight: 1.2, letterSpacing: 0.3 }}>
              台灣網球場地圖
            </h1>
            <p style={{ fontSize: 11, color: '#6b9080', marginTop: 1 }}>powered by Lawrence Chen</p>
          </div>
        </div>

        {/* District filter */}
        <select
          style={{
            width: '100%', fontSize: 13, padding: '8px 12px',
            background: 'white', border: '1.5px solid #c8dfc2',
            borderRadius: 10, color: '#2d6a4f', fontWeight: 600,
            cursor: 'pointer', outline: 'none',
          }}
          value={filterDistrict}
          onChange={(e) => onFilterChange(e.target.value)}
          onFocus={(e) => { e.target.style.borderColor = '#c8e639'; e.target.style.boxShadow = '0 0 0 3px rgba(200,230,57,0.25)' }}
          onBlur={(e) => { e.target.style.borderColor = '#c8dfc2'; e.target.style.boxShadow = 'none' }}
        >
          {districts.map((d) => (
            <option key={d} value={d}>{d === '全部' ? '🗺 全部區域' : d}</option>
          ))}
        </select>

        <p style={{ fontSize: 11, color: '#6b9080', marginTop: 8, fontWeight: 500 }}>
          🎾 {courts.length} 個球場
        </p>
      </div>

      {/* Court list */}
      <ul className="flex-1 overflow-y-auto court-scroll" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {courts.map((court) => {
          const isSelected = selected?.id === court.id
          return (
            <li
              key={court.id}
              onClick={() => onSelect(court)}
              style={{
                cursor: 'pointer',
                background: isSelected ? '#e8f5e0' : undefined,
                borderLeft: isSelected ? '3px solid #2d6a4f' : '3px solid transparent',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f0f7ed' }}
              onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '' }}
            >
              <div style={{ padding: '12px 14px' }}>
                <div className="flex items-start justify-between gap-2">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1a4731', lineHeight: 1.3 }}>
                      {court.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#6b9080', marginTop: 2 }}>
                      {court.district} · {SOURCE_LABEL[court.source]}
                    </p>
                    {court.walkUpOnly && (
                      <p style={{ fontSize: 11, marginTop: 3, color: '#64748b', fontWeight: 500 }}>
                        🚶 現場排隊制
                      </p>
                    )}
                  </div>
                  <span style={{
                    flexShrink: 0, fontSize: 11, padding: '2px 10px',
                    borderRadius: 99, fontWeight: 700, whiteSpace: 'nowrap',
                    background: statusBg(court), color: statusColor(court),
                  }}>
                    {statusLabel(court)}
                  </span>
                </div>

                {/* Slot tennis balls — mini balls instead of plain dots */}
                {court.slots.length > 0 && (
                  <div className="flex gap-0.5 mt-2 flex-wrap">
                    {court.slots.filter(s => {
                      const h = parseInt(s.time)
                      return h >= 6 && h <= 22
                    }).map((slot) => (
                      <div key={slot.time} title={`${slot.time} ${slot.available ? '可用' : '已約'}`}>
                        <MiniTennisBall
                          color={slot.available ? '#16a34a' : '#dc2626'}
                          size={9}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ height: 1, background: '#e8efe5', margin: '0 14px' }} />
            </li>
          )
        })}
      </ul>

      {/* Selected court detail panel */}
      {selected && (
        <div style={{
          borderTop: '3px solid #c8e639',
          background: '#f0f7ed',
        }}>
          <div style={{ padding: '14px 16px' }}>
            <div className="flex items-start justify-between mb-1">
              <p style={{ fontWeight: 800, color: '#1a4731', fontSize: 14 }}>{selected.name}</p>
              <span style={{
                fontSize: 11, padding: '2px 10px', borderRadius: 99, fontWeight: 700,
                background: statusBg(selected), color: statusColor(selected),
              }}>
                {statusLabel(selected)}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#6b9080', marginBottom: 10 }}>{selected.address}</p>

            {/* Time slots grid */}
            {selected.slots.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#2d6a4f', marginBottom: 6 }}>今日時段</p>
                <div className="flex flex-wrap gap-1">
                  {selected.slots.filter(s => {
                    const h = parseInt(s.time)
                    return h >= 6 && h <= 22
                  }).map((slot) => (
                    <span
                      key={slot.time}
                      style={{
                        fontSize: 11, padding: '3px 7px', borderRadius: 8,
                        fontFamily: 'monospace', fontWeight: 600,
                        background: slot.available ? '#c8e639' : '#fee2e2',
                        color: slot.available ? '#1a4731' : '#991b1b',
                        textDecoration: slot.available ? 'none' : 'line-through',
                        opacity: slot.available ? 1 : 0.6,
                      }}
                    >
                      {slot.time}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Walk-up notice or booking button */}
            {selected.walkUpOnly ? (
              <>
                <a
                  href={selected.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-sm font-semibold
                             transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#64748b', color: 'white' }}
                >
                  查看場地資訊 →
                </a>
                <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                  🚶 此場地為現場排隊制，無法線上預約
                </p>
              </>
            ) : (
              <a
                href={selected.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-bold
                           transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #2d6a4f, #1a4731)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(45,106,79,0.3)',
                }}
              >
                🎾 前往預約 →
              </a>
            )}

            {selected.lastUpdated && (
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
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
