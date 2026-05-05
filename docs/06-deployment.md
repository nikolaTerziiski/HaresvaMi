# 06 — Deployment

## Environments

### Local development

- Next.js dev server: `npm run dev` → `http://localhost:3000`
- Supabase: hosted project (free tier on supabase.com), no local Postgres needed
- Stripe: test mode keys

### Production

- Hosting: Vercel (free Hobby tier sufficient for first ~50 restaurants)
- Database: Supabase Pro tier (€25/month, after we have paying users)
- Domain: TBD — preferred options: `haresva.mi`, `haresvami.bg`, `haresvami.com`
- Email: Resend or Postmark for transactional emails

## Initial setup steps (do these once)

### 1. Create Supabase project

1. Go to supabase.com → New Project
2. **Region: `eu-central-1` (Frankfurt)** — closest to BG users, GDPR-friendly
3. Strong DB password, save in password manager
4. Project name: `haresvami-prod` (later create `haresvami-dev` if needed)
5. Wait for provisioning (~2 min)
6. Copy from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (NEVER commit, server-only)

### 2. Apply database migrations

In Supabase dashboard → SQL Editor → run each migration file in order:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_indexes_and_triggers.sql`

Verify tables exist in Table Editor.

### 3. Create storage buckets

In Supabase dashboard → Storage → New bucket:

**`menu-images`**

- Public: ✅ Yes
- File size limit: 5 MB
- Allowed MIME: `image/jpeg, image/png, image/webp`

**`receipt-images`**

- Public: ❌ No
- File size limit: 5 MB
- Allowed MIME: `image/jpeg, image/png`

**`restaurant-logos`**

- Public: ✅ Yes
- File size limit: 2 MB
- Allowed MIME: `image/jpeg, image/png, image/svg+xml`

### 4. Configure auth

In Supabase dashboard → Authentication → Providers:

- Enable **Email** provider
- Enable **Magic Link** option (for passwordless login)
- Configure email templates in Bulgarian (Authentication → Email Templates)

In Authentication → URL Configuration:

- Site URL: production URL when deployed, `http://localhost:3000` for now
- Redirect URLs: add both prod and local

### 5. Get Gemini API key

1. Go to ai.google.dev → Get API key
2. Create new project: "haresvami"
3. Generate key → save as `GOOGLE_GEMINI_API_KEY`
4. Set up billing alerts at €10/month threshold

### 6. Get Stripe keys (Phase 2)

1. Stripe.com → Create account → Bulgaria
2. Activate account (requires business details)
3. Test mode → Developers → API keys
4. Copy `Publishable key` and `Secret key`
5. Products -> create the Pro monthly subscription price and copy its `price_...` id
6. Set up webhook endpoint after deploy: `https://haresva.mi/api/webhooks/stripe`
7. Copy webhook signing secret

### 7. Local env file

Create `.env.local` (NEVER commit):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AI
GOOGLE_GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# Kiosk security
EXTRACT_RECEIPT_RATE_LIMIT_PER_MINUTE=20

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=HaresvaMi

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Create `.env.example` (commit this) with same keys but empty values.

## Deployment to Vercel

### First deploy

1. Push code to GitHub repo (private for now)
2. Vercel.com → Add New → Project → Import from GitHub
3. Framework: Next.js (auto-detected)
4. Build command: `next build` (default)
5. **Add all env vars** from `.env.local` to Vercel project settings
6. Deploy
7. Once deployed, copy the `*.vercel.app` URL
8. Update Supabase Auth → Site URL to this Vercel URL
9. Set `NEXT_PUBLIC_APP_URL` env var to this URL

### Custom domain

After domain purchase:

1. Vercel → Project → Settings → Domains → Add `haresva.mi`
2. Configure DNS at registrar (CNAME or A record per Vercel instructions)
3. Wait for SSL provisioning (~5 min)
4. Update Supabase auth Site URL to `https://haresva.mi`
5. Update `NEXT_PUBLIC_APP_URL` env var
6. Redeploy

### Production checklist

Before announcing publicly:

- [ ] All env vars set in Vercel (production environment)
- [ ] Supabase migrations applied to prod project
- [ ] Storage buckets created and configured
- [ ] RLS policies tested (try to query another restaurant's data)
- [ ] Auth emails sent in Bulgarian
- [ ] Custom domain working with HTTPS
- [ ] Tested receipt scan flow end-to-end on a real Android tablet
- [ ] PWA installable on Android (test "Add to Home Screen")
- [ ] Stripe in live mode with real product/price IDs
- [ ] Webhook endpoint confirmed receiving events
- [ ] Email transactional service connected (Resend/Postmark)
- [ ] Privacy policy and terms pages published (Bulgarian + English)
- [ ] GDPR-compliant cookie banner
- [ ] Legal: data processing agreement template ready for restaurant owners

## Monitoring

### Phase 1 (free tools, sufficient for first 50 restaurants)

- Vercel Analytics (built-in)
- Supabase logs (built-in)
- Manual dashboard check daily

### Phase 2 (when paying)

- Sentry for error tracking
- PostHog for product analytics
- Better Stack for uptime monitoring

## Backup strategy

- Supabase auto-backs up daily on Pro tier
- Manual export of `restaurants`, `menu_items`, `receipt_aliases` weekly
- Receipt images: NOT backed up (regeneratable / not critical, customer privacy benefit)

## Cost projections

### Month 1 (0–10 paying)

- Vercel: €0 (Hobby tier)
- Supabase: €0 (Free tier)
- Gemini: ~€1
- Domain: €15/year
- **Total: ~€2/month**

### Month 6 (50 paying)

- Vercel: €0 (still under limits)
- Supabase: €25 (Pro tier needed for backups + more bandwidth)
- Gemini: ~€20
- Email service: €10
- **Total: ~€55/month**
- **Revenue at 50 × €10 = €500/month**
- **Margin: ~€445**

### Month 12 (200 paying)

- Vercel: €20 (Pro tier likely)
- Supabase: €25 (still Pro tier sufficient)
- Gemini: ~€80
- Email: €15
- Stripe fees: ~€60
- **Total: ~€200/month**
- **Revenue at 200 × €10 = €2000/month**
- **Margin: ~€1800**

These are rough estimates. Update after first month of real data.

## Disaster recovery

### If Supabase goes down

- Display maintenance page on kiosk
- Cache restaurant menu in the browser on the connected tablet (so kiosk can show standby + last known menu)
- Receipt scans queue locally, sync when back online

### If Gemini API fails

- Fallback to manual item selection automatically
- Surface "AI temporarily unavailable, choose items manually" message
- Don't charge it against any usage counter

### If Vercel goes down

- Statuspage.com link in our marketing site (subdomain on different host)
- Email notification to all owners with ETA

## Security

- All secrets in environment variables, never in code
- `SUPABASE_SERVICE_ROLE_KEY` only used in server-side API routes, never exposed to client
- All API routes validate auth via Supabase server client
- RLS as second layer of defense (defense in depth)
- Receipt images deleted after 90 days (privacy + storage cost)
- HTTPS everywhere (enforced by Vercel)
- Content Security Policy headers (configure in `next.config.ts`)
- Rate limiting on AI endpoints (use Upstash Ratelimit or Vercel KV)

## Legal

Things to set up before public launch:

1. **Privacy policy** — must comply with GDPR (covers EU including Bulgaria)
2. **Terms of service** — clear about subscription, cancellation, refunds
3. **Cookie policy** — banner with consent before non-essential cookies
4. **Data Processing Agreement (DPA)** template for restaurants (we process their customer feedback data)
5. **Bulgarian VAT registration** — required if you exceed BGN 50,000 annual revenue (~€25,000)
6. **Company registration** — recommended to register an EOOD or operate as freelancer (свободна професия)

Consult a Bulgarian accountant before launch. This is not legal advice.
