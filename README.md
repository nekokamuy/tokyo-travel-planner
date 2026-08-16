# Tokyo Travel Planner

2026 東京六天五夜的手機優先共享旅遊手冊。網站整合每日行程、景點地圖、票券、住宿、交通資訊、匯率換算、每日天氣與行前確認清單，並支援安裝為 PWA，讓主要內容在旅途中也能離線查閱。

## 主要功能

- 六天行程以日期卡片收合顯示，包含時段、景點、餐廳及 Google Maps 連結
- 日圓（JPY）與新台幣（TWD）雙向換算，保留最後成功取得的匯率
- 依每日代表地點顯示天氣、溫度與降雨機率
- 天氣資料離線備援；已過日期停止更新並保留最後紀錄
- 票券、住宿、東京地鐵與 JR 路線圖資訊
- 分類式行前確認清單，勾選狀態保存在使用者裝置
- 可安裝的 PWA 與 App Shell 離線快取
- 響應式版面，適合手機、平板與桌面瀏覽

## 本機預覽

請透過本機 HTTP 伺服器開啟專案：

```powershell
python -m http.server 8000
```

接著前往 `http://localhost:8000`。

不建議直接雙擊 `index.html`。使用 `file://` 開啟時，頁面基本內容雖然可能顯示，但 Service Worker、PWA 安裝、離線快取及外部 API 不一定能正常運作。

PWA 功能僅能在 `http://localhost` 或正式的 HTTPS 網站啟用。

## 安裝與離線使用

首次使用時必須在線開啟網站一次，讓 Service Worker 完成 App Shell 快取。

- Chrome／Edge：點選頁面上的「安裝離線版」，或使用瀏覽器網址列的安裝圖示
- iPhone／iPad：使用 Safari 的「分享 → 加入主畫面」
- 安裝完成後，可從裝置主畫面以獨立 App 視窗開啟

### 離線可用

- 行程、票券、住宿、交通與行前確認內容
- 網站樣式及主要互動
- 最後成功取得的匯率與每日天氣
- 行前確認清單的勾選紀錄

### 仍需要網路

- Google Maps 與 `maps.app.goo.gl` 外部連結
- Tokyo Metro／JR East 的外部 PDF
- 最新匯率與天氣資料
- 首頁使用的外部背景圖片不保證離線顯示

Google Maps 的離線能力由 Google Maps App 管理；需要時可事先在該 App 下載東京地區的離線地圖。

## 資料來源與快取行為

### 匯率

匯率由 ExchangeRate-API 取得，以 JPY 為基準換算 TWD。成功取得的資料存入 `localStorage`；斷網或 API 暫時失敗時，介面會使用最後一筆成功紀錄並標示資料狀態。

匯率僅供旅行預算參考，不代表銀行現鈔、信用卡或海外交易的實際成交價。

### 天氣

天氣由 Open-Meteo 取得。每張每日行程卡片透過下列屬性指定日期及代表地點：

```html
<details
  class="day-card"
  data-weather-date="2026-09-09"
  data-weather-location="東京・豐洲"
  data-weather-latitude="35.6550"
  data-weather-longitude="139.7967"
>
```

天氣預報只能在日期進入 API 可提供的預報範圍後顯示。未來日期會定期更新；已過日期保留最後成功紀錄，不再持續請求。

### 行前確認清單

每個核取項目以 `data-checklist-id` 作為保存識別：

```html
<input type="checkbox" data-checklist-id="passport" />
```

勾選狀態存放於瀏覽器 `localStorage`。已發布後不宜任意更改既有 ID，否則使用者原本的勾選紀錄將無法對應。

## 專案結構

```text
.
├── index.html                # 頁面結構、行程與旅遊內容
├── styles.css               # 視覺、響應式版面及元件樣式
├── script.js                # 導覽、行程互動與清單保存
├── exchange-rate.js         # 匯率取得、換算與本機快取
├── weather.js               # 天氣取得、日期規則與本機快取
├── pwa.js                   # PWA 安裝流程及網路狀態提示
├── service-worker.js        # App Shell 與同源靜態資源快取
├── manifest.webmanifest     # App 名稱、顏色、顯示方式與圖示
├── icon.svg                 # 網站及 PWA 圖示
└── .github/workflows/
    └── deploy-pages.yml     # GitHub Pages 自動部署
```

## 常見修改

### 修改行程、票券或住宿

主要內容集中在 `index.html`。修改日期、景點、餐廳、住宿或 Google Maps 連結後，請同步確認相關錨點連結仍能正確跳轉。

### 修改每日天氣地點

在對應的 `.day-card` 更新：

- `data-weather-date`
- `data-weather-location`
- `data-weather-latitude`
- `data-weather-longitude`

經緯度應以當天主要活動區域為代表，不需要為每個景點分別取得天氣。

### 修改 PWA 快取內容

必要離線檔案列在 `service-worker.js` 的 `APP_SHELL`。新增或移除必要的同源檔案時，請同步調整該陣列。

只要修改了會被快取的前端檔案，建議提高 `CACHE_NAME` 版本，例如：

```js
const CACHE_NAME = 'tokyo-travel-shell-v6';
```

新 Service Worker 啟用後會移除舊版 App Shell 快取。外部網站、Google Maps 或第三方 PDF 不應直接加入必要的 `APP_SHELL`，以免外部資源失敗造成 PWA 安裝失敗。

## 發布到 GitHub Pages

專案已包含 `.github/workflows/deploy-pages.yml`。

首次設定：

1. 前往 GitHub repository 的 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
3. 將修改推送至 `main` 分支。
4. 等待 GitHub Actions 完成部署。

預設發布網址：

```text
https://nekokamuy.github.io/tokyo-travel-planner/
```

若 repository 為 private，請確認目前 GitHub 方案支援 private repository 的 Pages，或將 repository 改為 public。

## 更新後的檢查建議

發布前建議確認：

- 手機與桌面版面沒有文字溢出
- 所有行程錨點及外部連結可以正常開啟
- 匯率與天氣在線時能成功更新，離線時能顯示最後紀錄
- 行前清單重新整理後仍保留勾選狀態
- DevTools 的 Application 面板能看到有效的 Manifest 與 Service Worker
- 首次在線載入後切換離線模式，重新開啟頁面仍能顯示主要內容
