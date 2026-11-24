// 前台讀取開關：GET /api/status
// KV 讀取在邊緣快取 30 秒，600 人同時進來實際只會讀到 KV 少數幾次。
import { readSettings, json } from '../_lib/settings.js';

export async function onRequestGet({ env }) {
  try {
    const s = await readSettings(env, { cacheTtl: 30 });
    return json(
      { open: s.open, testMode: s.testMode, closedMessage: s.open ? '' : s.closedMessage },
      { headers: { 'Cache-Control': 'public, max-age=10' } }
    );
  } catch (err) {
    // 讓前台走「讀不到就當作開放」的路
    return json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
