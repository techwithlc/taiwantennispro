# 台灣網球場地圖 🎾

即時查看大台北地區公共網球場的場地狀態，一眼看出哪裡有空位。

## Features

- **即時場地狀態** — 透過台北市體育局 VBS API 查詢各球場今日時段
- **互動地圖** — Leaflet + CartoDB 底圖，點擊網球標記查看詳情
- **時段一覽** — 每個球場顯示 06:00–22:00 各時段的可用狀態
- **一鍵預約** — 直接連結到各場地的預約頁面
- **響應式設計** — 桌面版側邊欄 + 手機版底部滑出面板

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Map | Leaflet + react-leaflet, CartoDB Positron tiles |
| Backend | Netlify Functions (serverless) |
| Data | 台北市體育局 VBS API、臺北市網球中心 |
| Deploy | Netlify |

## 球場資料來源

- **台北市體育局** (vbs.sports.taipei) — 河濱公園、中正網球場、天母運動場等 16 座
- **臺北市網球中心** — 內湖民權東路
- **私人球場** — 南港臺北網球場

## Development

```bash
# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

## Project Structure

```
src/
  App.tsx              # 主頁面：top bar + sidebar + map + mobile sheet
  components/
    CourtSidebar.tsx   # 球場列表 + 篩選 + 選取詳情
    CourtMap.tsx       # Leaflet 地圖 + 網球標記
  data/courts.ts       # 球場靜態資料（座標、地址、VSN）
  hooks/useAvailability.ts  # 即時場地查詢 hook
  types/court.ts       # TypeScript 型別定義
netlify/functions/
  availability.mts     # Serverless proxy → VBS API
```

## License

MIT

---

*powered by Lawrence Chen*
