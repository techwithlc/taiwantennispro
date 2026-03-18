import { useState, useMemo } from 'react'
import CourtMap from './components/CourtMap'
import CourtSidebar from './components/CourtSidebar'
import { COURTS } from './data/courts'
import { useAvailability } from './hooks/useAvailability'
import type { Court } from './types/court'
import './index.css'

// Mini tennis ball SVG for legend
function TennisBall({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="inline-block">
      <circle cx="7" cy="7" r="7" fill={color} />
      <path d="M2.5,7 Q4.5,3.5 7,3 Q9.5,2.5 11.5,7"
        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M2.5,7 Q4.5,10.5 7,11 Q9.5,11.5 11.5,7"
        fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round"/>
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
    <div className="h-screen flex flex-col bg-green-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-green-200 px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <span className="text-3xl">🎾</span>
        <div>
          <h1 className="text-lg font-extrabold text-green-800 leading-none tracking-tight">
            台灣網球場地圖
          </h1>
          <p className="text-xs text-green-600 mt-0.5 font-medium">Taiwan Tennis Pro · 即時空位查詢</p>
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs text-gray-600">
          <Legend color="#16a34a" label="有空位" />
          <Legend color="#d97706" label="部分開放" />
          <Legend color="#dc2626" label="已約滿" />
          <Legend color="#9ca3af" label="查詢中" />

          <button
            onClick={refresh}
            className={`ml-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${loading
                ? 'bg-green-50 text-green-400 border-green-200 cursor-wait'
                : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
              }`}
            disabled={loading}
          >
            {loading ? '更新中…' : '↺ 更新'}
          </button>

          {lastFetch && (
            <span className="text-gray-400 text-xs">
              {lastFetch.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-72 shrink-0 bg-white border-r-2 border-green-100 flex flex-col min-h-0 shadow-sm">
          <CourtSidebar
            courts={filtered}
            selected={selected}
            onSelect={setSelected}
            filterDistrict={filterDistrict}
            onFilterChange={setFilterDistrict}
          />
        </div>

        {/* Map */}
        <div className="flex-1 p-3">
          <CourtMap courts={filtered} selected={selected} onSelect={setSelected} />
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 font-medium">
      <TennisBall color={color} />
      {label}
    </span>
  )
}
