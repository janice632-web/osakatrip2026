# Travel Companion V3.0.0

以目前正式穩定版 V2.0.2 為基礎完成專案精簡，功能不變。

## 專案結構

```text
assets/
  app.css
  app.js
icons/
  icon-192.png
  icon-512.png
public/data/
  hotel.json
  luggage.json
  osaka-2026.json
  shopping.json
  tickets.json
  transport.json
  wishlist.json
index.html
manifest.webmanifest
service-worker.js
SUPABASE_SETUP.sql
README.md
DELETE_OLD_FILES.md
.nojekyll
```

## 部署

1. 建議先上傳到 `develop` 分支。
2. 清空該分支舊檔後，上傳本資料夾內全部內容。
3. 確認網站正常後，再合併到 `main`。
4. 原本 Supabase 已設定完成時，不需要重跑 SQL。

## 保留功能

- Day 1～Day 6 行程
- 飯店與抵達流程
- 大阪城 Road Train
- 每日天氣
- Day 6 雙方案
- Google Maps
- 私人編輯連結
- 唯讀分享連結
- Supabase 同步
- Storage 圖片上傳
