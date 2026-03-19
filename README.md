# 台灣網球場地圖 🎾

即時查看大台北地區 47 座公共網球場的場地狀態與天氣資訊，一眼看出哪裡有空位、哪裡今天開放。

**Live:** [taiwantennispro.netlify.app](https://taiwantennispro.netlify.app)

## Features

- **即時場地狀態** — 透過台北市體育局 VBS API 查詢各球場今日時段
- **預約制 vs 現場排隊制** — 兩套顯示邏輯，不再混淆
  - 🟢 可預約球場：可約有位 / 部分有位 / 已約滿
  - 🔵 現場排隊球場：今日開放 / 部分時段 / 今日未開放
- **即時天氣** — 各行政區天氣、氣溫、降雨機率，下雨天不白跑
- **佔用提示** — 社群回報的場地佔用情況（教練佔場、長輩佔用等）
- **互動地圖** — Leaflet + CartoDB 底圖，藍球 = 現場排隊、綠球 = 可預約
- **時段一覽** — 每個球場顯示 06:00–22:00 各時段狀態
- **一鍵預約** — 直接連結到各場地的官方預約頁面
- **行政區篩選** — 台北市 / 新北市分組下拉選單
- **響應式設計** — 桌面版側邊欄 + 手機版底部滑出面板

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Map | Leaflet + react-leaflet, CartoDB Positron tiles |
| Backend | Netlify Functions (serverless) |
| Data | 台北市體育局 VBS API |
| Weather | Perplexity AI API (sonar model) |
| Deploy | Netlify |

## 球場資料來源（47 座）

| 類型 | 數量 | 來源 |
|------|------|------|
| 台北市河濱公園 | 14 座 | vbs.sports.taipei（即時開放時段） |
| 台北市可預約場地 | 2 座 | vbs.sports.taipei（即時預約狀態） |
| 台北市運動中心 | 10 座 | 各運動中心官網 |
| 台北市公園 | 5 座 | 現場排隊制 |
| 新北市運動中心 | 11 座 | 各運動中心官網 |
| 新北市河濱 | 3 座 | 現場排隊制 |
| 臺北市網球中心 | 1 座 | tsc.taipei |
| 私人球場 | 1 座 | taipeitenniscourt.com |

## 狀態顯示邏輯

場地分為 **可預約** 和 **現場排隊** 兩種，顯示語義不同：

| | 有即時資料 | 無即時資料 |
|---|---|---|
| **可預約** | 🟢 可約有位 / 🟡 部分有位 / 🔴 已約滿 | 灰 可預約 |
| **現場排隊** | 🔵 今日開放 / 🟡 部分時段 / 🔴 今日未開放 | 灰 現場排隊 |

> 現場排隊球場的「今日開放」代表場地設施開放，不代表沒有人在使用。
> 河濱球場遇大雨或維修會顯示「今日未開放」，避免白跑一趟。

## Development

```bash
# Install
npm install

# Dev server (with Netlify Functions)
netlify dev

# Build
npm run build
```

### 環境變數（Netlify）

| Variable | Description |
|----------|-------------|
| `PERPLEXITY_API_KEY` | Perplexity AI API key（天氣查詢用） |

## Project Structure

```
src/
  App.tsx                    # 主頁面：top bar + sidebar + map + mobile sheet
  components/
    CourtSidebar.tsx         # 球場列表 + 篩選 + 選取詳情 + 天氣
    CourtMap.tsx             # Leaflet 地圖 + 網球標記（藍/綠/紅/灰）
    WeatherBadge.tsx         # 天氣顯示元件
  data/courts.ts             # 47 座球場靜態資料（座標、地址、VSN、crowdNote）
  hooks/
    useAvailability.ts       # VBS 即時場地查詢 hook（5 分鐘刷新）
    useWeather.ts            # 天氣查詢 hook（30 分鐘刷新）
  types/court.ts             # TypeScript 型別定義
netlify/functions/
  availability.mts           # Serverless proxy → VBS API（16 個 VSN）
  weather.mts                # Perplexity AI → 各區即時天氣
```

## Roadmap

- [x] **大台北 47 座球場** — 台北市 + 新北市完整覆蓋
- [x] **即時天氣整合** — 各行政區天氣、氣溫、降雨機率
- [x] **佔用提示** — 社群回報的場地佔用情況
- [x] **預約制/排隊制分流顯示** — 不再誤顯河濱「有空位」
- [ ] **全台覆蓋** — 擴展到新竹、台中、高雄等縣市球場
- [ ] **球友回報現場狀態** — 讓使用者回報「現在有人在打嗎？」
- [ ] **找球友配對** — 「我週六下午想打，有人要一起嗎？」
- [ ] **LINE / Telegram Bot 通知** — 訂閱關注場地，空位釋出時即時推播
- [ ] **場地評價與資訊** — 場地品質、燈光、地面狀況等

## License

MIT

---

*powered by Lawrence Chen*
