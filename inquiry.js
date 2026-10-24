/* POST /api/inquiry — validates a form, stores it (Upstash Redis) and sends instant alerts (Telegram / webhook). */
const crypto = require('crypto');
const { KEY, redis, hasStore, clean, clientIp, limited, readJson } = require('./_lib');

async function notify(s) {
  const text = `📩 New ${s.type} enquiry\n${s.name} (${s.nationality}) • WhatsApp ${s.whatsapp}${s.email ? '\n✉️ ' + s.email : ''}\n${s.profession}, ${s.experience || '?'} yrs → ${s.preferredCountry || 'any'}\nFrom: ${s.currentCountry}\n${s.message || ''}`;
  const jobs = [];
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) jobs.push(fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat, text })
  }).then(r => { if (!r.ok) throw new Error('telegram ' + r.status); }));
  const hook = process.env.NOTIFY_WEBHOOK_URL;
  if (hook) jobs.push(fetch(hook, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, content: text })
  }).then(r => { if (!r.ok) throw new Error('webhook ' + r.status); }));
  const res = await Promise.allSettled(jobs);
  res.forEach(r => r.status === 'rejected' && console.error('notify failed:', r.reason && r.reason.message));
  return res.some(r => r.status === 'fulfilled');
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const ip = clientIp(req);
  if (await limited('i:' + ip, 8, 3600)) return res.status(429).json({ error: 'Too many requests. Please try again later or contact us on WhatsApp.' });

  let d; try { d = await readJson(req); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  if (d.website) return res.status(200).json({ ok: true }); // honeypot: pretend success

  const s = {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(),
    type: ['visa', 'contact', 'inquiry'].includes(d.type) ? d.type : 'inquiry',
    name: clean(d.name, 100), whatsapp: clean(d.whatsapp, 30), email: clean(d.email, 120),
    nationality: clean(d.nationality, 60), currentCountry: clean(d.currentCountry, 60),
    preferredCountry: clean(d.preferredCountry, 60), profession: clean(d.profession, 80),
    experience: clean(d.experience, 3), message: clean(d.message, 2000), ip
  };
  if (!s.name || !s.whatsapp || !s.nationality || !s.currentCountry || !s.profession || d.consent !== true)
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  if (!/^[+\d][\d\s().-]{5,}$/.test(s.whatsapp)) return res.status(400).json({ error: 'Please enter a valid WhatsApp number.' });
  if (s.email && !/^\S+@\S+\.\S+$/.test(s.email)) return res.status(400).json({ error: 'Please enter a valid email.' });

  let stored = false;
  if (hasStore()) { try { await redis(['LPUSH', KEY, JSON.stringify(s)]); stored = true; } catch (e) { console.error('store failed:', e.message); } }
  const alerted = await notify(s);

  if (!stored && !alerted) return res.status(503).json({ error: 'Could not save your request right now. Please contact us on WhatsApp.' });
  res.status(200).json({ ok: true });
};
