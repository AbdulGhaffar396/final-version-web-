/* Shared helpers for the Vercel serverless functions (no npm packages needed). */
const crypto = require('crypto');

const KEY = 'eurowork:enquiries';
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const hasStore = () => !!(REDIS_URL && REDIS_TOKEN);

/* Run one Redis command through the Upstash REST API */
async function redis(cmd) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Redis error ' + r.status);
  return j.result;
}

const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const clientIp = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'unknown';

/* Rate limit: max `max` hits per `windowSec` per key (needs the database; skipped if none) */
async function limited(key, max, windowSec) {
  if (!hasStore()) return false;
  try {
    const k = 'eurowork:rl:' + key;
    const n = await redis(['INCR', k]);
    if (n === 1) await redis(['EXPIRE', k, String(windowSec)]);
    return n > max;
  } catch { return false; }
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let b = ''; for await (const c of req) { b += c; if (b.length > 50e3) throw new Error('too large'); }
  return JSON.parse(b);
}

const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeEq = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

module.exports = { KEY, redis, hasStore, clean, clientIp, limited, readJson, escHtml, safeEq };
