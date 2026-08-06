# Osaka Travel Companion V4.0.0

穩定維護版。程式統一為 `assets/app.js` 與 `assets/app.css`。

## 資料保護
- 行程原始資料位於 `public/data/`，V4 重構未修改任何內容。
- 使用者編輯、住宿、排序、Plan B、行前準備及必買／代購資料沿用既有 localStorage 與 Supabase payload。
- 資料升級採欄位補齊，不會重建既有資料。

## 更新
後續程式更新原則上只需替換 `assets/app.js`、`assets/app.css`、`index.html`、`service-worker.js`。
