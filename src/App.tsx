import { useState, useMemo } from 'react'
import CourtMap from './components/CourtMap'
import CourtSidebar from './components/CourtSidebar'
import { COURTS } from './data/courts'
import { useAvailability } from './hooks/useAvailability'
import { useWeather } from './hooks/useWeather'
import type { Court } from './types/court'
import './index.css'

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

  const { courts: liveCourts, loading, error, lastFetch, refresh } = useAvailability(COURTS)
  const { weather } = useWeather()

  const filtered = useMemo(
    () => filterDistrict === '全部' ? liveCourts : liveCourts.filter((c) => c.district === filterDistrict),
    [filterDistrict, liveCourts]
  )

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f7ed' }}>

      {/* ── Top bar — deep court green ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: 'linear-gradient(135deg, #2d6a4f 0%, #1a4731 100%)',
        borderBottom: '2px solid #c8e639',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10, zIndex: 20,
      }}>
        <TennisBall color="#c8e639" size={22} />
        <span style={{ fontSize: 14, fontWeight: 800, color: 'white', whiteSpace: 'nowrap', letterSpacing: 0.5,
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          台灣網球場地圖
        </span>

        <div className="legend-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8, flexWrap: 'wrap' }}>
          {([
            ['#16a34a', '可約有位'],
            ['#d97706', '部分開放'],
            ['#dc2626', '已約滿'],
            ['#0284c7', '今日開放'],
            ['#9ca3af', '無資料'],
          ] as [string, string][]).map(([color, label]) => (
            <span key={label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
              background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: 99,
            }}>
              <TennisBall color={color} size={10} />
              {label}
            </span>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetch && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
              {lastFetch.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={refresh} disabled={loading} style={{
            padding: '4px 12px', borderRadius: 20, border: 'none',
            fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.15)' : '#c8e639',
            color: loading ? 'rgba(255,255,255,0.5)' : '#1a4731',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.transform = 'scale(1.08)' }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
          >
            {loading ? '...' : '↻ 重整'}
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          background: '#fef2f2', borderBottom: '1px solid #fecaca',
          padding: '6px 14px', fontSize: 12, color: '#b91c1c',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{
          width: 320, minWidth: 320, flexShrink: 0,
          flexDirection: 'column',
          boxShadow: '2px 0 16px rgba(45,106,79,0.08)',
          position: 'relative', zIndex: 10,
        }}>
          <CourtSidebar
            courts={filtered}
            selected={selected}
            onSelect={setSelected}
            onDeselect={() => setSelected(null)}
            filterDistrict={filterDistrict}
            onFilterChange={setFilterDistrict}
            weather={weather}
          />
        </div>

        {/* Map */}
        <div className="map-wrapper" style={{ flex: 1, padding: 12, minWidth: 0, minHeight: 0, position: 'relative', zIndex: 0 }}>
          <CourtMap courts={filtered} selected={selected} onSelect={(c) => { setSelected(c); setSheetOpen(true) }} weather={weather} />
        </div>

        {/* FAB — mobile only */}
        <button
          className="mobile-fab"
          onClick={() => setSheetOpen(true)}
          style={{
            position: 'absolute', bottom: 20, right: 16, zIndex: 25,
            background: '#c8e639', color: '#1a4731',
            border: 'none', borderRadius: 28,
            padding: '10px 18px', fontSize: 13, fontWeight: 800,
            boxShadow: '0 4px 16px rgba(200,230,57,0.5)',
            cursor: 'pointer', alignItems: 'center', gap: 6,
            letterSpacing: 0.3,
          }}
        >
          🎾 {filtered.length} 個球場
        </button>

        {/* Backdrop — mobile only */}
        <div
          className={`mobile-backdrop${sheetOpen ? ' is-open' : ''}`}
          onClick={() => setSheetOpen(false)}
          style={{
            position: 'absolute', inset: 0, zIndex: 28,
            background: 'rgba(0,0,0,0.4)',
          }}
        />

        {/* Bottom sheet — mobile only */}
        <div
          className="mobile-sheet"
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'white',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
            transform: sheetOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            zIndex: 30, height: '78dvh',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Sheet header */}
          <div style={{
            height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
            padding: '0 16px', borderBottom: '1px solid #e8efe5',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#c8e639' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2d6a4f' }}>球場列表</span>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              style={{
                width: 28, height: 28, borderRadius: 14,
                border: 'none', background: '#f0f7ed',
                fontSize: 14, cursor: 'pointer', color: '#2d6a4f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <CourtSidebar
              courts={filtered}
              selected={selected}
              onSelect={setSelected}
              onDeselect={() => setSelected(null)}
              filterDistrict={filterDistrict}
              onFilterChange={setFilterDistrict}
              weather={weather}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
