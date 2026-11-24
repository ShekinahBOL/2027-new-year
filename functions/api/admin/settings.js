// 控制台：GET 讀取目前設定，PUT 更新設定
import { readSettings, json, MAX_MESSAGE_LENGTH } from '../../_lib/settings.js';

export async function onRequestGet({ env, data }) {
  const s = await readSettings(env); // 控制台不走快取，看到的是最新寫入的值
  return json({ settings: s, user: data.user }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestPut({ request, env, data }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: '資料格式錯誤' }, { status: 400 });
  }

  const current = await readSettings(env);
  const next = { ...current };

  if ('open' in body) {
    if (typeof body.open !== 'boolean') return json({ error: 'open 必須是 true 或 false' }, { status: 400 });
    next.open = body.open;
  }
  if ('testMode' in body) {
    if (typeof body.testMode !== 'boolean') return json({ error: 'testMode 必須是 true 或 false' }, { status: 400 });
    next.testMode = body.testMode;
  }
  if ('closedMessage' in body) {
    if (typeof body.closedMessage !== 'string') return json({ error: '關閉文字格式錯誤' }, { status: 400 });
    const msg = body.closedMessage.trim();
    if (msg.length > MAX_MESSAGE_LENGTH) return json({ error: `關閉文字最多 ${MAX_MESSAGE_LENGTH} 字` }, { status: 400 });
    next.closedMessage = msg;
  }

  next.updatedAt = new Date().toISOString();
  next.updatedBy = data.user;
  await env.SETTINGS.put('settings', JSON.stringify(next));
  return json({ settings: next, user: data.user }, { headers: { 'Cache-Control': 'no-store' } });
}
