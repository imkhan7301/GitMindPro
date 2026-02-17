# Ship GitMind Pro to `gitmindpro.com`

This checklist gets the app from repo to live production on Vercel with your custom domain.

## 1) Pre-ship checks

```bash
npm install
npm run check
npm run build
```

If `npm run check` fails, fix blocking lint/type issues before shipping.

## 2) Create/link Vercel project

From repo root:

```bash
npm install -g vercel
vercel login
vercel link
```

When prompted:
- Scope: your personal/team scope
- Link to existing project: **No** (if first deploy)
- Project name: `gitmindpro`

This creates `.vercel/project.json` locally (ignored by `.gitignore`).

## 3) Set production environment variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

### Required
- `VITE_GEMINI_API_KEY`

### Recommended
- `VITE_GITHUB_TOKEN`
- `VITE_ENABLE_ANALYTICS` (`true` in production)

Then pull envs locally (optional):

```bash
vercel env pull .env.local
```

## 4) Deploy to production

```bash
vercel --prod
```

Vercel uses `vercel.json`:
- Build command: `npm run build`
- Output directory: `dist`
- SPA rewrites + security headers

## 5) Connect `gitmindpro.com`

In **Vercel Dashboard → Project → Settings → Domains**:
1. Add `gitmindpro.com`
2. Add `www.gitmindpro.com`
3. Set `gitmindpro.com` as **Primary Domain**

## 6) Configure DNS at your registrar

Use the DNS records shown by Vercel. Typical setup:

- Apex record (`@`): `A` → `76.76.21.21`
- `www`: `CNAME` → `cname.vercel-dns.com`

If your registrar supports ALIAS/ANAME for apex, use Vercel’s recommended value in dashboard.

## 7) SSL + redirect checks

After DNS propagates, verify:
- `https://gitmindpro.com` loads
- `https://www.gitmindpro.com` redirects to primary domain
- SSL certificate status is **Valid** in Vercel

## 8) Optional: GitHub auto-deploy

To auto-ship on push to `main`, import this repo in Vercel and connect GitHub.
Every push to `main` triggers production deploy.

---

## Fast rollback

In Vercel Dashboard:
1. Open **Deployments**
2. Pick last healthy deployment
3. Click **Promote to Production**

---

## Final go-live smoke test

- Analyze 1 public GitHub repo in the app
- Confirm Gemini calls return data
- Confirm no console errors in browser
- Confirm Lighthouse/Performance basics are acceptable
