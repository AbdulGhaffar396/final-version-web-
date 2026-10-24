# EuroWork Hub

Static website (`public/`) + Vercel serverless functions (`api/`) for the enquiry forms and the `/admin` dashboard.
`server.js` is kept only for running the site locally or on a Docker/Node host.

## 1. Add your contact links (2 minutes)
Edit `public/config.js` → `social` and paste your links. The side "Contact us" button, the CTA buttons, the Contact page and the footer all update automatically.

| Field | Example |
|---|---|
| whatsapp | `https://wa.me/381600000000` (number with country code, digits only) |
| telegram | `https://t.me/yourusername` |
| viber | `viber://chat?number=%2B381600000000` |
| messenger | `https://m.me/yourpagename` |
| email / phoneDisplay | `info@yourdomain.com` / `+381 60 000 0000` |

Empty links send visitors to the Contact page, so nothing is ever broken.

## 2. Put it on GitHub
```bash
cd eurowork
git init -b main
git add .
git commit -m "EuroWork Hub"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR-USER/eurowork-hub.git
git push -u origin main
```

## 3. Go live on Vercel
1. vercel.com → **Add New → Project** → import the GitHub repo. Framework preset: **Other**. Leave build settings as they are (`vercel.json` handles them). Click **Deploy**.
2. **Settings → Environment Variables**, add `ADMIN_PASSWORD` (required for `/admin`) and optionally `ADMIN_USER`.
3. **Storage → Create Database → Upstash Redis**, connect it to the project. This is where enquiries are saved (Vercel can't write files). Without it, forms only work if a notification channel below is set.
4. Instant alerts (recommended): add `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` (bot from @BotFather), or `NOTIFY_WEBHOOK_URL`.
5. **Redeploy** (Deployments → ⋯ → Redeploy) so the variables take effect.
6. Domain: **Settings → Domains**. Then replace `YOUR-DOMAIN.com` in `public/robots.txt` and `public/sitemap.xml`, and make the `og:image` in `public/index.html` an absolute URL (`https://YOUR-DOMAIN.com/images/team.webp`).

Dashboard: `https://YOUR-DOMAIN.com/admin` (user `admin`). Test a form submission after step 5.

## Run locally
```bash
ADMIN_PASSWORD=choose-a-password node server.js     # http://localhost:3000
```

## Edit content
Country text, categories, FAQs, documents: `public/data.js` · Slider and contact widget text: `public/config.js`.

## Before launch
- Have the Privacy Policy and Terms reviewed (GDPR etc.).
- Recruitment/placement agencies are licensed in many countries; make sure you hold any required licence and keep the "no guarantee" wording.
- Keep country/visa information current and link to official sources.
