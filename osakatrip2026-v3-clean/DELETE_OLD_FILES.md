# 舊專案可刪除清單

採用「整個分支清空後重傳 V3」時，下列舊檔會全部被取代，不需個別保留。

## 舊版 JavaScript 與設定

```text
assets/app.m2.js
assets/app.v201.js
assets/app.v202.mobile.js
assets/app.v3.js
assets/cloud-sync.js
assets/config.js
assets/config.v201.js
assets/config.v3.js
assets/style.css
```

原本的 `assets/app.js` 也會被 V3 新版 `assets/app.js` 覆蓋。

## 重複圖示

```text
assets/icons/
```

V3 統一保留根目錄的：

```text
icons/icon-192.png
icons/icon-512.png
```

## 舊 SQL 與設定說明

```text
SUPABASE_PRIVATE_LINK_SETUP.sql
SUPABASE_V201_SETUP.sql
SUPABASE_SETUP.md
DEPLOY_V201.md
MOBILE_FIX.md
```

V3 統一保留：

```text
SUPABASE_SETUP.sql
```

## 驗證與歷史開發文件

```text
VALIDATION_RESULT.txt
VALIDATION_RESULT_M2.txt
VALIDATION_RESULT_V201.txt
docs/
schemas/
scripts/
```

這些不影響網站運作；需要留存時，可從既有 Git Tag `v2.0.2-stable` 下載。
