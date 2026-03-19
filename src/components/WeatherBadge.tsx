import type { DistrictWeather } from '../hooks/useWeather'

function wxEmoji(wx: string, pop: number): string {
  if (pop >= 60 || /雨/.test(wx)) return '🌧'
  if (/陰/.test(wx)) return '☁️'
  if (/雲/.test(wx)) return '⛅'
  return '☀️'
}

interface Props {
  weather: DistrictWeather | undefined
  compact?: boolean
}

export default function WeatherBadge({ weather, compact }: Props) {
  if (!weather) return null

  const emoji = wxEmoji(weather.wx, weather.pop)
  const isRainy = weather.pop >= 60
  const popColor = isRainy ? '#dc2626' : '#6b9080'
  const popBg = isRainy ? '#fef2f2' : undefined

  if (compact) {
    return (
      <span style={{
        fontSize: 11, color: popColor, fontWeight: 600,
        background: popBg, padding: isRainy ? '1px 6px' : undefined,
        borderRadius: 6,
      }}>
        {emoji} {weather.temp}° · 降雨 {weather.pop}%
      </span>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: popColor, fontWeight: 600,
      background: isRainy ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isRainy ? '#fecaca' : '#bbf7d0'}`,
      borderRadius: 10, padding: '6px 10px',
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span>{weather.temp}°</span>
      <span style={{ color: '#94a3b8' }}>·</span>
      <span>降雨 {weather.pop}%</span>
      {isRainy && <span style={{ fontSize: 10, color: '#b91c1c' }}>⚠ 留意天氣</span>}
    </div>
  )
}
