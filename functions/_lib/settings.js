// 前台開關設定：存在 KV 的 "settings" 這個 key
export const DEFAULT_SETTINGS = {
  open: false,
  testMode: false,
  closedMessage: '禱告會倒數後開放領受經文，請稍候。',
  updatedAt: null,
  updatedBy: null
};

export const MAX_MESSAGE_LENGTH = 200;

export async function readSettings(env, { cacheTtl } = {}) {
  const opts = { type: 'json' };
  if (cacheTtl) opts.cacheTtl = cacheTtl;
  const stored = await env.SETTINGS.get('settings', opts);
  return { ...DEFAULT_SETTINGS, ...(stored || {}) };
}

export function json(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}
