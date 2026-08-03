# Supabase 最後設定（約 5 分鐘）

## 1. 開啟 Realtime
在 Supabase → SQL Editor 執行：

```sql
do $$
begin
  alter publication supabase_realtime add table public.travel_data;
exception
  when duplicate_object then null;
end $$;
```

若顯示已經加入 publication，也代表完成。

## 2. 設定 Email 登入返回網址
Supabase → Authentication → URL Configuration：

- Site URL
  `https://janice632-web.github.io/osakatrip2026/`
- Redirect URLs 新增
  `https://janice632-web.github.io/osakatrip2026/**`

Email Magic Link 預設已啟用，不需要建立密碼。

## 3. 部署
將本 ZIP 解壓縮後的全部檔案覆蓋上傳至 GitHub repository 根目錄，Commit changes。

部署後開啟：
`https://janice632-web.github.io/osakatrip2026/?v=cloud2`

## 4. 第一次登入
1. 點網站上方「登入同步」
2. 輸入 Email
3. 到信箱點登入連結
4. iPhone、iPad 都用同一 Email

## 同步規則
- 本機每次修改後約 1–2 秒自動上傳。
- 另一台裝置收到更新後會自動重新整理。
- 離線時可繼續使用，恢復網路後自動同步。
- 圖片目前會以壓縮後資料一起存入 `travel_data.payload`。圖片很多時，建議日後再改用 Supabase Storage。
