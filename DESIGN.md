---
name: 進到水深之處
description: 2026-2027跨年禱告會抽祝福經文網站：夜海中划船、下網，在破曉金光裡領受一則經文。
colors:
  gold: "#f4d03f"
  gold-light: "#fcf3cf"
  gold-dark: "#c99e10"
  gold-button-top: "#f9e076"
  gold-button-bottom: "#d4ac0d"
  sea-top-shallow: "#082644"
  sea-mid-shallow: "#104370"
  sea-bottom-shallow: "#1e78b5"
  sea-top-deep: "#031122"
  sea-mid-deep: "#072447"
  sea-bottom-deep: "#0c3663"
  bg-page: "#020914"
  bg-abyss: "#031122"
  bg-deep: "#072240"
  bg-card-top: "#0a2647"
  bg-card-bottom: "#0f345c"
  cream: "#fffdf7"
  cream-muted: "rgba(255, 253, 247, 0.78)"
typography:
  display:
    fontFamily: "\"Deep Serif\", \"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif"
    fontSize: "clamp(36px, 10vw, 44px)"
    fontWeight: 900
    lineHeight: 1.25
    letterSpacing: "0.14em"
  headline:
    fontFamily: "\"Deep Serif\", \"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif"
    fontSize: "clamp(19px, 5.3vw, 22px)"
    fontWeight: 600
    lineHeight: 1.8
    letterSpacing: "0.05em"
  title:
    fontFamily: "\"Deep Serif\", \"Noto Serif TC\", \"Songti TC\", \"PMingLiU\", serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "0.14em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "15px"
    fontWeight: 400
    letterSpacing: "0.12em"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"PingFang TC\", \"Noto Sans TC\", \"Microsoft JhengHei\", sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  control: "14px"
  panel: "16px"
  hud: "18px"
  card: "24px"
  stage: "36px"
  pill: "999px"
spacing:
  gap-sm: "10px"
  gap-md: "16px"
  screen-x: "22px"
components:
  button-gold-enter:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.bg-abyss}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "62px"
  button-gold-action:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.bg-abyss}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "54px"
  button-navy:
    backgroundColor: "{colors.bg-deep}"
    textColor: "{colors.gold-light}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "50px"
  button-replay:
    backgroundColor: "{colors.bg-abyss}"
    textColor: "{colors.gold-light}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  blessing-card:
    backgroundColor: "{colors.bg-card-top}"
    textColor: "{colors.cream}"
    rounded: "{rounded.card}"
    padding: "30px 26px 22px"
  scripture-ref:
    backgroundColor: "{colors.bg-abyss}"
    textColor: "{colors.gold}"
    rounded: "{rounded.pill}"
    padding: "5px 18px"
  hint-pill:
    backgroundColor: "{colors.bg-abyss}"
    textColor: "{colors.cream}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  logo-card:
    backgroundColor: "#ffffff"
    rounded: "{rounded.panel}"
    padding: "9px 18px"
---

# Design System: 進到水深之處

## Overview

**Creative North Star: "夜海下網的金光"**

整個網站是一片夜裡的深藍海：畫布從上到下是由暗到亮的海藍漸層，微光氣泡持續往上浮，幾條淡淡的海浪線緩緩流過。航行越深，整片海的三段漸層就越往深色移動（`--sea-*-shallow` 混向 `--sea-*-deep`），頂端的破曉金色暈光則越來越亮。下網時，金色發光魚群圍著小船游、圓形撒網張開又收攏、一條大魚躍起，最後整個畫面被一道奶白到金色的破曉閃光蓋過，經文卡隨即浮現。

視覺語言只有兩種材料：**深海藍**（背景、面板、卡片、次要按鈕）和**金光**（行動、經文出處、框線、魚、網、閃光）。文字是帶暖意的奶白 `cream`。介面元件都是半透明深藍底加金色細框，浮在動態的海上；唯一的實心亮面是金色漸層膠囊按鈕，所以拇指永遠找得到下一步。經文卡是整個儀式的終點：深藍漸層底、頂端一抹金色暈光、金色雙框，標題與經文用思源宋體系（Deep Serif）。

畫面是一支手機尺寸的舞台（最寬 430px）。在大於 480px 的螢幕上，舞台變成一支帶 36px 圓角和金色細邊的「手機」，置中在更深的放射漸層背景上。首頁與「尚未開放」頁頂端用白色單色版 logo（`assets/logo-full-white.png`，透明底），直接放在夜海上；其他地方的彩色 logo 只放在白底卡或白色圓形徽章裡，不與夜海配色混用。

**Key Characteristics:**
- 深藍夜海漸層畫布（canvas 繪製），隨航行進度由淺轉深
- 上升的微光氣泡與流動海浪線，全程不停
- 金色是唯一的強調色：行動、出處、框線、魚、網、閃光
- 金色漸層膠囊按鈕是畫面上唯一的實心亮面
- 半透明深藍面板加金色細框（`rgba(244, 208, 63, .25–.6)`）
- 祝福經文卡：深藍漸層、金色雙框、宋體經文
- 一個 1080×1920 的祝福圖卡，以同一套視覺重畫在 canvas 上

## Colors

深藍夜海鋪滿整個畫面，金光只出現在需要被看見的地方，奶白文字壓在深藍上。

### Primary
- **破曉金** (`gold`)：主強調色。活動名小標、經文出處、HUD 階段文字、所有金色細框的基色（以 0.25–0.6 透明度使用）、魚群與撒網的光、火花、選取反白。`ocean.js` 會讀取它來畫網緣鉛墜與火花。
- **晨光淺金** (`gold-light`)：金色上的淺階。主題經文框文字、次要按鈕文字、目標浮標標籤、下網提示、儲存提示，以及所有元件的 focus 外框。
- **按鈕金漸層** (`gold-button-top` → `gold` → `gold-button-bottom`)：只用在金色按鈕的 135° 三段漸層。
- **暗金** (`gold-dark`)：已定義；前台只以其 rgba 值（`rgba(201, 158, 16, .55)`）出現在大標題的金色落影，未以變數引用。

### Secondary
- **夜海漸層：淺** (`sea-top-shallow`、`sea-mid-shallow`、`sea-bottom-shallow`) 與 **夜海漸層：深** (`sea-top-deep`、`sea-mid-deep`、`sea-bottom-deep`)：只給 canvas 用。`ocean.js` 依航行進度 0→1 把三段（0%、55%、100%）從淺色混到深色。首頁固定在 0.2、經文卡固定在 1。

### Neutral
- **深淵** (`bg-abyss`)：最深的介面色。面板、提示膠囊、出處膠囊等半透明底都是它的 rgba（`rgba(3, 17, 34, .55–.8)`），也是金色按鈕上的文字色（以 `#04152b` 實寫）與 `theme-color`。
- **頁底** (`bg-page`)：`html, body` 的底色，舞台外圍。
- **深海** (`bg-deep`)：控制台面板底；前台的次要按鈕用近似的 `rgba(8, 32, 60, .92)`。
- **經文卡漸層** (`bg-card-top` → `#04132a` → `bg-card-bottom`)：經文卡的 165° 漸層。
- **奶白** (`cream`)：主要文字、大標題、經文、圖卡上的經文。
- **奶白次要** (`cream-muted`)：副標、說明文字、HUD 標頭。
- **白**（`#fff`，未設 token）：只當 logo 的底，logo 卡與圓形標誌徽章。

### Named Rules
**金光只有一種的規則。** 強調色只有 `gold` 一族。新增狀態或元件時，用 `gold` 的透明度階（框線 .25–.6、底色 .14–.16）做層次，不另找第二個強調色。

**Logo 用法的規則。** 深色畫面直接放的 logo 一律用白色單色版（`logo-full-white.png`）；彩色 logo 只放在白底（白色圓角卡或白色圓形徽章）上、保持原色。logo 的粉紅與紫不進入介面配色。

**Canvas 讀色的規則。** `--sea-*` 與 `--gold` 必須維持 `#RRGGBB` 六碼格式；`ocean.js` 只接受這個格式，否則退回內建預設值，換色會靜默失效。

## Typography

**Display Font:** Deep Serif（本站子集化的宋體，600／900 兩個字重；退回 Noto Serif TC、Songti TC、PMingLiU）
**Body Font:** 系統黑體（-apple-system、PingFang TC、Noto Sans TC、Microsoft JhengHei）

**Character:** 宋體承載所有「被領受」的文字：活動名、大標、經文、出處、按鈕主文案；系統黑體只負責說明、提示與小標籤。兩者都拉開字距，讓中文在夜海上顯得從容。

每一則經文另有自己的子集字型（`/fonts/v/NNN.woff2`，字重 600），經文與出處以它為首選、`--font-serif` 為後備，確保經文的每個字都有宋體。

### Hierarchy
- **Display**（900，`clamp(36px, 10vw, 44px)`，行高 1.25，字距 .14em）：首頁與關閉頁的「進到水深之處」，奶白字加金色落影。矮螢幕（≤680px 高）降為 34px。
- **Headline／經文**（600，`clamp(19px, 5.3vw, 22px)`，行高 1.8，字距 .05em）：經文卡上的經文，`line-break: strict`。中等長度降為 `clamp(17.5px, 4.8vw, 19.5px)`／1.72，長經文降為 `clamp(16px, 4.3vw, 17.5px)`／1.66。
- **Title**（宋體 600，15–19px，字距 .06–.14em）：金色活動小標（17px）、主按鈕文字（19px）、下網提示（17px）、主題經文（16px，行高 1.7）、出處（15px）、HUD 階段（15px）。
- **Body**（系統黑體 400–500，14–15px，字距 .06–.12em）：副標、首頁說明、提示膠囊、儲存提示。關閉訊息用 18px／1.7。
- **Label**（系統黑體 600，14–15px，字距 .06–.1em）：經文卡頂端的活動標示、卡片底部祝福語。為了長輩，介面上不出現小於 14px 的字，經文最小 18px。

### Named Rules
**宋體給經文的規則。** 經文、出處、活動名一律用宋體（Deep Serif 或該則經文字型）；系統黑體不出現在經文本身。

**字只從本站來的規則。** 中文字型只用子集化後放在本站的檔案，不從 Google Fonts 或其他外部來源載入（首次載入需低於 400KB）。新增文案時要確認字已在子集內。

**字級角色（`theme.css` 的 `--fs-*`）：** `--fs-display` 主標、`--fs-scripture`／`-m`／`-l` 經文（依長度，最小 18px）、`--fs-quote` 主題經文與關閉訊息（18px）、`--fs-label` 金色宋體標示（活動名、階段、下網字幕、出處，16px）、`--fs-action-hero` 啟航按鈕（19px）、`--fs-action` 結果頁按鈕（16px）、`--fs-body` 說明（15px）、`--fs-caption` 最小字（14px）。新元素一律從這些角色挑，不另寫數值；介面上除了 ❖ 裝飾符號外沒有小於 14px 的字。標題與短句用 `text-wrap: balance`，經文用 `text-wrap: pretty`；主題經文以片語為單位換行（`.phrase`），不在詞中間斷開。

## Layout

單欄、置中、為手機直式設計。舞台 `phone-stage` 寬 100%、最寬 430px、高 `100dvh`、最高 920px；≥480px 時高 94dvh 並加 36px 圓角，看起來像一支手機置中在桌面上。

每一幕（`.screen`）都是鋪滿舞台的絕對定位層，直向 flex、`space-between`：上方是 logo 或 HUD，中央是內容，底部拇指區是主要行動。左右內距 22px，上下以 `env(safe-area-inset-*)` 為準（最少 20／24px）。幕與幕之間用 .55s 的透明度淡入淡出切換。

- **首頁**：上方 logo 卡；中央錨形徽章、金色小標、大標、副標、主題經文框；底部金色膠囊大按鈕（最寬 310px）與一行說明。
- **划船**：頂端 HUD 面板（最寬 330px）；上方 17% 處是「水深之處」浮標（150px 圓形點擊區）；小船從底部 14% 往上移；底部 4.5% 是向上箭頭與提示膠囊。
- **下網**：只有 canvas 動畫與一個置中偏下（`margin-top: 46vh`）的提示膠囊。
- **經文卡**：卡片置中（最小高 `min(52dvh, 500px)`），下方是動作區：全寬金色按鈕、兩欄並排的深藍按鈕（間距 10px）、置中的「再看一次航行」。內容過高時這一幕可捲動。

矮螢幕（`max-height: 680px`）縮小錨形徽章、大標與按鈕高度，讓經文卡與按鈕仍在同一屏。

## Elevation & Depth

深度來自三層：最底是 canvas 夜海（自己就有漸層與動態），中間是半透明深藍面板加金框，最上層是金色閃光與提示。陰影都是柔和的深色環境陰影，用來把元件從動態的海面上托起，加上金色的內光或外光表示「有光」。

### Shadow Vocabulary
- **舞台**（`0 24px 60px rgba(0,0,0,.85), 0 0 0 1px rgba(244,208,63,.18)`；≥480px 時 `0 30px 80px rgba(0,0,0,.9), 0 0 0 2px rgba(244,208,63,.25)`）：手機舞台本身，外加一圈金色細光。
- **經文卡**（`0 22px 50px rgba(0,0,0,.7), inset 0 0 30px rgba(244,208,63,.1)`）：最重的陰影，加內部金光。
- **金色按鈕**（`0 10px 24px -6px rgba(0,0,0,.55), inset 0 1px 1px rgba(255,255,255,.75)`）：頂緣一道白色高光讓它像實體金屬。
- **浮起膠囊**（`0 4px 16px` 到 `0 10px 28px`，`rgba(0,0,0,.45–.5)`）：提示膠囊、下網提示、toast。
- **Logo 卡**（`0 8px 24px rgba(0,0,0,.35)`）。
- **文字落影**：大標 `0 2px 0 rgba(201,158,16,.55), 0 6px 18px rgba(0,0,0,.45)`；浮標標籤 `0 2px 8px rgba(0,0,0,.85)`。

### Named Rules
**光是金色的規則。** 發光一律是金色（`rgba(244,208,63,…)` 或 `rgba(255,226,110,…)`）：燈籠光暈、目標光圈、魚的光、經文卡的頂光與內光、破曉閃光。藍色只做背景與錨形徽章的一圈 `rgba(25,100,153,.5)` 外光。

## Shapes

圓潤、沒有銳角。行動與標籤是全圓膠囊（999px）：主按鈕、出處、提示、toast、再看一次、進度條。容器用中大圓角：按鈕列 14px、logo 卡與主題經文框 16px、HUD 與關閉訊息框 18px、經文卡 24px（內框 17px）、桌面舞台 36px。錨形徽章、浮標、標誌徽章是正圓。

框線都是 1–1.5px 的金色半透明細線；經文卡是唯一的**雙框**：外框 1.5px `rgba(244,208,63,.6)`，內縮 8px 再一道 1px `rgba(244,208,63,.26)`。目標浮標用一圈慢慢旋轉的金色虛線圓。

## Components

### Buttons
金色是實心、會發亮的；深藍是退後一步的。
- **Shape：** 首頁主按鈕與再看一次為全圓膠囊；經文卡動作區按鈕為 14px 圓角。
- **金色按鈕（`btn-gold`）：** 135° 三段金色漸層，深藍字（`#04152b`），金屬高光陰影。首頁版高 62px、最寬 310px、宋體 19px；經文卡版高 54px、16.5px。圖示是內嵌 SVG，`currentColor`。
- **Hover／Active：** hover 提亮 `brightness(1.06)`；按下 `scale(.96)`（.16s）。
- **Focus：** 2px `gold-light` 外框，外推 3px（所有前台按鈕共用）。
- **Disabled：** 透明度 .6，游標 `progress`（產生圖卡時）。
- **深藍按鈕（`btn-navy`）：** `rgba(8,32,60,.92)` 底、1px `rgba(244,208,63,.48)` 金框、`gold-light` 字，高 50px；hover 框線轉成實金色。用於「分享」「複製經文」。
- **再看一次（`btn-replay`）：** 無框的深藍半透明膠囊，高 44px，`gold-light` 字。
- **關閉預覽（`btn-close-modal`）：** 白色半透明膠囊、奶白細框，只用在圖卡預覽彈窗。

### Cards / Containers
- **面板（HUD、主題經文、關閉訊息）：** `rgba(3,17,34,.55–.72)` 底、1px 金色半透明框、16–18px 圓角、12–22px 內距。
- **首頁 logo：** 白色單色版 `logo-white`，寬 `min(64%, 240px)`，帶淡陰影，直接放在夜海上。
- **Logo 卡（`.logo-card`，目前前台未使用）：** 白底、16px 圓角、`9px 18px` 內距，logo 高 40px。

### 祝福經文卡（Signature）
整個儀式的終點。
- **Background：** 頂端一抹金色橢圓暈光，疊在 `bg-card-top` → `#04132a` → `bg-card-bottom` 的 165° 漸層上。
- **Border：** 金色雙框（見 Shapes），24px 圓角。
- **結構：** 頂端活動標示與菱形分隔線；中間宋體經文與金色出處膠囊（`rgba(244,208,63,.14)` 底、.45 框）；底部白色圓形標誌徽章（36px）與祝福語。
- **浮現動畫：** 卡片 `card-pop`（.8s，`cubic-bezier(.16,1,.3,1)`）→ 標頭 .25s → 經文 `verse-in`（模糊 8px 到清晰、字距由 .14em 收攏，1.1s，延遲 .45s）→ 出處 1.15s → 底部 1.35s → 按鈕 1.55s。

### 祝福圖卡（1080×1920 PNG）
`app.js` 的 `buildWallpaper` 以 canvas 重畫同一個世界：`#04152b`→`#0a2d52`→`#15578a` 夜海漸層、中央金色暈光、固定種子的 46 個氣泡、底部 4 條海浪、金色雙框（3px .6／1.5px .26，40／30px 圓角）、白底 logo 卡、金色小標與 80px 奶白大標、菱形分隔、經文（依長度 62／54／48px，行高 1.75）、金框出處膠囊、白色標誌徽章、祝福語與主題經文。顏色以字面值寫死，不讀 `theme.css`。

### 夜海畫布（`ocean.js`）
- **海：** 三段漸層依進度由淺混深；頂端 14% 處破曉暈光，透明度 .13 + 進度 × .12。
- **海浪：** 7 條淡藍線（`rgba(148,204,240,.065–.11)`）往下流動。
- **氣泡：** 42 個描邊小圓（`rgba(185,224,248,.16–.48)`），往上浮、左右搖、明暗脈動。
- **航跡：** 小船後方擴散的淡白橢圓，拖動時更密。
- **魚群：** 進度過 30% 後出現 16 條金色發光魚繞船游，越深越亮。
- **下網（約 2.4 秒）：** 圓形菱格撒網張開（0–0.7s）→ 魚入網、火花（0.7–1.5s）→ 收網、大魚躍起（1.5–2.1s）→ 1.95s 觸發破曉閃光 → 2.3s 顯示經文卡。
- **破曉閃光：** 全舞台放射漸層 `#fffdf7` → `#f4d03f` → 透明，.6s 淡入到 .96。

### 划船元件
- **小船：** 木色漸層船身（`#A05A2C`→`#522911`）、金色描邊與雙槳、船頭奶白燈籠加金色光暈；整體 2.6s 輕微搖擺。
- **水深之處浮標：** 150px 圓形按鈕，慢轉的金色虛線圈（20s）、2.4s 脈動的金色核心、宋體標籤。
- **HUD 進度條：** 置中的宋體階段名（例如「深海・破浪向前」）加一條 4px 高的金色細線，不顯示百分比，避免遊戲感。
- **提示：** 金色向上雙箭頭（1.5s 上升動畫）加深藍金框提示膠囊。

### 提示與狀態
- **Toast：** 頂端置中的金色膠囊（`rgba(244,208,63,.97)` 底、深藍粗體字），由上滑入，2.4 秒後消失。
- **測試模式標示：** 頂端小紅標（`#ffd9d4` 底、`#7a1408` 字、6px 圓角）；出現時首頁與經文卡內容下移讓位。
- **圖卡預覽彈窗：** `rgba(2,10,22,.96)` 全版底，圖片最高 66dvh、18px 圓角、金框。

### 控制台（`/admin`）
沿用 `theme.css`，並在 `admin.css` 開頭以 `:root` 別名區塊把控制台的語意名稱對應到前台 token：`--depth-5` → `bg-abyss`、`--depth-4` → `bg-deep`、`--depth-2` → `#1b4f80`、`--dawn` → `gold`、`--dawn-soft` → `gold-light`、`--text`／`--paper` → `cream`、`--text-muted` → `rgba(255,253,247,.72)`、`--ink` → `bg-abyss`。控制台的版面：最寬 560px 單欄、`bg-deep` 面板 14px 圓角、76×42 開關（開啟為金色、危險開關開啟為 `#e2553f`）、金色實心按鈕 10px 圓角、測試模式警示為紅色淺底。

## Motion

- **唯一的主角時刻：** 抵達水深之處 → 水面盪開兩圈金色漣漪 → 從船邊撒網、魚群入網、收網、大魚躍起 → 「變亮」混合的奶白金光 → 經文卡從船的位置以圓形展開（1.05s）→ 金色內框淡入 → 經文由模糊對焦 → 出處 → 祝福語 → 按鈕（約 2.15s 內依序出現，使用者確認保留此節奏）。
- **畫面切換：** 離開比進來快。舊畫面 0.2s 淡出，新畫面延遲 0.14s 後 0.5s 淡入；小船跟著新畫面同時出現，打開划船畫面時從下方 48px 划進定位。
- **回饋：** 下網字幕 180ms 交叉淡換；「儲存祝福圖卡」產生中會顯示「產生圖卡中⋯」。
- **材質：** 只用 transform、opacity、clip-path 與局部模糊；不動畫 letter-spacing 或版面屬性。經文卡的外陰影放在 `.card-shell` 上，等展開結束才淡入，避免被遮罩切出硬邊。
- **減少動態（prefers-reduced-motion）：** 經文卡與內容只做 0.4s 淡入；首頁不逐項進場；小船不位移；沒有漣漪。下網的網、魚與金光保留，因為它們就是內容。

## Do's and Don'ts

### Do:
- **Do** 只用 `gold` 一族當強調色，以透明度做層次（框線 .25–.6、底色 .14–.16）。
- **Do** 把介面元件做成半透明深藍底（`rgba(3,17,34,.55–.8)`）加金色細框，浮在夜海上。
- **Do** 讓每一幕只有一個實心金色按鈕，放在拇指區。
- **Do** 經文、出處、活動名用宋體；經文卡的經文至少 16px、行高 1.66 以上。
- **Do** 換色時只改 `public/css/theme.css`，`--sea-*` 與 `--gold` 維持 `#RRGGBB`。
- **Do** 改了經文卡的配色時，同步改 `buildWallpaper` 的字面色值，讓存下的圖卡與畫面一致。
- **Do** 保留 `prefers-reduced-motion` 的處理：關掉循環動畫，經文卡浮現縮短為瞬間。

### Don't:
- **Don't** 把 logo 的粉紅、紫色用在介面上，不要把彩色 logo 直接放在深藍底上（深色畫面用白色單色版），也不要重繪 logo。
- **Don't** 從 Google Fonts 等外部來源載入字型。
- **Don't** 用 `rgb()`、`hsl()` 或三碼 hex 寫 `--sea-*`／`--gold`，canvas 會退回預設色。
- **Don't** 讓手勢成為唯一操作：小船、海面、浮標都要能點一下就自動划過去。
