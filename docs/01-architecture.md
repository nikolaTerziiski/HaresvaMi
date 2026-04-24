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
├── CLAUDE.md
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
│   │   └── EmptyState.tsx
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
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

## Data flow — the kiosk feedback loop

```
1. Owner → /kiosk → standby screen showing restaurant logo
2. Waiter taps "Сканирай бона"
3. /kiosk/scan → camera opens
4. Photo captured → POST /api/extract-receipt
   - Server: upload image to Supabase Storage
   - Server: call Gemini with image + restaurant menu + alias dictionary
   - Server: return {items: [{menu_item_id, name, quantity}], unknown_aliases: [...]}
5. If unknown_aliases: prompt waiter to map them (one-time per alias per restaurant)
6. Customer hands tablet → /kiosk/rate
   - Shows each item with 1–10 slider
   - Optional comment per item
7. Final overall: ❤️ Харесва ми / 💔 Не ми харесва
8. Submit → POST /api/feedback
   - Creates feedback_session + feedback_ratings rows
9. /kiosk/thanks → 5 second auto-redirect to /kiosk standby
```

## Environment variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI providers
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=             # Backup / for insights later

# Stripe (Phase 2)
STRIPE_SECRET_KEY=
STRIPE_PRO_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

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
   - Base color: Neutral (we override with our coral)
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
   - Edit `app/globals.css` to add coral color palette + Manrope font
   - Edit `tailwind.config.ts` to extend theme
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
