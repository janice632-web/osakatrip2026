# Travel Companion V2 Core Login-Free Fix

修正：
- 移除外部 Supabase CDN 依賴
- 改用原生 fetch 呼叫 Supabase RPC
- 圖片直接上傳 Supabase Storage
- 跨裝置同步改為每 5 秒檢查，避免 Realtime SDK 載入失敗
- 載入失敗會顯示明確錯誤，不再卡住

部署後請用 `?v=corefix1` 開啟。
