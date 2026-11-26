# CLAUDE.md：進到水深之處（2026-2027 跨年禱告會抽經文網站）

夏凱納靈糧堂資訊組的專案。會眾在跨年禱告會現場用手機掃 QR Code，划船到「水深之處」下網，領受一則新年祝福經文（96 則）。
使用者是資訊組同工，用繁體中文溝通；回覆請用繁體中文，口語、簡潔。

## 線上現況（實際設定值）

| 項目 | 值 |
| --- | --- |
| GitHub repo | `ShekinahBOL/2027-new-year`，push 到 `main` = 正式部署。另一個 `ShekinahBOL/2026NewYear2027` 沒在用 |
| Cloudflare | **Pages** 專案 `2027-new-year`（不是 Worker），預設網址 `2027-new-year.pages.dev` |
| 建置設定（後台） | Framework None、建置指令留空、輸出目錄 `public`，`functions/` 自動變 API |
| 正式網址 | `https://2027-new-year.shekinahch.org` |
| 控制台 | `/admin`，由 Cloudflare Access 保護（自我裝載應用程式，目的地 `2027-new-year.shekinahch.org/admin` 與 `/api/admin`，原則：允許、資訊組 email、One-time PIN） |
| KV | 後台綁定，變數名稱 `SETTINGS`，key `settings` 存 `{open, testMode, closedMessage, updatedAt, updatedBy}` |
| 環境變數（後台、正式環境） | `ACCESS_AUD`、`ACCESS_TEAM_DOMAIN` |
| 部署手冊 | Claude Doc：https://claude.ai/artifact/XLLb3wvPiJPPLUCYo8t9dn |
| 壓力測試 | 已通過：600 人、失敗率 0.03%、首頁 p95 0.94s、`/api/status` p95 0.18s |

**部署的關鍵陷阱：** `wrangler.toml` 只給本機開發用，**不可以加 `pages_build_output_dir`**。加了 Cloudflare 會改用這個檔案當正式設定，忽略後台的 KV 綁定與環境變數，部署會失敗（`Error 8000022: Invalid KV namespace ID`）。

## 檔案地圖

```
public/                 靜態網站（輸出目錄）
  index.html            前台：首頁 → 划船 → 下網 → 經文卡，另有「尚未開放」畫面
  css/theme.css         主題：顏色、字級角色 --fs-*（換主視覺改這裡）
  css/app.css           前台版面與動畫
  js/ocean.js           夜海畫布：海浪、氣泡、魚群、漣漪、撒網、金光（讀 --sea-* 與 --gold，必須是 #RRGGBB）
  js/app.js             流程、抽籤、localStorage、經文卡、1080×1920 圖卡（buildWallpaper）、分享、LINE 處理
  config/verses.json    96 則經文 {id, ref, text}，以使用者提供的 docx 為準
  fonts/ui-600|900.woff2  介面用思源宋體子集
  fonts/v/NNN.woff2     每則經文自己的字型子集，抽到才載入
  assets/               logo-full.png（彩色）、logo-full-white.png（首頁用白色版）、logo-mark.png（S 標誌）、icons
  admin/                控制台（三個設定：前台開關、關閉文字、測試模式）
  _headers              快取：fonts 1 小時、js/css/config 5 分鐘
functions/
  api/status.js         GET 前台讀開關（KV cacheTtl 30s）；讀不到回 503，前台當作開放
  api/admin/_middleware.js  驗證 Cloudflare Access JWT（本機 .dev.vars 的 DEV_BYPASS_ACCESS=true 可略過）
  api/admin/settings.js GET/PUT 控制台設定
  _lib/settings.js      預設值（未設定時前台為關閉）
tools/build_fonts.py    產生字型子集；tools/docx_to_json.py 經文轉檔
loadtest/k6-600.js      600 人壓力測試
PRODUCT.md / DESIGN.md  產品決策與設計系統（改外觀前先讀 DESIGN.md）
.impeccable/            設計流程紀錄（surface brief、critique 報告）
```

## 已確定的產品決策（不要擅自更改）

- **一台裝置一則**：第一次抽到就存進 localStorage（key `deepwater-2027:draw`，存 id、ref、text），之後永遠顯示同一則，只有「再看一次航行」，沒有重抽。清除瀏覽資料、無痕模式、換瀏覽器會被當成新裝置，這是已接受的限制。
- **測試模式**：全站開關，每次重抽、結果不保存，前台頂端顯示紅色標示。
- **前台關閉**：沒抽過的人看關閉文字，每 20 秒自動檢查；抽過的人仍看得到自己的經文。
- **讀不到開關一律當作開放**（現場卡住的代價比提早抽更大）。
- 開關存 **KV**（使用者選擇，生效延遲 30～60 秒可接受，同工會提早開放），不做統計，人數看 Web Analytics。維持 Cloudflare 免費方案。
- **LINE 內建瀏覽器**：不支援下載與系統分享。存圖改顯示 data URL 圖片請使用者長按，並提供「用 Safari／Chrome 開啟並下載」按鈕（`/?openExternalBrowser=1&v=經文id`，外部瀏覽器若還沒抽過就沿用同一則）。分享改開 `https://line.me/R/share?text=…`。
- **外觀**：以使用者原本範例的夜海風格為準（深藍夜海、金光、發光魚群、深藍金框經文卡）。使用者否決過「航海水深圖」改版（太平、太冷、沒儀式感）。12 月教會設計組會出主視覺，屆時再依主視覺改。
- **Logo**：深色畫面用白色版，彩色版只放白底，不重繪 logo。
- **長輩友善**：介面字最小 14px，經文最小 18px；主要操作是一顆大按鈕，划船拖曳是加分；不卡通、不遊戲感，裝飾不能蓋過經文。
- **動畫節奏**：按鈕在經文卡出現約 2.15 秒後才浮現，使用者確認保留。
- **無聲**，經文出現時手機輕震（只有 Android 支援）。

## 工作方式

1. **在分支上改，開 PR。** 推上分支後 Cloudflare 會產生預覽網址（`https://<分支名稱>.2027-new-year.pages.dev`），把網址給使用者看過，使用者同意才合併到 `main`（合併即正式上線，約 1 分鐘）。預覽網址沒有 Access，控制台在那裡存不了設定，屬正常。
2. **改了介面上的中文字或經文，一定要重產字型**，否則新字會變成系統字型：
   ```bash
   pip install fonttools brotli
   npm pack @fontsource/noto-serif-tc && mkdir -p /tmp/fontsrc && tar xzf fontsource-noto-serif-tc-*.tgz -C /tmp/fontsrc && rm fontsource-noto-serif-tc-*.tgz
   python3 tools/build_fonts.py /tmp/fontsrc/package/files
   ```
   產生的 `public/fonts/` 要一起 commit；不要把 `package/` 或 tgz commit 進 repo。
3. **經文 `id` 不可改、不可重複**：已抽過的手機存的是經文文字本身，改經文不影響他們，但 id 會用在字型檔名與 LINE 轉跳。
4. **本機測試**：
   ```bash
   cp .dev.vars.example .dev.vars
   npx wrangler pages dev public      # http://localhost:8788
   curl -X PUT localhost:8788/api/admin/settings -H 'content-type: application/json' -d '{"open":true}'
   ```
   有瀏覽器工具時，用 390×844 與 360×640 手機尺寸截圖檢查首頁、划船、下網、經文卡、儲存彈窗。`.dev.vars` 不可 commit，Cloudflare 上也不可設 `DEV_BYPASS_ACCESS`。
5. 改了顏色、字級、元件或動畫規則，同步更新 `DESIGN.md`；改了產品行為，同步更新 `PRODUCT.md` 與 `README.md`。
6. 回報時說清楚改了什麼、預覽網址、還需要使用者在手機上實測哪些事（尤其 iPhone Safari、Android Chrome、LINE 內建瀏覽器）。

## 待辦與提醒

- [ ] 確認 repo 裡的 `wrangler.toml` 沒有 `pages_build_output_dir`，且 `public/_headers` 的 `/fonts/*` 是 `max-age=3600`（之前的修正可能還沒推上去）。
- [ ] 用手機 LINE 實測：長按存圖、「用 Safari／Chrome 開啟並下載」、分享。
- [ ] Pages 專案啟用 Web Analytics。
- [ ] 跨年當晚：測試模式關閉、前台先關閉並確認文字、QR Code 指向正式網址、**提早**開放（30～60 秒生效）。會場 Wi-Fi 能否撐住 600 支手機要另外確認。
- [ ] 12 月設計組主視覺出來後，依主視覺改 `theme.css`、`assets/` 與 `buildWallpaper()`。
