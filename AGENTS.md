# HaresvaMi — Master Context

> **Every AI agent session must read this file first, then read the relevant `docs/*.md` files.**

## What is HaresvaMi?

HaresvaMi (Харесва ми) is a tablet-based customer feedback platform for Bulgarian restaurants. The owner places a tablet at the checkout. When a customer pays, the waiter scans the receipt with the tablet camera. AI extracts the items the customer ordered, then presents the customer with a per-item rating screen plus a final binary "Харесва ми / Не ми харесва" question.

The product name is the final UX moment. Every other word in the app should reinforce that the customer is *telling the restaurant what they liked*.

## Target user

Bulgarian restaurant owners, primarily small to mid-size establishments (20–80 seats). They likely have an unused Android tablet or phone. They speak Bulgarian as a first language. They are not technical. They want simple, actionable insights — not charts and analytics dashboards.

## Core value proposition

Per-item feedback at the moment of payment. Owners learn *which dish* customers actually like or dislike, not just "how was your visit." This is fundamentally different from generic feedback tools (Zonka, SurveyStance, etc.) which only capture overall experience.

## Tech stack (locked)

- **Frontend:** Next.js 15 (App Router) + Tailwind CSS v4
- **Backend:** Supabase (Postgres + Auth + Storage + Row Level Security)
- **AI vision (receipt extraction):** Google Gemini 2.5 Flash (cheap, fast, swappable)
- **AI insights (plain Bulgarian):** Claude Sonnet (later phase)
- **Payments:** Stripe (Phase 2)
- **Hosting:** Vercel
- **PWA:** Manual manifest + service worker
- **i18n:** next-intl (BG default, EN optional for owners and customers)
- **Forms:** react-hook-form + zod
- **UI base:** shadcn/ui — heavily customized to avoid generic SaaS look

## Brand

- **Name:** HaresvaMi (брендмарк: `Haresva.mi` or `HaresvaMi`)
- **Primary color:** Terracotta `#C24D2C`
- **Tone:** Warm, human, Bulgarian. Never corporate. Never translated-sounding.
- **Typography:** Instrument Serif (display) + Inter (UI) + JetBrains Mono (mono)

## Documentation map

Read these in order when starting fresh:

1. **`docs/00-product.md`** — Product vision, user personas, business model
2. **`docs/01-architecture.md`** — Stack rationale, file structure, build order
3. **`docs/02-schema.md`** — Database tables, RLS policies, indexes
4. **`docs/03-design-system.md`** — Colors, typography, spacing, component patterns
5. **`docs/04-business-logic.md`** — Tier limits, receipt parsing, AI prompts
6. **`docs/05-i18n.md`** — Translation strategy, key naming conventions
7. **`docs/06-deployment.md`** — Vercel setup, env vars, Supabase project setup

## Working principles

### How to write code in this project

1. **Bulgarian first.** All user-facing strings start in Bulgarian. English is added through i18n keys, never as the primary text.
2. **No generic SaaS aesthetics.** No purple gradients. No "Welcome to [App]" hero. No 4-stat-card dashboards. Read `docs/03-design-system.md` before any UI work.
3. **Mobile/tablet first.** The kiosk screen is the most important UI. Design for a 10-inch Android tablet held in landscape.
4. **AI provider is swappable.** Receipt extraction lives in `lib/ai/extract-receipt.ts` with a clean interface. Currently Gemini 2.5 Flash. Could become Claude or GPT-4o later. Never hard-code provider details outside that file.
5. **RLS everywhere.** Every Supabase table has Row Level Security policies. No exceptions.
6. **Server components by default.** Client components only when interactivity is required.
7. **Forms with react-hook-form + zod.** No raw `useState` form management.
8. **One commit per logical change.** Small, atomic, well-described commits.

### Developer preferences

The developer is building solo on a Windows machine. When working on this project:
- Give direct, honest pushback when ideas have problems
- Provide clear next steps, never vague suggestions
- Apply Bulgarian-aware UX thinking (don't suggest patterns that won't land with BG users)
- No over-engineering. MVP first, scale later.
- When uncertain, ask one focused question rather than several vague ones.

### What NOT to do

- Don't add features that aren't in `docs/01-architecture.md` build order without asking
- Don't add npm packages without justifying why a built-in solution wouldn't work
- Don't write tests in the MVP phase unless explicitly asked
- Don't add analytics, error tracking, or monitoring tools until launch
- Don't write English-first copy and translate to Bulgarian — write Bulgarian first
- Don't use Lucide icons everywhere by default — they make everything look the same

## Current phase

**Phase 1: Auth + Onboarding.** Phase 0 (foundation) is complete. Now building:
- Auth logic wired to Supabase (login, register, password reset)
- Auth middleware enforcing protected routes
- Dashboard shell layout
- Onboarding wizard (restaurant info → menu placeholder → kiosk test → done)
- Restaurant settings + logout

## Quick reference

- Brand color: `#C24D2C` (terracotta)
- Default language: `bg`
- Free tier limit: 50 feedback responses per month
- Pro tier price: €10/month (configurable)
- Trial duration: 14 days
- Receipt AI provider: Gemini 2.5 Flash
- Database: Postgres via Supabase
