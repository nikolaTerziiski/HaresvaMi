# 01 — Architecture

## Stack rationale

### Why Next.js 15 (App Router)

Familiar to the developer (KoiRaboti uses it). App Router gives us server components by default, which means less client JS, faster TTI on cheap tablets. Streaming, parallel routes, and intercepting routes are useful for the kiosk modal flow.

### Why Supabase

- Postgres (real database, not a NoSQL toy)
- Auth out of the box with email + magic link
- Storage for receipt images
- Row Level Security means we don't write a separate auth layer
- Free tier is generous enough for first 100 restaurants

### Why Gemini 2.5 Flash for receipts

- 5–10x cheaper than Claude Sonnet for vision
- Fast enough that the customer doesn't wait awkwardly (target: <3 seconds per scan)
- Good enough at structured extraction with a well-written prompt
- Bulgarian text recognition is acceptable
- **Architecture rule:** the AI provider is hidden behind a clean interface in `lib/ai/extract-receipt.ts`. Swapping providers should require zero changes elsewhere.

### Why PWA, not React Native

- No App Store / Play Store friction
- Owner adds to home screen during onboarding, looks native after
- One codebase
- Camera works fine on Android (which most cheap tablets are)
- Push notifications work on Android PWAs

### Why Stripe (deferred to Phase 2)

- Industry standard
- Bulgarian card support
- Easy to integrate with Supabase user IDs
- Subscriptions, trials, webhooks all built-in

## File structure

```
haresvami/
├── AGENTS.md
├── docs/
│   ├── 00-product.md
│   ├── 01-architecture.md
│   ├── 02-schema.md
│   ├── 03-design-system.md
│   ├── 04-business-logic.md
│   ├── 05-i18n.md
│   └── 06-deployment.md
├── app/
│   ├── layout.tsx                  # Root layout, providers
│   ├── globals.css                 # Tailwind + design tokens
│   ├── (marketing)/
│   │   ├── layout.tsx              # Public layout with header/footer
│   │   ├── page.tsx                # Landing page
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── layout.tsx              # Centered auth layout
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + main, owner-only
│   │   ├── page.tsx                # Dashboard home (insights)
│   │   ├── insights/page.tsx       # Deterministic weekly owner insights
│   │   ├── menu/
│   │   │   ├── page.tsx            # Menu list + abbreviation aliases
│   │   │   └── [id]/page.tsx       # Edit single menu item
│   │   ├── feedback/
│   │   │   ├── page.tsx            # All sessions
│   │   │   └── [id]/page.tsx       # Single session detail
│   │   ├── settings/
│   │   │   ├── page.tsx            # Restaurant info
│   │   │   └── billing/page.tsx
│   │   └── onboarding/page.tsx     # First-time wizard
│   ├── kiosk/
│   │   ├── layout.tsx              # Fullscreen, no chrome
│   │   ├── page.tsx                # Standby screen
│   │   ├── scan/page.tsx           # Camera + scan
│   │   ├── rate/page.tsx           # Customer rating form
│   │   └── thanks/page.tsx         # Thank you, auto-redirect
│   └── api/
│       ├── extract-receipt/route.ts    # POST receipt image, get items
│       ├── feedback/route.ts           # POST customer ratings
│       └── webhooks/stripe/route.ts    # Phase 2
├── components/
│   ├── ui/                         # shadcn primitives, customized
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── kiosk/
│   │   ├── StandbyScreen.tsx
│   │   ├── CameraCapture.tsx
│   │   ├── ItemRatingCard.tsx
│   │   ├── OverallRating.tsx
│   │   └── ThankYouScreen.tsx
│   ├── dashboard/
│   │   ├── InsightCard.tsx
│   │   ├── DishTrendChart.tsx
│   │   ├── FeedbackList.tsx
│   │   ├── EmptyState.tsx
│   │   └── menu/                   # Menu management components (hybrid card design)
│   │       ├── MenuSaveBanner.tsx  # Top success banner, slides in for 5 s after save
│   │       └── ...                 # State-specific components (shell, toolbar, category cards, item rows, empty state)
│   ├── menu/
│   │   ├── MenuItemForm.tsx
│   │   ├── MenuItemCard.tsx
│   │   └── AliasManager.tsx
│   └── shared/
│       ├── LanguageToggle.tsx
│       └── Logo.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server component client
│   │   ├── middleware.ts           # Auth middleware
│   │   └── types.ts                # Generated DB types
│   ├── ai/
│   │   ├── extract-receipt.ts      # The swappable AI interface
│   │   ├── providers/
│   │   │   ├── gemini.ts
│   │   │   └── claude.ts           # Backup provider
│   │   ├── prompts.ts              # Receipt extraction prompt
│   │   └── generate-insights.ts    # Plain-Bulgarian insights (Phase 3)
│   ├── menu/
│   │   └── currency.ts             # BGN↔EUR helpers at fixed 1.95583 ratio
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── messages/
│   │   │   ├── bg.json
│   │   │   └── en.json
│   │   └── request.ts
│   ├── validations/
│   │   ├── menu.ts                 # Zod schemas
│   │   ├── feedback.ts
│   │   └── auth.ts
│   └── utils/
│       ├── cn.ts                   # className merger
│       ├── format.ts               # Date, currency, number formatters
│       └── tier-limits.ts          # Free vs Pro limit checks
├── supabase/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_indexes.sql
│   └── seed.sql                    # Demo data for development
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (later)
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── images/
├── middleware.ts                   # Next.js middleware (auth)
├── next.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

## Data flow — the kiosk feedback loop

```text
1. Owner opens Dashboard -> Tablet and creates a kiosk session.
2. The setup link is `/kiosk/connect?token=ks_...`; raw tokens are shown only once.
3. `/kiosk/connect` verifies the hashed token, stores it in an HttpOnly cookie, and redirects to `/kiosk/scan`.
4. After a valid kiosk cookie exists, visiting `/` on that device redirects straight to `/kiosk/scan`.
5. `/kiosk/scan` is the full kiosk flow: staff preparation, customer rating, and thank-you reset.
6. Waiter taps "Сканирай бона" or chooses dishes manually.
7. Photo captured -> POST /api/extract-receipt
   - Server: authorize owner/kiosk session
   - Server: check scan entitlement before loading the image or calling Gemini
   - Server: call Gemini with image + restaurant menu + alias dictionary
   - Server: consume one AI scan only after successful extraction
   - Server: return {items: [{menu_item_id, name, quantity}], unknown_aliases: [...]}
8. If scan entitlement is exhausted, extraction fails, or no usable items are found: keep the kiosk in manual item selection.
9. Staff confirms selected dishes, then hands the tablet to the customer.
10. Customer rating mode uses the full tablet width and compact rows:
   - image or warm fallback on the left
   - dish name, optional description, quantity when > 1
   - 1-5 star buttons on the right
   - optional overall "Харесва ми / Не ми харесва" kept secondary
11. Submit -> POST /api/feedback
   - Creates feedback_session + feedback_ratings rows
   - Classifies sentiment; if the restaurant is Pro and the sentiment is unhappy,
     fires a fire-and-forget Telegram low-rating alert (never blocks the save)
12. Post-submit branch (Pro reputation engine only):
   - Unhappy -> on-tablet private recovery form (POST /api/feedback/recovery)
   - Happy / neutral / non-Pro -> straight to thank-you
   - The kiosk never shows a Google review link/QR (no review-gating). The Google
     QR is an owner-facing printable asset in Settings. See docs/04-business-logic.md.
13. Thank-you mode auto-resets back to the staff preparation screen after a short delay.
```

The owner dashboard shell redirects `/` to `/dashboard` when an owner session is already active. The kiosk cookie is independent from the owner session so a checkout tablet can stay in kiosk mode without showing the public landing page again.

After a new restaurant is created via `RestaurantSetupForm`, the owner is automatically forwarded to `/dashboard/menu` rather than the generic dashboard, making menu setup the first activation step.

## Notable helpers

- **`lib/billing/entitlements.ts#getVisiblePlanTier`** - Server-side helper for
  dashboard plan labels. It loads the restaurant plus active `plan_overrides`,
  applies the same entitlement rules as feature gates, and returns the effective
  `free | starter | pro` tier that UI components may render.

- **`lib/menu/currency.ts`** — BGN↔EUR conversion at the legally-mandated fixed ratio (1 EUR = 1.95583 BGN). Exports `BGN_PER_EUR`, `bgnToEur`, `formatBgn`, `formatEur`. Use this helper everywhere prices are displayed; do not redefine the constant in components.
- **`components/dashboard/menu/MenuSaveBanner.tsx`** — Client component that renders a top-of-viewport success banner after menu save. Receives a `show: boolean` prop and handles enter/exit animation internally. Uses the `banner-enter` / `banner-exit` CSS classes defined in `app/globals.css`.
- **`app/(marketing)/_components/`** — The landing page is split into route-local sections so the route stays thin while the expressive one-off marketing CSS remains colocated with the marketing route.

The `components/dashboard/menu/design-preview/` scaffolding folder and the `/dashboard/menu-preview` route were transient design exploration artifacts. Both were removed once the real hybrid-card components were integrated.

## Environment variables

`.env.example` is the canonical, committed list — copy it to `.env.local` and fill
in real values. The current set, grouped by subsystem:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server-only; bypasses RLS

# AI (Gemini does receipt + menu extraction and insight summaries)
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=             # backup provider

# Kiosk
EXTRACT_RECEIPT_RATE_LIMIT_PER_MINUTE=20

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=HaresvaMi

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Web Push (VAPID) — weekly insight notifications
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=  # must equal VAPID_PUBLIC_KEY

# Telegram alerts (Pro reputation engine — low-rating alerts)
TELEGRAM_BOT_TOKEN=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_LINK_SECRET=

# Vercel Cron — authenticates GET /api/cron/* invocations
CRON_SECRET=
```

See `docs/06-deployment.md` for how the Telegram, Push, and Cron secrets are
provisioned per environment.

## Build order (Phase 0)

When Claude Code starts Phase 0, execute in this exact order:

1. **Initialize Next.js project**

   ```
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
   ```

   - When prompted, accept all defaults except: skip ESLint setup if it's slow
   - **Verify Tailwind is v4** in `package.json`. If v3, upgrade.

2. **Install core dependencies**

   ```
   npm install @supabase/supabase-js @supabase/ssr
   npm install react-hook-form @hookform/resolvers zod
   npm install next-intl
   npm install @google/generative-ai
   npm install lucide-react
   npm install clsx tailwind-merge
   ```

3. **Install shadcn/ui base**

   ```
   npx shadcn@latest init
   ```

   - Style: New York
   - Base color: Neutral (we map shadcn semantic tokens onto HaresvaMi colors)
   - CSS variables: Yes

4. **Add initial shadcn components**

   ```
   npx shadcn@latest add button input card label dialog form
   ```

5. **Set up Supabase locally** (the developer creates the project on supabase.com)
   - Create project at supabase.com (region: Frankfurt for BG users)
   - Copy URL + anon key + service role key into `.env.local`
   - Install Supabase CLI for migrations: `npm install -D supabase`

6. **Create Supabase client files**
   - `lib/supabase/client.ts` (browser)
   - `lib/supabase/server.ts` (server components)
   - `lib/supabase/middleware.ts` (middleware helper)

7. **Set up middleware** at project root for auth session refresh

8. **Configure design tokens**
   - Use `app/globals.css` as the source of truth for Tailwind v4 `@theme` tokens, shadcn semantic tokens, and the mehana page tokens (`--bg`, `--paper`, `--ink`, `--accent`)
   - Keep brand terracotta at `--accent: #c24d2c`; do not introduce a second brand hex in components
   - Register fonts in `app/layout.tsx` with `next/font`: Instrument Serif for display, Inter for UI, JetBrains Mono for mono
   - There is no `tailwind.config.ts` in the current Tailwind v4 setup
   - Reference `docs/03-design-system.md` for exact values

9. **Set up i18n**
   - Create `lib/i18n/config.ts` with BG default, EN secondary
   - Create empty `bg.json` and `en.json` message files
   - Configure `next.config.ts` for next-intl

10. **Create database migrations**
    - Write `supabase/migrations/0001_initial_schema.sql` per `docs/02-schema.md`
    - Write `supabase/migrations/0002_rls_policies.sql`
    - Write `supabase/migrations/0003_indexes.sql`
    - Apply via Supabase dashboard SQL editor (developer does this manually for v1)

11. **Generate TypeScript types from Supabase**

    ```
    npx supabase gen types typescript --project-id YOUR_REF > lib/supabase/types.ts
    ```

12. **Set up PWA manifest**
    - Create `public/manifest.json`
    - Add `<link rel="manifest">` to root layout

13. **First commit**
    ```
    git add . && git commit -m "Phase 0: project scaffold complete"
    ```

When all steps are done, the developer runs `npm run dev`, sees the default Next.js page with custom Tailwind colors applied, and Phase 0 is complete.

## Phase 1 build order (after Phase 0 confirmed)

1. Auth pages (login, register, password reset)
2. Auth middleware enforcing protected routes
3. Dashboard shell layout (sidebar, header, empty state)
4. Onboarding wizard (4 steps: restaurant info → menu placeholder → kiosk test → done)
5. Restaurant settings page
6. Logout

## Phase 2 — Menu & Kiosk

1. Menu CRUD pages
2. Menu item image upload to Supabase Storage
3. Receipt alias manager UI
4. Kiosk standby screen
5. Camera capture component
6. Receipt extraction API route + Gemini integration
7. Customer rating form (per-item + overall)
8. Feedback submission API route
9. Thank you screen + auto-reset

## Phase 3 — Insights & Polish

1. Dashboard charts (per-dish trends)
2. Plain-Bulgarian AI insights generator
3. Push notification setup
4. Landing page polish
5. Pricing page
6. Stripe integration (subscription + trial)
7. Tier limit enforcement
8. PWA install prompts

## Phase 4 — Launch prep

1. Real restaurant beta test (1 venue)
2. Bug fixes from beta
3. Production deployment to Vercel
4. Domain setup (haresva.mi or haresvami.bg)
5. Onboarding email sequence
6. Public launch
