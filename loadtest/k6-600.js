/*
  壓力測試：模擬 600 人在 1 分鐘內湧入（現場掃 QR Code 的情境）
  執行：k6 run -e BASE_URL=https://你的專案.pages.dev loadtest/k6-600.js

  每個虛擬使用者做的事和真人一樣：
    1. 打開首頁，載入 CSS / JS / 字型 / logo / 經文 JSON
    2. 讀取 /api/status
    3. 停留幾秒後抽經文：下載那一則的字型檔
    4. 有 1/3 的人停在「尚未開放」畫面，每 20 秒檢查一次狀態，共 3 次
*/
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:8788').replace(/\/$/, '');

const pageLoad = new Trend('page_load_ms', true);
const statusLatency = new Trend('status_ms', true);
const failures = new Rate('failed_requests');

export const options = {
  scenarios: {
    rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '60s', target: 600 }, // 1 分鐘內 600 人進來
        { duration: '60s', target: 600 }, // 600 人同時停留
        { duration: '15s', target: 0 }
      ],
      gracefulRampDown: '10s'
    }
  },
  thresholds: {
    failed_requests: ['rate<0.01'],          // 失敗率低於 1%
    page_load_ms: ['p(95)<3000'],            // 95% 的人 3 秒內載完首頁
    status_ms: ['p(95)<800'],                // 開關 API 95% 低於 0.8 秒
    http_req_duration: ['p(95)<1500']
  }
};

const ASSETS = [
  '/css/theme.css', '/css/app.css', '/js/chart.js', '/js/app.js',
  '/config/verses.json', '/fonts/ui-600.woff2', '/fonts/ui-900.woff2',
  '/assets/logo-full.png', '/assets/logo-mark.png', '/favicon.png'
];

function get(path, tags) {
  const res = http.get(BASE + path, { tags: tags || { name: path } });
  failures.add(res.status >= 400 || res.status === 0);
  return res;
}

export default function () {
  const t0 = Date.now();
  const home = get('/', { name: 'home' });
  check(home, { 'home 200': (r) => r.status === 200 });
  const batch = http.batch(ASSETS.map((p) => ['GET', BASE + p, null, { tags: { name: 'asset' } }]));
  batch.forEach((r) => failures.add(r.status >= 400 || r.status === 0));
  pageLoad.add(Date.now() - t0);

  const st = get('/api/status', { name: 'status' });
  statusLatency.add(st.timings.duration);
  check(st, { 'status ok': (r) => r.status === 200 });

  if (__VU % 3 === 0) {
    // 在等待畫面輪詢
    for (let i = 0; i < 3; i++) {
      sleep(20 + Math.random() * 3);
      const s = get('/api/status', { name: 'status' });
      statusLatency.add(s.timings.duration);
    }
  } else {
    sleep(3 + Math.random() * 10);
    const id = String(1 + Math.floor(Math.random() * 96)).padStart(3, '0');
    get(`/fonts/v/${id}.woff2`, { name: 'verse-font' });
  }
  sleep(30 + Math.random() * 30);
}
