# Tokyo Travel Planner

手機優先的東京旅遊共享網頁，可透過 GitHub Pages 免費發布。

## 本機預覽

直接用瀏覽器開啟 `index.html` 即可；若要以本機伺服器預覽，可在專案目錄執行：

```powershell
python -m http.server 8000
```

接著開啟 `http://localhost:8000`。

## 發布到 GitHub Pages

本專案已包含 `.github/workflows/deploy-pages.yml`。首次設定時，前往 GitHub repository 的 **Settings → Pages**，在 **Build and deployment → Source** 選擇 **GitHub Actions** 並儲存。之後每次推送到 `main` 分支，就會自動發布網站。

發布完成後，網站預設網址為：

`https://nekokamuy.github.io/tokyo-travel-planner/`

> 若 repository 是 private，請確認你的 GitHub 方案支援 private repository 的 Pages，或將 repository 改為 public。

## 修改行程

行程內容集中在 `index.html`。修改日期、景點、餐廳與 Google Maps 連結後，推送至 `main` 即會更新公開網站。
