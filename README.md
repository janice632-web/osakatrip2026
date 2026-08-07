# Osaka Travel Companion V4.2.1

穩定維護版。程式統一為 `assets/app.js` 與 `assets/app.css`。

## 資料保護
- 行程原始資料位於 `public/data/`，V4 重構未修改任何內容。
- 使用者編輯、住宿、排序、Plan B、行前準備及必買／代購資料沿用既有 localStorage 與 Supabase payload。
- 資料升級採欄位補齊，不會重建既有資料。

## 更新
後續程式更新原則上只需替換 `assets/app.js`、`assets/app.css`、`index.html`、`service-worker.js`。


## V4.2.1 第 3 階段
- PWA 離線模式與 Service Worker 正式註冊
- iPhone／iPad 加入主畫面引導
- 新版本自動偵測、啟用並重新載入
- Supabase 多裝置同步強化
- 離線修改先存本機，恢復連線後自動比對同步


## V4.2.1 必買／代購中心
- 全部／依人／依商品三種檢視
- 點人名查看個人商品、件數與金額
- 同商品多人購買合併統計
- 點商品展開購買人與各自數量
- 商品搜尋
- 名稱／價格／新增時間排序

## V4.2.1
- 必買／代購商品圖片點擊放大預覽
- 支援背景、關閉鍵與 Esc 關閉
