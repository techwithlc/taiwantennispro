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
  const [sheetOpen, setSheetOpen] = useState(false)

  const { courts: liveCourts, loading, lastFetch, refresh } = useAvailability(COURTS)

  const filtered = useMemo(
    () => filterDistrict === '全部' ? liveCourts : liveCourts.filter((c) => c.district === filterDistrict),
    [filterDistrict, liveCourts]
  )

  const handleSelectCourt = (court: Court) => {
    setSelected(court)
    setSheetOpen(true)
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: 'white', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', gap: 10, zIndex: 20,
      }}>
        <span style={{ fontSize: 20 }}>🎾</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#166534', whiteSpace: 'nowrap' }}>
          台灣網球場地圖
        </span>

        <div className="legend-row" style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 8 }}>
          {([
            ['available', '有空位'],
            ['partial',   '部分開放'],
            ['taken',     '已約滿'],
          ] as [CourtStatus, string][]).map(([status, label]) => (
            <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 4,
                                        fontSize: 11, color: '#4b5563', fontWeight: 500 }}>
              <TennisBall color={STATUS_COLOR[status]} size={11} />
              {label}
            </span>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetch && (
            <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
              {lastFetch.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={refresh} disabled={loading} style={{
            padding: '4px 10px', borderRadius: 20, border: 'none',
            fontSize: 11, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            background: loading ? '#e5e7eb' : '#16a34a',
            color: loading ? '#9ca3af' : 'white',
          }}>
            {loading ? '…' : '↺'}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{
          width: 300, minWidth: 300, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          boxShadow: '2px 0 12px rgba(0,0,0,0.06)', zIndex: 10,
        }}>
          <CourtSidebar
            courts={filtered}
            selected={selected}
            onSelect={setSelected}
            filterDistrict={filterDistrict}
            onFilterChange={setFilterDistrict}
          />
        </div>

        {/* Map */}
        <div style={{ flex: 1, padding: 12, minWidth: 0, minHeight: 0 }}>
          <CourtMap courts={filtered} selected={selected} onSelect={handleSelectCourt} />
        </div>

        {/* ── Mobile only ── */}

        {/* FAB: 球場列表按鈕，浮在地圖右下角 */}
        <button
          className="mobile-fab"
          onClick={() => setSheetOpen(true)}
          style={{
            position: 'absolute', bottom: 20, right: 16,
            zIndex: 25, display: 'none',
            background: '#166534', color: 'white',
            border: 'none', borderRadius: 28,
            padding: '10px 18px',
            fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 16px rgba(22,101,52,0.45)',
            cursor: 'pointer',
          }}
        >
          🎾 {filtered.length} 個球場
        </button>

        {/* Backdrop */}
        {sheetOpen && (
          <div
            className="mobile-backdrop"
            onClick={() => setSheetOpen(false)}
            style={{
              position: 'absolute', inset: 0, zIndex: 28,
              background: 'rgba(0,0,0,0.35)',
              display: 'none',
            }}
          />
        )}

        {/* Bottom sheet — slides up fully, no peek */}
        <div
          className="mobile-sheet"
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 30,
            height: '78dvh',
            display: 'none',
            flexDirection: 'column',
          }}
        >
          {/* Sheet header */}
          <div style={{
            height: 52, flexShrink: 0,
            display: 'flex', alignItems: 'center',
            padding: '0 16px', borderBottom: '1px solid #f3f4f6',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#d1d5db' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
                球場列表
              </span>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 14,
                border: 'none', background: '#f3f4f6',
                fontSize: 14, cursor: 'pointer', color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Sheet body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CourtSidebar
              courts={filtered}
              selected={selected}
              onSelect={(c) => { setSelected(c); }}
              filterDistrict={filterDistrict}
              onFilterChange={setFilterDistrict}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
