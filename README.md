# 進到水深之處｜2026-2027 跨年禱告會抽經文網站

夏凱納靈糧堂跨年禱告會用的抽祝福經文網站。會眾用手機掃 QR Code 進來，按下「啟航領受經文」，按住小船往上划（或點一下自動划）到水深之處，下網後在金光中領受一則新年祝福經文。

- 同一台裝置第一次隨機抽，之後再進來永遠是同一則（存在瀏覽器的 localStorage）。
- 經文卡可以存成 1080×1920 的手機桌布圖、複製文字、分享。
- `/admin` 控制台可以開關前台、設定關閉時的文字、切換測試模式。

## 檔案結構

```
public/                 ← Cloudflare Pages 輸出目錄（純靜態，不需建置）
  index.html            前台
  css/theme.css         ★ 主題：顏色與字型都在這裡（換主視覺改這個）
  css/app.css           前台版面
  js/ocean.js           夜海畫布（海浪、氣泡、航跡、魚群、下網、金光）
  js/app.js             前台流程、抽籤、經文卡、圖卡產生
  config/verses.json    ★ 96 則經文
  fonts/ui-*.woff2      介面用的思源宋體（只含用到的字）
  fonts/v/NNN.woff2     每則經文自己的字型檔，抽到才下載
  assets/               logo 與圖示
  admin/                控制台頁面
  _headers              快取設定
functions/              Pages Functions（API）
  api/status.js         GET  /api/status            前台讀開關
  api/admin/_middleware.js  驗證 Cloudflare Access 登入
  api/admin/settings.js GET/PUT /api/admin/settings 控制台讀寫設定
loadtest/k6-600.js      600 人壓力測試腳本
tools/                  經文轉檔、字型子集工具
```

## 部署到 Cloudflare Pages

### 1. 建立 Pages 專案

1. 把整個資料夾推到 GitHub repo。
2. Cloudflare 後台 → **Workers & Pages** → **建立** → **Pages** → **連接到 Git**，選這個 repo。
3. 建置設定：
   - Framework preset：`None`
   - 建置指令：**留空**
   - 建置輸出目錄：`public`
4. 儲存並部署。`functions/` 資料夾會自動變成 API。

> 不想用 GitHub 的話，也可以用指令直接上傳：`npx wrangler pages deploy`（第一次會要求登入）。

### 2. 建立 KV 並綁定

1. **Workers & Pages** → **KV** → **建立命名空間**，名稱例如 `deepwater-settings`。
2. 回到 Pages 專案 → **設定** → **繫結（Bindings）** → **新增** → **KV 命名空間**：
   - 變數名稱：`SETTINGS`（一定要這個名字）
   - KV 命名空間：選剛剛建的
   - **正式（Production）和預覽（Preview）都要加。**
3. 重新部署一次，讓綁定生效。

`wrangler.toml` 只給本機開發用，裡面刻意沒有 `pages_build_output_dir`；加上那一行，Cloudflare 就會改用這個檔案當正式設定，忽略後台的 KV 綁定與環境變數。

### 3. 用 Cloudflare Access 保護控制台

1. 進 **Zero Trust**（第一次會請你取一個團隊名稱，例如 `shekinah`，並選 Free 方案；50 人以內免費）。
2. **設定** → **驗證（Authentication）** → 登入方式加入 **One-time PIN**。
3. **Access** → **Applications** → **Add an application** → **Self-hosted**：
   - Application name：`抽經文控制台`
   - 新增以下網址（每一列一個；綁正式網域後再把正式網域也各加一列）：
     - `你的專案.pages.dev` 路徑 `admin`
     - `你的專案.pages.dev` 路徑 `api/admin`
   - Policy：Action 選 **Allow**，Include 選 **Emails**，填入資訊組同工的 email。
4. 建好後，在這個 Application 的 **Overview** 頁複製 **Application Audience (AUD) Tag**。
5. Pages 專案 → **設定** → **變數和機密**，新增兩個變數（正式與預覽都加）：
   - `ACCESS_AUD`：剛剛複製的 AUD Tag
   - `ACCESS_TEAM_DOMAIN`：`你的團隊名稱.cloudflareaccess.com`
6. 重新部署。

驗證方式：打開 `https://你的專案.pages.dev/admin`，應該先看到 Cloudflare 的登入頁，輸入 email、收驗證碼後才進得去。後端也會再驗證一次 Access 的登入憑證，所以就算某個網址漏設 Access，也沒辦法直接改設定（會回 401／403）。

### 4. 綁正式網域

Pages 專案 → **自訂網域** → 新增，例如 `bless.教會網域`。網域在 Cloudflare 上會自動設好 DNS。**記得回到第 3 步，把正式網域的 `admin` 和 `api/admin` 也加進 Access。**

### 5. 開啟人數統計

Pages 專案 → **Metrics** → 啟用 **Web Analytics**。

## 活動前檢查清單

- [ ] 控制台登入正常，只有資訊組 email 進得去
- [ ] 彩排時開「測試模式」，前台角落有紅色「測試模式」字樣，每次都重抽
- [ ] **彩排結束關掉測試模式**（控制台上方的紅色警示會消失）
- [ ] 前台設為「關閉」，關閉文字確認過
- [ ] 跑過一次壓力測試（見下方）
- [ ] 活動當晚**提早**按下「開放」：生效需要 30～60 秒
- [ ] 用 LINE 內建瀏覽器、iPhone Safari、Android Chrome 各試一次儲存圖卡

## 開關的行為

| 情況 | 前台看到 |
|---|---|
| 開放 | 首頁，可以抽 |
| 關閉，沒抽過 | 關閉文字；每 20 秒自動檢查，開放後自動進首頁 |
| 關閉，已抽過 | 自己的經文卡（抽過的人永遠看得到） |
| 測試模式 | 每次都重新抽，結果**不保存**；關掉後，下一次抽才算正式結果 |
| `/api/status` 讀不到（KV 異常、額度用完） | **當作開放**（現場卡住的代價比提早抽更大） |

- 開關存在 KV，加上 30 秒快取，修改後約 **30～60 秒**全部生效。
- KV 裡還沒有設定時（剛部署），預設是**關閉**。

## 修改經文

1. 修改 `public/config/verses.json`（`id` 不要重複、不要改既有的 id）。
2. **重新產生字型**（字型只含用到的字，新增的字不在裡面會顯示成系統字型）：

   ```bash
   pip install fonttools brotli
   npm pack @fontsource/noto-serif-tc && tar xzf fontsource-noto-serif-tc-*.tgz
   python3 tools/build_fonts.py package/files
   ```

3. push 後自動部署。

已經抽過的人存的是經文文字本身，改了經文也不會影響他們看到的內容。

改了介面上的文字（`index.html`、`app.js`、`admin/index.html`）也要重跑一次 `build_fonts.py`。

## 換主視覺（12 月設計組定稿後）

- 顏色：改 `public/css/theme.css` 的變數。夜海畫布也讀 `--sea-*`（淺海與深海的漸層）和 `--gold`，請維持 `#RRGGBB` 格式。
- 圖片：替換 `public/assets/`。
- 字型：換字型後要改 `tools/build_fonts.py` 的來源，並重新產生。
- 經文卡版面在 `app.css` 的 `.label-card`；下載圖卡的版面在 `app.js` 的 `buildWallpaper()`，兩邊要一起改。

## 本機開發

```bash
cp .dev.vars.example .dev.vars          # 本機略過 Access 驗證
npx wrangler pages dev public           # http://localhost:8788
```

本機的 KV 是模擬的，可以用以下指令改設定：

```bash
curl -X PUT localhost:8788/api/admin/settings -H 'content-type: application/json' -d '{"open":true}'
```

`.dev.vars` 不要上傳，也不要在 Cloudflare 上設定 `DEV_BYPASS_ACCESS`。

## 壓力測試

安裝 [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) 後，對**預覽網址**執行：

```bash
k6 run -e BASE_URL=https://你的專案.pages.dev loadtest/k6-600.js
```

腳本模擬 600 人在 1 分鐘內進來、再同時停留 1 分鐘；其中 1/3 的人停在等待畫面每 20 秒檢查一次。通過標準：

- 失敗率 < 1%
- 首頁載入 p95 < 3 秒
- `/api/status` p95 < 0.8 秒

一次測試大約用掉幾千次 Functions 請求，遠低於免費方案每天 10 萬次。

### 效能數字

- 首頁第一次載入約 **120KB**（壓縮後），驗收標準是 400KB 以內。
- 抽到經文時再下載那一則的字型，每個 6～15KB，會在下網動畫期間載完。
- 靜態檔案由 Cloudflare CDN 提供，不計入 Functions 額度；只有 `/api/status` 會用到 Functions。

## 已知限制

- 「同一裝置」以瀏覽器為單位：清除瀏覽資料、無痕模式、換瀏覽器（例如從 LINE 換到 Safari）都會被當成新裝置。
- 手機震動只有 Android 支援。
- LINE 內建瀏覽器不支援下載與系統分享：「儲存祝福圖卡」會顯示圖卡請使用者長按儲存，並提供「用 Safari／Chrome 開啟並下載」按鈕（網址帶 `openExternalBrowser=1&v=經文編號`，外部瀏覽器會沿用同一則經文）；「分享」會打開 LINE 的分享選單（文字加網址，無法附圖）。
