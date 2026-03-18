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

## Roadmap

> 每週更新進度，打勾表示已完成。

- [ ] **全台覆蓋** — 擴展到新竹、台中、高雄等縣市球場，不只大台北
- [ ] **球友回報現場狀態** — 讓使用者回報「現在有人在打嗎？」，解決現場排隊制的資訊盲點
- [ ] **找球友配對** — 「我週六下午想打，有人要一起嗎？」讓球友之間產生連結
- [ ] **LINE / Telegram Bot 通知** — 訂閱關注場地，空位釋出時即時推播
- [ ] **場地評價與資訊** — 整合 Google Maps 評論、場地品質、燈光、地面狀況等資訊

## License

MIT

---

*powered by Lawrence Chen*
