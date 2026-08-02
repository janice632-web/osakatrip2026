# Janice's Osaka Solo Trip 2026

可直接部署到 GitHub Pages 的手機版大阪旅遊手冊。

## 最快部署方式

1. 登入 GitHub，建立新的公開 Repository，例如 `osaka2026`。
2. 將這個資料夾內的所有檔案上傳到 Repository 根目錄。
3. 進入 **Settings → Pages**。
4. 在 **Build and deployment** 選擇：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/(root)`
5. 儲存後，網址通常會是：
   `https://你的GitHub帳號.github.io/osaka2026/`

## iPhone 加入主畫面

用 Safari 開啟網站 → 分享 → **加入主畫面**。網站已包含 PWA 圖示與離線快取。

## 修改內容

直接編輯 `index.html` 後重新上傳或 Commit。行程勾選與備忘會儲存在個別手機瀏覽器的 localStorage，不會同步到其他裝置。
