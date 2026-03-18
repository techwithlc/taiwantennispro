import { useState, useMemo } from 'react'
import CourtMap from './components/CourtMap'
import CourtSidebar from './components/CourtSidebar'
import { COURTS } from './data/courts'
import { useAvailability } from './hooks/useAvailability'
import type { Court, CourtStatus } from './types/court'
import './index.css'

const STATUS_COLOR: Record<CourtStatus, string> = {
  available: '#16a34a',
  taken:     '#dc2626',
  partial:   '#d97706',
  unknown:   '#9ca3af',
}

function TennisBall({ color, size = 12 }: { color: string; size?: number }) {
  const s = size
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'inline-block', flexShrink: 0 }}>
      <circle cx={s/2} cy={s/2} r={s/2} fill={color}/>
      <path d={`M${s*.18},${s*.5} Q${s*.32},${s*.17} ${s*.5},${s*.13} Q${s*.68},${s*.09} ${s*.82},${s*.5}`}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={s*.065} strokeLinecap="round"/>
      <path d={`M${s*.18},${s*.5} Q${s*.32},${s*.83} ${s*.5},${s*.87} Q${s*.68},${s*.91} ${s*.82},${s*.5}`}
        fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={s*.065} strokeLinecap="round"/>
    </svg>
  )
}

export default function App() {
  const [selected, setSelected] = useState<Court | null>(null)
  const [filterDistrict, setFilterDistrict] = useState('全部')

  const { courts: liveCourts, loading, lastFetch, refresh } = useAvailability(COURTS)

  const filtered = useMemo(
    () => filterDistrict === '全部' ? liveCourts : liveCourts.filter((c) => c.district === filterDistrict),
    [filterDistrict, liveCourts]
  )

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#f8fafc' }}>

      {/* Left sidebar — fixed width */}
      <div style={{ width: 300, minWidth: 300, display: 'flex', flexDirection: 'column',
                    boxShadow: '2px 0 12px rgba(0,0,0,0.06)', zIndex: 10 }}>
        <CourtSidebar
          courts={filtered}
          selected={selected}
          onSelect={setSelected}
          filterDistrict={filterDistrict}
          onFilterChange={setFilterDistrict}
        />
      </div>

      {/* Right: map + top bar */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div style={{
          height: 52,
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 16,
          zIndex: 5,
        }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {([
              ['available', '有空位'],
              ['partial',   '部分開放'],
              ['taken',     '已約滿'],
              ['unknown',   '查詢中'],
            ] as [CourtStatus, string][]).map(([status, label]) => (
              <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 5,
                                          fontSize: 12, color: '#4b5563', fontWeight: 500 }}>
                <TennisBall color={STATUS_COLOR[status]} size={13} />
                {label}
              </span>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {lastFetch && (
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                更新 {lastFetch.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: 'none',
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer',
                background: loading ? '#e5e7eb' : '#16a34a',
                color: loading ? '#9ca3af' : 'white',
                transition: 'all 0.15s',
              }}
            >
              {loading ? '更新中…' : '↺ 更新'}
            </button>
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, padding: 12, minHeight: 0 }}>
          <CourtMap courts={filtered} selected={selected} onSelect={setSelected} />
        </div>
      </div>
    </div>
  )
}
