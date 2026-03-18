import { useState, useMemo } from 'react'
import CourtMap from './components/CourtMap'
import CourtSidebar from './components/CourtSidebar'
import { COURTS } from './data/courts'
import { useAvailability } from './hooks/useAvailability'
import type { Court } from './types/court'
import './index.css'

export default function App() {
  const [selected, setSelected] = useState<Court | null>(null)
  const [filterDistrict, setFilterDistrict] = useState('全部')

  const { courts: liveCourts, loading, lastFetch, refresh } = useAvailability(COURTS)

  const filtered = useMemo(
    () => filterDistrict === '全部' ? liveCourts : liveCourts.filter((c) => c.district === filterDistrict),
    [filterDistrict, liveCourts]
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <span className="text-2xl">🎾</span>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-none">台灣網球場地圖</h1>
          <p className="text-xs text-gray-500 mt-0.5">Taiwan Tennis Pro · 即時空位查詢</p>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
          <Legend color="bg-green-500" label="有空位" />
          <Legend color="bg-amber-500" label="部分開放" />
          <Legend color="bg-red-500" label="已約滿" />
          <Legend color="bg-gray-400" label="查詢中" />
          <button
            onClick={refresh}
            className="ml-2 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            title="手動更新"
          >
            {loading ? '⟳' : '↺'}
          </button>
          {lastFetch && (
            <span className="text-gray-400">
              更新 {lastFetch.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-72 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-0">
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
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}
    </span>
  )
}
