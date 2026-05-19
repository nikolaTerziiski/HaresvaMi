# HaresvaMi — Master Context

> **Every AI agent session must read this file first, then read the relevant `docs/*.md` files.**

## What is HaresvaMi?

HaresvaMi (Харесва ми) is a tablet-based customer feedback platform for Bulgarian restaurants. The owner places a tablet at the checkout. When a customer pays, the waiter scans the receipt with the tablet camera. AI extracts the items the customer ordered, then presents the customer with a per-item rating screen plus a final binary "Харесва ми / Не ми харесва" question.

The product name is the final UX moment. Every other word in the app should reinforce that the customer is _telling the restaurant what they liked_.

## Target user

Bulgarian restaurant owners, primarily small to mid-size establishments (20–80 seats). They likely have an unused Android tablet or phone. They speak Bulgarian as a first language. They are not technical. They want simple, actionable insights — not charts and analytics dashboards.

## Core value proposition

Per-item feedback at the moment of payment. Owners learn _which dish_ customers actually like or dislike, not just "how was your visit." This is fundamentally different from generic feedback tools (Zonka, SurveyStance, etc.) which only capture overall experience.

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

## Billing and AI usage rules

- Never implement "unlimited" AI scans in code.
- Paid plans should use explicit numeric limits.
- All feature limits must be enforced server-side.
- UI can hide or disable features, but API routes must make the final decision.
- Do not call Gemini before checking scan entitlement.
- Do not consume an AI scan credit until the AI extraction succeeds.
- Failed AI calls should be logged but should not consume customer credits.
- Always log model name, input tokens, output tokens, total tokens, success/failure, and estimated cost for AI calls.
- Do not store full receipt images permanently unless explicitly required.
- If receipt images are stored for debugging, they must expire.
- Do not log customer names, receipt images, review comments, access tokens, or Stripe secrets.
- Stripe webhooks update local subscription state; feature access is decided by local entitlement helpers.
- Never grant Pro access from the Checkout success URL alone.
- Use webhook-confirmed subscription state.

## Code organization and file-size rules

- Do not create new files over 300 lines without a clear justification.
- Do not add logic to files over 300 lines before proposing a split.
- Files over 500 lines must be treated as refactor candidates.
- API routes must be thin orchestration layers. Route handlers in `app/api/**/route.ts` should only:
  - parse request
  - authorize
  - call domain/service functions
  - return response
- Route handlers must not contain long prompts, provider-specific AI calls, large SQL/business logic, or UI logic.
- Client components should not contain server/business logic; they should render UI and manage local interaction only.
- Client components must not directly call Supabase for privileged writes, Stripe, Gemini, or server-only billing logic.
- Prefer Server Components by default. Use `"use client"` only for components that need state, event handlers, effects, or browser APIs.
- Keep `"use client"` boundaries as small as possible. Do not mark a large page/screen as client if only one child needs interactivity.
- Extract reusable types to `lib/<feature>/types.ts`.
- Extract pure helpers to `lib/<feature>/*.ts`.
- Extract complex client state to `hooks/use<Feature>.ts`.
- Extract feature-specific UI panels to separate component files.
- Do not define more than 2 substantial React components in one file.
- A local subcomponent is acceptable only if it is small, private, and under ~40 lines.
- Long Tailwind class strings should be wrapped with `cn(...)` or extracted into smaller components when readability suffers.
- Every new feature should follow this order:
  1. schema/types
  2. server/domain logic
  3. API/server action
  4. minimal UI
  5. tests or build/typecheck

## Admin and plan management future rule

- Plan defaults may be hard-coded during MVP.
- All plan access must go through lib/billing helpers.
- Do not read plan limits directly from UI components.
- Future admin changes should use explicit override tables, not random edits to restaurants.
- Every admin billing change must have an audit log with:
  - admin_user_id
  - restaurant_id
  - changed field
  - previous value
  - new value
  - reason
  - created_at

## Suggested feature folder pattern

For larger features, use this shape:

```text
components/<feature>/
  FeatureShell.tsx
  FeaturePanel.tsx
  FeatureEmptyState.tsx
  FeatureActions.tsx

hooks/
  useFeatureFlow.ts

lib/<feature>/
  types.ts
  schema.ts
  service.ts
  format.ts
  permissions.ts
```

## Quality gates (run before reporting completion)

Every implementation task must include or update tests for changed business logic, security logic, billing logic, or data aggregation. Before declaring a task done, run all three:

- `npm run format:check`
- `npm run typecheck`
- `npm test`

If any command fails, fix the failure or explain exactly why it cannot pass. CI runs the same three commands on every PR — failing them locally will fail CI.

## Documentation update rule

Every implementation task must check whether docs need updates. If a change affects product behavior, UX flow, database schema, billing rules, security rules, testing steps, deployment, or architecture, update the relevant docs in the same task.

Use this mapping:

- Product behavior or user flow → `docs/00-product.md` and `docs/04-business-logic.md`
- Architecture or file structure → `docs/01-architecture.md`
- Database schema, migrations, or RLS → `docs/02-schema.md`
- Visual design, spacing, components, or copy tone → `docs/03-design-system.md`
- i18n keys or translation strategy → `docs/05-i18n.md`
- Environment variables or hosting → `docs/06-deployment.md`
- Local/manual testing flow → `docs/LOCAL-TESTING.md`
- Agent rules or repeated workflow constraints → `AGENTS.md`

Final reports must include one of:

- docs updated
- docs intentionally not updated, with reason

## Refactoring rule for The Agents

Before implementing a task, inspect the files you plan to modify.
If any target file is over 300 lines:

- first propose a split,
- then refactor into smaller files,
- then implement the requested change.

Do not keep adding logic to large files.

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
2. **No generic SaaS aesthetics.** No "Welcome to [App]" hero. No 4-stat-card dashboards. Read `docs/03-design-system.md` before any UI work.
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
- Don't add analytics, error tracking, or monitoring tools until launch
- Don't write English-first copy and translate to Bulgarian — write Bulgarian first
- Don't use Lucide icons everywhere by default — they make everything look the same

## Current phase

**Billing + feedback MVP.** Foundation, auth/onboarding, dashboard shell, menu setup, kiosk scan, internal trials, and feedback submission are in place. Now building:

- hardening billing entitlements and usage accounting
- polishing feedback persistence and dashboard visibility
- keeping Stripe webhook-confirmed access separate from local entitlement checks
- preserving manual kiosk fallback when AI limits are exhausted

## Quick reference

- Brand color: `#C24D2C` (terracotta)
- Default language: `bg`
- Tiers: Free / Starter / Pro
- Free: 50 feedback sessions/month, 5 AI scans/month
- Starter: 500 feedback sessions/month, 150 AI scans/month
- Pro: 10000 feedback sessions/month, 1000 AI scans/month
- Trial: 14 days, 100 AI scans, Pro preview
- No unlimited AI scans
- Receipt AI provider: Gemini 2.5 Flash
- Database: Postgres via Supabase
