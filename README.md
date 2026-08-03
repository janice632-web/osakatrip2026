# Travel Companion V2 Core

## 啟用順序
1. 在 Supabase SQL Editor 執行 `SUPABASE_PRIVATE_LINK_SETUP.sql`。
2. 確認 `travel-images` Bucket 為 Public，且已有 anon INSERT/UPDATE/DELETE Policy。
3. 將本專案全部檔案上傳至 GitHub Repository 根目錄並覆蓋舊檔。
4. 開啟網站，按「建立私人旅程」。
5. 立即到「更多」複製並保存：
   - 私人編輯網址
   - 唯讀分享網址

## 核心功能
- 不登入的私人編輯網址
- 唯讀分享網址
- Supabase Realtime 同步
- Storage 圖片同步
- 行程管理
- 必買清單（圖片、金額、對象）
- 花費記帳
- JSON 備份
