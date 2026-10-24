/* /admin, /admin/export.csv, POST /admin/delete — password protected (ADMIN_PASSWORD env var). */
const { KEY, redis, hasStore, limited, clientIp, escHtml: h, safeEq } = require('./_lib');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const text = (res, code, body, type = 'text/plain; charset=utf-8', extra = {}) => {
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
  res.status(code).send(body);
};

async function authed(req, res) {
  if (!ADMIN_PASSWORD) { text(res, 503, 'Admin disabled. Set the ADMIN_PASSWORD environment variable in Vercel.'); return false; }
  if (await limited('a:' + clientIp(req), 30, 600)) { text(res, 429, 'Too many attempts'); return false; }
  const hd = req.headers.authorization || '';
  const [u, ...p] = Buffer.from(hd.replace(/^Basic /, ''), 'base64').toString().split(':');
  if (hd.startsWith('Basic ') && safeEq(u || '', ADMIN_USER) && safeEq(p.join(':'), ADMIN_PASSWORD)) return true;
  text(res, 401, 'Authentication required', 'text/plain; charset=utf-8', { 'WWW-Authenticate': 'Basic realm="EuroWork Admin", charset="UTF-8"' });
  return false;
}

async function load() {
  if (!hasStore()) return [];
  const raw = await redis(['LRANGE', KEY, '0', '-1']);
  return (raw || []).map(r => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);
}

function page(rows) {
  const notice = hasStore() ? '' : '<p style="background:#fff8e6;border:1px solid #f2dca0;padding:12px 16px;border-radius:10px;margin:0 0 16px">⚠️ No database connected, so enquiries are not being stored. In Vercel: <b>Storage → Create Database → Upstash Redis</b> and connect it to this project, then redeploy.</p>';
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>Admin — EuroWork Hub</title>
<style>body{font-family:system-ui;margin:0;background:#f4f6fb;color:#1b2437}header{background:#0b1f4d;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}a.b,button{background:#1f5fd6;color:#fff;border:0;border-radius:8px;padding:8px 14px;text-decoration:none;cursor:pointer;font:inherit}button.d{background:#c0392b}main{padding:20px;overflow:auto}table{border-collapse:collapse;width:100%;background:#fff;border-radius:10px;overflow:hidden;font-size:14px}th,td{padding:10px 12px;border-bottom:1px solid #e5eaf4;text-align:left;vertical-align:top}th{background:#eaf0ff}.t{background:#eaf0ff;border-radius:99px;padding:2px 10px;font-size:12px}</style>
<header><b>📩 Enquiries (${rows.length})</b><span><a class=b href="/admin/export.csv">Export CSV</a></span></header><main>${notice}
<table><tr><th>Date</th><th>Type</th><th>Name</th><th>WhatsApp</th><th>Email</th><th>Nationality</th><th>From</th><th>Wants</th><th>Profession</th><th>Exp</th><th>Message</th><th></th></tr>
${rows.map(r => `<tr><td>${h((r.createdAt || '').replace('T', ' ').slice(0, 16))}</td><td><span class=t>${h(r.type)}</span></td><td>${h(r.name)}</td><td><a href="https://wa.me/${h(String(r.whatsapp).replace(/\D/g, ''))}" target=_blank rel=noopener>${h(r.whatsapp)}</a></td><td>${h(r.email)}</td><td>${h(r.nationality)}</td><td>${h(r.currentCountry)}</td><td>${h(r.preferredCountry)}</td><td>${h(r.profession)}</td><td>${h(r.experience)}</td><td>${h(r.message)}</td><td><form method=post action="/admin/delete" onsubmit="return confirm('Delete this enquiry?')"><input type=hidden name=id value="${h(r.id)}"><button class=d>Delete</button></form></td></tr>`).join('') || '<tr><td colspan=12>No enquiries yet.</td></tr>'}
</table></main>`;
}

function csv(rows) {
  const cols = ['createdAt', 'type', 'name', 'whatsapp', 'email', 'nationality', 'currentCountry', 'preferredCountry', 'profession', 'experience', 'message'];
  const q = (v, c) => { v = String(v == null ? '' : v); if (/^[=\-@]/.test(v) || (c !== 'whatsapp' && v[0] === '+')) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
  return '\ufeff' + cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c], c)).join(',')).join('\n');
}

module.exports = async (req, res) => {
  if (!(await authed(req, res))) return;
  const action = String(req.query.a || 'page');
  try {
    if (action === 'delete' && req.method === 'POST') {
      let body = req.body;
      if (body && typeof body === 'object') body = new URLSearchParams(body).toString();
      const id = new URLSearchParams(String(body || '')).get('id');
      if (id && hasStore()) {
        const raw = await redis(['LRANGE', KEY, '0', '-1']);
        const hit = (raw || []).find(r => { try { return JSON.parse(r).id === id; } catch { return false; } });
        if (hit) await redis(['LREM', KEY, '1', hit]);
      }
      res.setHeader('Location', '/admin'); return res.status(303).end();
    }
    const rows = await load();
    if (action === 'csv') return text(res, 200, csv(rows), 'text/csv; charset=utf-8', { 'Content-Disposition': 'attachment; filename="enquiries.csv"' });
    return text(res, 200, page(rows), 'text/html; charset=utf-8', {
      'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'"
    });
  } catch (e) { console.error(e); return text(res, 500, 'Server error'); }
};
