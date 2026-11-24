// /api/admin/* 一律要通過 Cloudflare Access：
// Access 擋在最前面，這裡再驗證一次 Access 簽發的 JWT，避免某個網域漏設 Access 時被直接呼叫。
import { json } from '../../_lib/settings.js';

const certCache = { keys: null, fetchedAt: 0 };

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getKeys(teamDomain) {
  if (certCache.keys && Date.now() - certCache.fetchedAt < 10 * 60 * 1000) return certCache.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs ' + res.status);
  const { keys } = await res.json();
  certCache.keys = keys;
  certCache.fetchedAt = Date.now();
  return keys;
}

async function verifyAccessJwt(token, env) {
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) throw new Error('malformed');
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)));
  const keys = await getKeys(env.ACCESS_TEAM_DOMAIN);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('bad signature');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('expired');
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) throw new Error('wrong audience');
  if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) throw new Error('wrong issuer');
  return payload;
}

export async function onRequest(context) {
  const { request, env } = context;

  // 只在本機開發（.dev.vars）時允許略過
  if (env.DEV_BYPASS_ACCESS === 'true') {
    context.data.user = 'local-dev';
    return context.next();
  }

  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) {
    return json({ error: '控制台尚未設定 Cloudflare Access（缺少 ACCESS_AUD 或 ACCESS_TEAM_DOMAIN）' }, { status: 500 });
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return json({ error: '請先透過 Cloudflare Access 登入' }, { status: 401 });

  try {
    const payload = await verifyAccessJwt(token, env);
    context.data.user = payload.email || payload.sub || 'unknown';
  } catch (err) {
    return json({ error: '登入驗證失敗，請重新整理後再登入' }, { status: 403 });
  }
  return context.next();
}
