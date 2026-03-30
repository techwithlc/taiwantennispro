# 台灣網球場地圖 🎾

大台北地區 47 座公共網球場的即時狀態地圖。爬取政府預約系統、疊加天氣資料，並區分「可預約」與「現場排隊」兩種場地 — 因為「有空位」在不同場地類型下，意義完全不同。

**Live:** [taiwantennispro.netlify.app](https://taiwantennispro.netlify.app)

## 為什麼做這個

台北有 47+ 座公共網球場，分散在河濱公園、運動中心、市區公園。預約資料放在一個 legacy PHP 系統（VBS）裡，不是設計來給人快速查詢的。河濱球場免費但只能現場排隊 — VBS 系統仍有追蹤這些場地，但「可用」只代表設施開放，不代表場地沒人。這個語義落差讓每個查了網站就跑去現場的球友都踩過坑。

這個專案解決的方式：
1. 爬取 VBS API，**誠實呈現**資料的真正含義
2. UI 上將**預約空位**（綠色）與**設施開放時段**（藍色）明確分開
3. 加入社群回報的佔用提示（教練佔場、長輩固定班底等已知問題）

## 系統架構

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   瀏覽器     │────▶│  Netlify CDN     │────▶│  靜態資源        │
│  React SPA   │     │  (edge cache)    │     │  (Vite build)   │
└──────┬───────┘     └──────────────────┘     └─────────────────┘
       │
       │ /api/availability (每 5 分鐘輪詢)
       │ /api/weather      (每 30 分鐘輪詢)
       ▼
┌──────────────────┐
│ Netlify Functions │
│  (serverless)     │
└──────┬──────┬─────┘
       │      │
       ▼      ▼
┌──────────┐ ┌──────────────┐
│ VBS API  │ │ CWA 開放資料  │
│ (台北市   │ │ API (中央     │
│  體育局)  │ │  氣象署)     │
└──────────┘ └──────────────┘
```

### 資料流：VBS 爬蟲

台北市體育局的 `vbs.sports.taipei` 是一個 PHP 應用，使用 session-based auth。取得場地時刻表的流程：

1. `GET /venues/?K=266` → 從 `Set-Cookie` 取得 `PHPSESSID`
2. `POST /_/x/xhrworkv3.php`，帶 `FUNC=LoadSched` + 場地序號 (VSN) → 當日 JSON 時刻表
3. 解析每個時段的 `slot.D`（預約旗標）和 `slot.IR`（開放旗標）

我們對 16 個 VSN 發出並行請求，每個設 8 秒 timeout。Serverless function 透過 `Cache-Control` 快取 5 分鐘。

**關鍵洞察：** 現場排隊球場（`walkUpOnly: true`）的 VBS「可用」旗標，意思是「這個時段設施有開放」— 不是「場地現在沒人」。這些球場無法線上預約，所以 `D` 永遠是 `0`。我們把這類狀態顯示為「今日開放」（藍色）而非「有空位」（綠色），避免誤導使用者。

### 顯示邏輯

場地分為兩種語義軌道，使用不同的狀態詞彙：

| | 有即時資料 | 無即時資料 |
|---|---|---|
| **可預約** | 🟢 可約有位 / 🟡 部分有位 / 🔴 已約滿 | 灰色：無即時資料 |
| **現場排隊** | 🔵 今日開放 / 🟡 部分時段 / 🔴 今日未開放 | 灰色：現場排隊（無即時資料） |

狀態計算只看設施有開放的時段 — 早上還沒開門的時段不會被算成「已預約」，避免狀態虛報為 partial 或 taken。

地圖標記同步對應：綠/紅 = 可預約球場，藍 = 現場排隊球場，灰 = 無即時資料。

### 天氣整合

天氣是輔助資訊 — 查詢失敗時靜默降級，不影響主功能（`useWeather` 吞掉 error）。透過中央氣象署 (CWA) Open Data API 取得台北市（`F-D0047-061`）與新北市（`F-D0047-069`）的鄉鎮天氣預報，涵蓋全部 23 個行政區。快取策略：server 端 30 分鐘，client 端 30 分鐘輪詢。

每個行政區取三個氣象要素：天氣現象（Wx）、溫度（T）、降雨機率（PoP6h），自動選取涵蓋「現在」的預報時段。

**CWA API 注意事項：** query parameter 接受英文代碼（`elementName=Wx,T,PoP6h`），但回傳的 `ElementName` 是中文（`天氣現象`、`溫度`、`3小時降雨機率`）；且所有 key 都是 PascalCase（`Locations`、`Location`、`WeatherElement`）。

### 安全性

- **URL 白名單：** 所有預約連結在渲染為 `<a>` 前，都會經過 `APPROVED_DOMAINS` 驗證，不接受任何使用者輸入的 URL
- **CORS：** API 回應鎖定 production origin
- **API key 不進 client：** VBS session 和 CWA API key 都只存在 serverless function 中，前端完全接觸不到
- **AbortSignal timeout：** 所有上游請求設定 8s/15s 硬超時，防止 function hang 住

## 技術選型

| 層級 | 選擇 | 為什麼 |
|------|------|--------|
| 前端 | React 19 + TypeScript | 球場資料模型需要型別安全；React 元件可在桌面 sidebar 和手機 bottom sheet 間複用 |
| 地圖 | Leaflet + react-leaflet | 輕量、不需 API key（對比 Google Maps），CartoDB Positron 底圖乾淨好看 |
| 樣式 | Tailwind CSS + inline styles | Tailwind 處理佈局，inline 處理動態狀態顏色（render 時計算） |
| 後端 | Netlify Functions | 零設定 serverless，與前端同一個 deploy，free tier 足夠應付流量 |
| 天氣 | 中央氣象署 CWA Open Data | 官方預報資料，免費、準確、無 LLM 幻覺風險 |
| 部署 | Netlify | Git push → 自動部署，Edge CDN，環境變數管理 secrets |

**Runtime 依賴只有 4 個**（react, react-dom, leaflet, react-leaflet）。刻意保持最小化。

## 球場資料（47 座）

| 類型 | 數量 | 資料來源 | 有即時資料？ |
|------|------|----------|-------------|
| 台北市河濱公園 | 14 座 | VBS API（16 個 VSN） | 有 — 設施開放時段 |
| 台北市可預約場地 | 2 座 | VBS API | 有 — 實際預約狀態 |
| 台北市運動中心 | 10 座 | 各運動中心官網 | 無 — 僅連結 |
| 台北市公園 | 5 座 | 現場排隊制 | 無 |
| 新北市運動中心 | 11 座 | 各運動中心官網 | 無 — 僅連結 |
| 新北市河濱 | 3 座 | 現場排隊制 | 無 |
| 臺北市網球中心 | 1 座 | tsc.taipei | 無 — 僅連結 |
| 私人球場 | 1 座 | taipeitenniscourt.com | 無 — 僅連結 |

## 已知限制

- **VBS 是爬蟲目標，不是穩定 API。** 台北市改 PHP endpoint 或 session 邏輯，爬蟲就會壞。沒有 SLA。
- **現場排隊球場的「實際佔用」無法遠端得知。** 我們提供設施時段 + 社群佔用提示，但沒辦法告訴你場地上現在有沒有人。真正的解法是 crowdsourcing（使用者回報），已在 roadmap 上。
- **天氣是預報非即時觀測。** CWA 鄉鎮預報每 6 小時更新，顯示的是最近預報時段的數值，不是即時氣象站數據。
- **運動中心資料是靜態的。** 我們連結到各中心的預約網站，但沒有爬取 — 每個中心用不同廠商系統（CYC、teamXports 等），為 21 個不同系統寫爬蟲的維護成本不值得。
- **目前只有雙北。** 擴展到其他縣市需要找到各自的預約系統（每個縣市各自為政）。

## 開發

```bash
npm install         # 4 個 runtime deps，約 15 個 dev deps
netlify dev         # 本地開發（含 serverless functions）
npm run build       # tsc + vite production build
```

### 環境變數（Netlify）

| 變數 | 必要 | 說明 |
|------|------|------|
| `CWA_API_KEY` | 是 | 中央氣象署開放資料 API key（[免費申請](https://opendata.cwa.gov.tw)），格式 `CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` |

## 專案結構

```
src/
  App.tsx                    # 主佈局：top bar + sidebar + map + mobile sheet
  components/
    CourtSidebar.tsx         # 球場列表、行政區篩選、詳情面板、天氣
    CourtMap.tsx             # Leaflet 地圖 + 狀態色標記（藍/綠/紅/灰）
    WeatherBadge.tsx         # 天氣顯示元件（氣溫、降雨機率、emoji）
  data/courts.ts             # 47 座球場靜態資料：座標、地址、VSN、佔用提示
  hooks/
    useAvailability.ts       # VBS 輪詢 hook（5 分鐘間隔，ref 防重複請求）
    useWeather.ts            # 天氣輪詢 hook（30 分鐘，失敗靜默降級）
  types/court.ts             # Court, CourtStatus, TimeSlot 型別定義
netlify/functions/
  availability.mts           # VBS session + 16 個 VSN 並行排程查詢
  weather.mts                # CWA 開放資料 API 天氣查詢（23 個行政區）
```

## Roadmap

- [x] 大台北 47 座球場，GPS 座標與預約連結皆已驗證
- [x] VBS 即時整合，誠實區分「可預約」與「現場排隊」
- [x] 各行政區天氣疊加
- [x] 社群佔用提示（11 座球場有已知問題）
- [ ] **使用者回報佔用狀態** — 「我在現場，4 面場地佔了 2 面」— 現場排隊球場的真正解法
- [ ] **推播通知** — 訂閱關注場地，空位釋出時即時通知
- [ ] **擴展到其他縣市** — 台中、高雄（需要逐縣市研究預約系統）
- [ ] **場地品質評價** — 地面材質、燈光、排水狀況評分

## License

MIT

---

*Built by Lawrence Chen*
