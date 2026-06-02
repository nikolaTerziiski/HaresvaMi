# 04 — Business Logic

## Tier limits

The v1 source of truth is `lib/billing/plans.ts`. Every tier has explicit numeric AI scan limits.

### Free tier

- 1 restaurant
- 50 completed feedback sessions per calendar month (resets on the 1st)
- 5 successful AI receipt scans per calendar month (resets on the 1st)
- Manual item selection remains available even when AI scans are exhausted
- Basic dashboard (overall ratings, last 30 days)
- Bulgarian customer interface only
- Email support

### Starter tier

- Everything in Free, plus:
- 500 completed feedback sessions per calendar month
- 150 successful AI receipt scans per calendar month
- Useful for restaurants that scan regularly but do not need the full Pro quota

### Pro tier

- Everything in Starter, plus:
- 10000 completed feedback sessions per calendar month
- 1000 successful AI receipt scans per calendar month
- Per-dish analytics with trends (week/month/all-time)
- Plain-Bulgarian weekly insights via push notification
- BG + EN customer interface (toggle in onboarding)
- Priority email support

### 14-day Pro trial

- 14 days
- Pro preview
- 100 successful AI receipt scans total during the trial
- Trial scan usage is tracked through `scan_credit_grants`, not monthly reset
- No credit card required upfront
- After trial: features lock back to Free unless they subscribe
- One trial per restaurant, lifetime

### Future module: Restaurant Group / multi-restaurant

- Not part of v1 limits or schema constraints
- Multiple locations under one account
- Cross-location dashboard
- Comparative insights between locations

## Tier limit enforcement

Implemented in:

- `lib/billing/plans.ts`
- `lib/billing/entitlements.ts`
- `lib/billing/entitlements-core.ts`
- `lib/billing/usage.ts`

```ts
export async function canScanReceipt(
  restaurantId: string,
): Promise<EntitlementResult>;
export async function consumeAiScanCredit(
  restaurantId: string,
): Promise<EntitlementResult>;
export async function canSubmitFeedback(
  restaurantId: string,
): Promise<EntitlementResult>;
export async function incrementFeedbackUsage(
  restaurantId: string,
): Promise<void>;
export async function getMonthlyUsage(
  restaurantId: string,
): Promise<MonthlyUsageSnapshot>;
```

### Rules

1. **All tiers use numeric limits.** Free, Starter, and Pro all have explicit monthly feedback and AI scan limits.
2. **AI scans are checked before Gemini.** `/api/extract-receipt` calls `canScanReceipt()` before loading the image or calling the AI provider.
3. **Only successful extraction consumes scan usage.** Failed Gemini calls are logged but do not increment `usage_counters.receipt_scans_count` or consume a scan credit.
4. **Trial access uses credits.** A trial grants 100 AI scans for 14 days through `scan_credit_grants`; expired trials without paid access fall back to Free on entitlement reads.
5. **Feedback count is checked before completion.** The feedback API must call `canSubmitFeedback()` before marking a session complete and increment `usage_counters.feedback_count` only when `completed_at` is set.
6. **Manual selection is never blocked by AI scan limits.** If scans are exhausted, the kiosk falls back to manual item selection.
7. **Plan overrides are always applied.** All entitlement functions — `canScanReceipt`, `canSubmitFeedback`, `canExtractMenu`, and `consumeAiScanCredit` — fetch the active `plan_overrides` row and resolve effective limits before making any access decision. An override-adjusted limit, not the base plan limit, is used everywhere.
8. **`subscription_status` is required for Pro access.** `hasProAccess()` returns true only when: an active trial exists, OR an admin override grants `override_tier='pro'`, OR the restaurant's stored tier is `'pro'` **and** `subscription_status IN ('active', 'trialing')`. A canceled or past-due Pro subscription does not grant Pro access.
9. **Admin overrides are atomic.** Use the `apply_plan_override()` Postgres function (see `docs/02-schema.md`) to write an override and its audit log row atomically. Never INSERT directly into `plan_overrides` from application code without also writing the corresponding `billing_audit_log` row in the same transaction.
10. **Billing columns are service-role-only writes.** Migration `0016` revokes the broad UPDATE privilege on `restaurants` from the `authenticated`/`anon` roles and re-grants UPDATE on safe profile columns only. Tier, subscription, trial, and Stripe columns can never be written through the public API — only through server routes that use the service role. This is the column-level enforcement layer behind rule 8; do not bypass it by widening the grant. See `docs/02-schema.md` → restaurants policies.
11. **Dashboard plan labels use effective access.** The dashboard shell chip and home plan card are derived server-side through the same entitlement/override rules: active trial or Pro override shows Pro, active Starter shows Starter, and inactive/canceled paid access falls back instead of showing a stale paid label. The home plan card's visible feedback limit must match the effective tier instead of a hard-coded Free limit, and its CTA should route to `/dashboard/settings` rather than rendering a dead billing button.

### Billing action errors

Owner-triggered billing actions on `/dashboard/settings` call server routes and must surface a visible Bulgarian message when the action is blocked:

- `POST /api/billing/start-trial` returns a Bulgarian `message` for missing auth, missing restaurant, already-used trial, non-free tier, incomplete menu, and unexpected failures.
- `POST /api/billing/create-checkout-session` returns a Bulgarian `message` for missing auth, missing restaurant, existing subscription, and unexpected failures.
- Internal provider or environment details such as Stripe keys or app URL configuration are logged server-side, but the client receives only a generic Bulgarian failure message.
- Pro upsell links should point to `/dashboard/settings`, the existing plan and limits screen.

## Receipt extraction logic

### The flow

1. Customer pays. Waiter taps "Сканирай бона" in kiosk mode.
2. Camera opens. Waiter takes a photo of the printed receipt.
3. Kiosk posts the captured image file to `/api/extract-receipt` with `restaurant_id`.
4. The API also accepts a stored `image_path` for server-side receipt image downloads.
5. Server fetches:
   - The image from Storage
   - The restaurant's `menu_items` (active, not deleted)
   - The restaurant's `receipt_aliases`
6. Server calls Gemini 2.5 Flash Lite first, then retries with Gemini 2.5 Flash on low confidence.
7. Server returns `{items, confidence, model, retryCount, usage}`.
8. Kiosk maps each API item into a receipt match with `rawText`, `menuItemId`, `menuItemName`, `quantity`, and `matchedVia`.
9. The waiter sees a staff-facing review screen before the customer rating step. Each receipt row shows the raw receipt text, quantity, matched menu item, and a Bulgarian match source label (`съкращение`, `вероятно съвпадение`, or `неразпознато`).
10. Matched rows are preselected and require no extra work unless the waiter changes the menu item or ignores the row. Unknown rows default to ignored, but the waiter can select an active menu item when the row is real.
11. Continuing from review converts only confirmed, non-ignored rows into `SelectedItem` values for the customer rating screen. Ignored rows from any match source remain out of feedback submission.
12. If extraction fails or returns no extracted receipt rows, kiosk falls back to manual item selection.
13. Customer proceeds to rating screen after the waiter confirms extracted or manually selected items.

### Gemini prompt template

```ts
// lib/ai/prompts/receipt-extraction.ts
export function buildReceiptExtractionPrompt(
  menu: MenuItem[],
  aliases: ReceiptAlias[],
): string {
  return `
You are a receipt parser for a Bulgarian restaurant feedback app.

Extract the food and drink items the customer ordered from this receipt image.

The restaurant's menu items are:
${menu.map((m) => `- "${m.name_bg}" (id: ${m.id})`).join("\n")}

Known abbreviations and aliases for this restaurant:
${aliases.map((a) => `- "${a.alias}" → "${menu.find((m) => m.id === a.menu_item_id)?.name_bg}" (menu_item_id: ${a.menu_item_id})`).join("\n")}

Return ONLY valid JSON in this exact shape, with no markdown or explanation:
{
  "items": [
    {
      "raw_text": "the exact text as it appears on the receipt",
      "menu_item_id": "uuid if matched, otherwise null",
      "menu_item_name": "official menu name if matched, otherwise null",
      "quantity": number (default 1 if not specified),
      "matched_via": "alias" | "fuzzy_match" | "unknown"
    }
  ]
}

Matching rules:
1. First check the aliases list — exact alias matches use "matched_via": "alias"
2. Then try fuzzy match against menu names (e.g. "Кеб. с лук" matches "Кебапче с лук") — use "matched_via": "fuzzy_match"
3. If neither, set menu_item_id and menu_item_name to null and use "matched_via": "unknown"

Ignore non-food items like:
- Service fees, taxes, totals
- "Касов бон" / "Служебен бон" headers
- Restaurant name, address, EIK numbers
- Date and time
- Receipt numbers
- Drinks like water if quantity is unclear

If the receipt is unreadable, return: {"items": [], "error": "unreadable"}
`.trim();
}
```

### Provider abstraction

```ts
// lib/ai/extract-receipt.ts
export async function extractReceipt(
  payload: ReceiptExtractionPayload,
): Promise<ReceiptExtractionApiResult>;

// lib/ai/providers/gemini-receipt.ts
export async function callGeminiForReceipt(input: {
  model: string;
  prompt: string;
  imageBuffer: Buffer;
  mimeType: string;
}): Promise<GeminiReceiptResult>;
```

The provider implementation lives in `lib/ai/providers/gemini-receipt.ts`. To swap providers, change the single call inside `extractReceipt()`. Nothing else in the codebase knows or cares which AI is running.

### Cost tracking

Log every Gemini API call with:

- Restaurant ID
- Image size (KB)
- Tokens used (input/output)
- Latency (ms)
- Cost estimate (calculated)
- Success/failure

Store metadata in `ai_usage_events` for cost monitoring per restaurant. Never store receipt text, customer comments, images, names, access tokens, or secrets in this table.

## Alias learning loop

The first 1–2 weeks of a restaurant's usage are "training" the system on their receipt format.

### Implemented API

`POST /api/receipt-aliases/learn` stores waiter-confirmed receipt shortcuts. The route:

1. Accepts `aliases: [{ rawText, menuItemId }]`.
2. Authorizes the request with `authorizeKioskOrOwnerRestaurant`, accepting either a connected kiosk tablet or the owner session.
3. Normalizes `rawText` by trimming, collapsing whitespace, uppercasing Bulgarian/Latin text, and limiting the alias to 120 characters.
4. Verifies `menuItemId` belongs to the authorized restaurant and is active/non-deleted.
5. Writes only `restaurant_id`, normalized `alias`, `menu_item_id`, `confidence`, `times_seen`, and timestamps. It does not store customer comments, receipt images, or full receipt payloads.
6. If the alias already exists for the restaurant, updates `menu_item_id`, sets `confidence = 'manual'`, increments `times_seen`, and updates `last_seen_at`.
7. If the alias is new, inserts it with `confidence = 'manual'` and `times_seen = 1`.
8. Returns a learned alias summary for the caller.
9. The owner-facing alias manager must show visible Bulgarian errors when alias load, save, or delete calls fail. A deleted alias is removed from the screen only after the DELETE request succeeds.

### Product flow

1. Receipt scanned. AI returns rows with `matched_via: "alias"`, `"fuzzy_match"`, or `"unknown"`.
2. Waiter reviews raw receipt rows before the customer rating step.
3. When a waiter corrects or confirms a real receipt shortcut, the UI can call the learning API with the raw receipt text and chosen active menu item.
4. Next time that normalized receipt text appears, Gemini receives it in the restaurant alias list and can match it via `matched_via: "alias"`.

### Future UI flow

1. Receipt scanned. AI returns 6 items, 4 matched, 2 with `matched_via: "unknown"`.
2. Kiosk shows: "Нови продукти открити. Помогни ни да ги разпознаем за следващия път:"
3. For each unknown item, show:
   - The raw receipt text (e.g., "PK x2")
   - A search/dropdown of menu items
   - "Това не е продукт от менюто" option (for service charges, etc.)
4. Waiter selects the matching menu item.
5. Insert into `receipt_aliases` with `confidence = 'manual'`.
6. Next time "PK" appears, AI will match it via the alias list.

### Alias suggestions (Phase 3)

When AI is uncertain (low confidence fuzzy match), it can return `matched_via: "fuzzy_match"` with a suggestion. The waiter can confirm with one tap, which inserts the alias as `confidence = 'ai_suggested'`. After 3 confirmations, promote to `confidence = 'manual'`.

## Customer rating logic

### The form

Per-item rating:

- 1–5 star scale
- Compact full-width dish rows for a 10-inch landscape tablet
- Image or warm fallback mark on the left
- Dish name, optional description, and quantity when quantity is greater than 1
- 1-5 star buttons on the right, with selected and unselected states
- No default selected; the customer actively chooses a star value

Overall rating:

- Optional and visually secondary
- Two buttons: "Харесва ми" / "Не ми харесва"
- Customer can submit with at least one dish rating or an overall rating

### Validation

- All per-item ratings are optional individually, but customer must rate at least 1 item OR submit overall to count as a completed session
- A completed session needs at least one dish rating or an overall rating
- Comments are optional everywhere
- Max comment length: 500 characters

### Kiosk authorization and submission

The kiosk uses server-created `ks_...` session tokens stored as hashes in the `kiosk_sessions` table. Raw tokens are returned once to the owner as setup links in this shape:

```text
/kiosk/connect?token=ks_...
```

The connect route verifies the token server-side, updates session usage, and sets the token in an HttpOnly cookie scoped to `/` so kiosk pages and API routes receive it. `/kiosk/scan` reads that cookie server-side before loading the restaurant and menu.

Once a valid kiosk cookie exists on a device, visiting `/` redirects directly to `/kiosk/scan`. Once an owner auth session exists, visiting `/` redirects to `/dashboard`. This keeps a configured tablet out of the public landing/login loop during daily service.

`/kiosk/scan` owns the current kiosk UI states:

- staff scan / manual preparation
- staff ready handoff
- customer rating
- thank-you auto reset

The receipt preview is visible only in staff scan/manual/ready modes. It is hidden during customer rating and thank-you modes so the customer gets the full tablet width.

When an owner needs to take the device back from kiosk mode, they can tap the "Изход" pill in the staff header. This opens a confirmation dialog, and on confirm the browser calls `POST /kiosk/exit`, which clears the kiosk cookie. The kiosk session row in the database remains active, so the same setup link can be reused to reconnect later without generating a new token.

Customer-facing API routes authorize either:

- a valid kiosk cookie, for the tablet flow
- a valid owner session, for owner-driven testing and authenticated flows

Kiosk writes do not go directly through public Supabase table policies. `/api/feedback` authorizes the kiosk cookie or owner session first, then uses the service role to create `feedback_sessions` and `feedback_ratings`. `/api/extract-receipt` uses the same authorization model before checking scan entitlement and calling Gemini.

## Insights generation

### v0.1 deterministic owner insights

The owner-facing `/dashboard/insights` page is the primary dashboard surface for
the MVP. It does not call Claude, Gemini, Stripe, or push notification services.
It computes deterministic weekly insights server-side from existing
`feedback_sessions`, `feedback_ratings`, `menu_items`, and `restaurants` data.

The page compares:

- current rolling 7-day window
- previous rolling 7-day window
- completed feedback sessions only
- item ratings attached to those completed session ids
- menu item names, including the deleted-item historical fallback

The v0.1 rules are intentionally conservative:

- Top performer requires at least 3 current ratings for the dish.
- Watch dish requires at least 3 current ratings and either current average
  `<= 3.2`, or a drop of `<= -0.5` where the previous window also has at least
  3 ratings.
- Improved dish requires at least 3 previous ratings, at least 3 current
  ratings, a delta of `>= 0.5`, and current average `>= 4.0`.
- A single bad rating must not create a watch insight.
- If there is no previous-week data, the UI explains that comparison starts
  after more data instead of showing fake zeroes or `NaN`.

Plain-Bulgarian insights are generated weekly by a cron job.

### Insight types

1. **Trending down dish:** "Кебапчето пада на 2.6/5 от 3 седмици. Виж 12 отзива →"
2. **Trending up dish:** "Шопската ти сега е 4.4/5 — най-добрата ти оценка от началото на годината."
3. **New low:** "Един клиент даде 1/5 на агнешкото вчера и каза: '...'. Виж →"
4. **Quiet week:** "Тази седмица имаш само 8 отзива. Постави таблета по-видимо на масата за плащане?"
5. **Milestone:** "100 клиента вече ти дадоха отзив този месец. 78% казаха 'Харесва ми' 🎉"

### Generation flow

`GET /api/cron/weekly-insights` is called weekly by Vercel Cron. Domain logic
lives in `lib/insights/cron.ts`. The route itself is a thin orchestration layer.

**Authorization:**

- In production: requires `Authorization: Bearer <CRON_SECRET>` header
  (Vercel sets this automatically when `CRON_SECRET` is set in the dashboard).
- In development: localhost requests are permitted without the secret.

**Eligibility** (`lib/insights/scheduling.ts`):

- Pro tier with `subscription_status = 'active'`, OR
- Any tier with `subscription_status = 'trialing'` AND `trial_ends_at > NOW()`.
- Also requires at least 3 rating rows in completed sessions within the current
  7-day window (`hasEnoughRatings()`).

**Per-restaurant pipeline** (capped at 5 concurrent, wrapped in try/catch):

1. Load sessions, ratings, and menu items for the past 14 days (current + previous window).
2. Run `buildInsights()` from `lib/insights/aggregation.ts` (deterministic).
3. Call `generateInsightSummary()` from `lib/ai/generate-insights.ts` (Gemini 2.5 Flash Lite).
4. UPSERT into `insight_summaries` keyed on `(restaurant_id, period_start, period_end)`.
   This serves as a cached fallback for the `/dashboard/insights` page.
5. Fetch all `push_subscriptions` rows for the restaurant.
6. For each subscription: call `sendPush()` (`lib/push/server.ts`).
   - Payload: `{ title: restaurant.name, body: summary[0..240], url: '/dashboard/insights', tag: 'weekly-insight' }`.
   - If the endpoint returns HTTP 404/410 (`gone: true`), delete the subscription row.
   - If the push succeeds, update `last_used_at = NOW()`.
7. Log a `weekly_insight_generation` event to `ai_usage_events` (metadata only,
   no insight text, per AGENTS.md).

**Response:** `{ ok: true, processed: N, push_sent: M, push_pruned: K }`

**Dashboard fallback:** `/dashboard/insights` can read the most recent
`insight_summaries` row for the restaurant if the owner visits without a pending
push. The cron always writes before sending, so the cached summary is always up
to date after a successful cron run.

### Push notification payload shape

```json
{
  "title": "Механа Слънце",
  "body": "Кебапчето ти е с оценка 4.2/5 — добра седмица!",
  "url": "/dashboard/insights",
  "tag": "weekly-insight"
}
```

Constructed by `buildInsightPayload()` in `lib/push/payload.ts`. Body is
truncated to 240 characters. No PII (owner email, restaurant_id, user_id)
leaks into the notification body or title.

### Insight prompt (Gemini 2.5 Flash Lite)

The prompt lives in `lib/ai/generate-insights.ts` and has not changed from the
v0.1 deterministic insights implementation. The cron reuses `generateInsightSummary()`
directly. The model writes 3-4 sentences in informal Bulgarian on 'ти', naming
at least one specific dish, and ends with an observation or recommendation.

## Reputation engine (Pro-only)

The reputation engine turns the kiosk's existing feedback signal into two owner
outcomes: **recover unhappy customers privately and in real time**, and **make it
easy for happy customers to leave a public Google review** — without ever gating,
hiding, or discouraging negative reviews.

### Compliance rule (non-negotiable)

**No review-gating.** The customer kiosk never shows a Google review link, QR, or
call-to-action — to anyone, happy or unhappy. We never route only happy customers
to Google, and we never suppress or intercept a negative review. The Google review
QR is an **owner-facing printable asset** (see below); customers scan it with their
own phones, on their own time. This keeps us compliant with Google's review policies
and avoids the kiosk-IP spam filter that flags many reviews written on one device.

This is implemented as "Option B": all in-app Google prompting was removed from the
kiosk. The kiosk's only sentiment behaviour is **unhappy → private recovery**.

### Gating

The whole engine is **Pro-only** and gated by the override-aware async check
`canUseReputation(restaurantId)` in `lib/billing/entitlements.ts`. It loads the
restaurant row plus any `plan_overrides`, resolves the effective tier, and delegates
to `hasProAccess()` — so an admin `override_tier='pro'` on a Free restaurant unlocks
reputation, exactly like every other entitlement (rule 7). It is enforced in four
places: the kiosk scan page (`reputationEnabled`), the settings page (QR + Telegram
section), the low-rating alert gate in `submit-feedback.ts`, and the recovery API
route. `lib/reputation/entitlement.ts` exports a pure, non-override-aware
`restaurantHasReputationAccess()` for in-memory checks and tests only — never use it
for live gating.

### Sentiment classification

`lib/feedback/sentiment.ts` → `classifyFeedbackSentiment(overallRating, ratings[])`
returns `"happy" | "unhappy" | "neutral"`:

1. Overall `"like"` → `happy` (regardless of stars).
2. Overall `"dislike"` → `unhappy` (overrides even 5-star item ratings).
3. No overall rating: empty ratings → `neutral`; average `>= 4.5` → `happy`;
   average `<= 2.5` → `unhappy`; otherwise `neutral`.

### Kiosk flow (Option B)

On submit (`hooks/useKioskFeedbackSubmit.ts`), after the feedback is saved:

- `reputationEnabled && sentiment === "unhappy"` → enter **reputation** mode, which
  renders only the on-tablet **recovery form** (`ReputationPanel` → `RecoveryForm`).
- Everything else (happy, neutral, or non-Pro) → straight to the existing
  **thank-you** screen. No QR, no Google link, no extra step.

The recovery form asks the customer, privately on the tablet, what went wrong. It is
optional. The form only advances to thank-you on (a) a successful submit or (b) an
explicit Skip — never on a network error (the error is shown and retry is allowed).
A 45-second safety auto-advance runs **only while the textarea is untouched**, so it
can never discard a draft the customer is mid-typing.

### Recovery comment persistence and gating

`POST /api/feedback/recovery` (`lib/feedback/recovery.ts` → `saveRecoveryComment`):

1. Validates the payload with `recoveryCommentSchema`.
2. Authorizes the caller for the restaurant via `authorizeKioskOrOwnerRestaurant`
   (kiosk cookie or owner session).
3. Requires `canUseReputation(restaurantId)` → **403** if not Pro.
4. Writes `recovery_comment` only to a row that matches **all** of:
   `id = sessionId`, `restaurant_id`, `overall_rating = 'dislike'`,
   `completed_at IS NOT NULL`, and `created_at > now() - 24h`. No matching row →
   `{ ok: false }` → **404**. This prevents a forged request from writing a comment
   to an old, other-restaurant, or non-dislike session.

> Note: the persistence gate requires an explicit `overall_rating = 'dislike'`.
> A session that became `unhappy` only via a low star average (no thumbs-down) is
> routed to the recovery form but its comment will not persist (404). If we want to
> capture those, the gate must be widened to include low-average sessions.

`recovery_comment` is capped at 1000 characters by a DB CHECK constraint (migration
`0015`).

### Real-time Telegram low-rating alert

When sentiment is `unhappy` **and** `canUseReputation` is true,
`submit-feedback.ts` fires `sendLowRatingAlert()` (`lib/reputation/notify.ts`) as a
fire-and-forget `.then/.catch` — it can never throw into or delay the feedback save.

- It sends a **PII-free** Bulgarian message ("⚠️ Нов отрицателен отзив в „<name>".
  Виж таблото: <url>") — no customer name, comment, email, or UUIDs — to every chat
  in `telegram_links` for the restaurant. The dashboard URL points at
  `/dashboard/feedback`.
- `sendTelegramMessage` (`lib/telegram/send.ts`) is a no-op that returns
  `{ ok: false }` when `TELEGRAM_BOT_TOKEN` is unset, so unconfigured environments
  degrade silently.

### Telegram linking

Owners connect Telegram from the settings reputation section:

1. The server signs a short-lived HMAC token with `signLinkToken(restaurantId)`
   (`lib/telegram/link-token.ts`): `<rid_hex>.<exp_base36>.<sig>`, ≤64 chars, 15-min
   TTL, signed with `TELEGRAM_LINK_SECRET`. It builds the deep link
   `https://t.me/<NEXT_PUBLIC_TELEGRAM_BOT_USERNAME>?start=<token>`.
2. The owner taps it, opening their Telegram and sending `/start <token>` to the bot.
3. `POST /api/telegram/webhook` validates the `X-Telegram-Bot-Api-Secret-Token`
   header (when `TELEGRAM_WEBHOOK_SECRET` is set), verifies the token, and upserts
   `telegram_links` (service role, `onConflict: restaurant_id,chat_id`) with the
   chat id and username. It replies with a Bulgarian confirmation.
4. The webhook **always returns HTTP 200** to Telegram, even on validation failure or
   error, so Telegram does not retry-storm. An invalid/expired token gets a Bulgarian
   "generate a new link" reply.

See `docs/06-deployment.md` → Telegram alerts for the one-time bot/webhook setup and
the four env vars.

### Owner-facing Google review QR (the only place Google appears)

When a Pro restaurant has saved a `google_review_url` (validated to a Google host —
see Google review URL allow-list below), the settings page server-renders an inline
SVG QR with `renderReviewQrSvg()` (`lib/reputation/qr.ts`, the `qrcode` package) and
offers a print affordance. The owner prints it and places it on tables/receipts.
This is the **only** surface that renders the Google QR; it never appears in the
customer kiosk.

### Google review URL allow-list

`lib/validations/restaurant.ts` restricts `google_review_url` to Google hosts only
(empty is allowed): host `g.page`, any `*.google.com` (covers
`search.google.com`, `www.google.com/maps`), `maps.app.goo.gl`, or `goo.gl`.
Everything else is rejected with the existing `"invalid"` message, so owners can't
paste an arbitrary off-platform link into a column the kiosk/print path trusts.

## AI menu import

Pro restaurants (and trial/override Pro) can build their menu by uploading photos or
PDFs of an existing printed menu instead of typing every dish. The flow lives under
`/dashboard/menu/import-ai` and is gated by `canExtractMenu()` (override-aware; see
rule 7) with `MenuTierLockedCard` shown to ineligible tiers.

### Flow

1. **Upload** — owner adds one or more image/PDF files (`ImportUploadStep`).
2. **Process** — files are posted to the multi-file extraction API, which calls
   Gemini 2.5 Flash Lite with `buildMultiFileMenuPrompt(fileNames)`
   (`lib/ai/prompts.ts`). Each extracted item carries `source_file_name`.
3. **Review** — extracted dishes are shown grouped by category in an editable review
   screen (`ImportReviewStep` / `ImportCategoryAccordion`), where the owner can edit,
   delete, or move dishes between categories before committing.
4. **Commit** — confirmed dishes are written to `menu_items`; `menu_extraction_count`
   in `usage_counters` tracks usage against the tier limit.

### Extraction rules (food-only)

The menu-import prompt is deliberately **food-only** and category-constrained — this
differs from receipt extraction (which extracts food _and_ drink line items):

- **Skip all beverages unconditionally** — alcohol, soft drinks, hot drinks, and
  water — even when they appear with a price. Extract only dishes and desserts.
- Use only the fixed Bulgarian categories: Салати, Супи, Предястия, Основни, Скара,
  Гарнитури, Десерти. Unknown → `Некласифицирано`; never invent new categories.
- Prices are returned as bare numbers (no `лв.`/`€`).
- Unreadable / non-menu files contribute no items.

## Edge cases

### Receipt scanning fails

- Image too blurry / unreadable: show "Бонът не се чете ясно. Опитай отново."
- No menu items detected: show "Не разпознахме продукти. Можеш ли да ги избереш ръчно?" → fallback to manual selection
- Gemini API down: fallback to manual selection mode automatically

### No menu items configured

- Block kiosk mode entry: "Първо добави продукти в менюто си" with link to /dashboard/menu
- During onboarding, can't complete step 4 without at least 5 menu items

### Customer abandons mid-rating

- Session stays in DB with `completed_at = NULL`
- After 30 minutes of inactivity in kiosk, auto-redirect to standby
- Incomplete sessions don't count toward usage limit

### Owner logs out of kiosk mid-day

- Kiosk falls back to lock screen requiring re-login
- No data loss — incomplete sessions remain

### Owner deletes a menu item with existing ratings

- Soft delete (`deleted_at = NOW()`)
- Existing ratings preserved (FK doesn't cascade because we soft-delete)
- Item disappears from kiosk and new feedback flows
- Still appears in historical analytics with "(премахнато)" suffix

### Multiple customers at same table sharing receipt

- One scan = one session
- They negotiate amongst themselves who taps what
- Future enhancement: split bill mode (post-MVP)

## Currency display

All menu item prices are stored in BGN in the `menu_items.price` column. EUR is always derived on the fly and never stored.

### Fixed conversion ratio

**1 EUR = 1.95583 BGN** — this is the Bulgarian National Bank's legally-mandated fixed rate for the euro changeover period. It does not change.

The constant and helper functions live in `lib/menu/currency.ts`:

```ts
export const BGN_PER_EUR = 1.95583;
export function bgnToEur(bgn: number): number { ... }
export function formatBgn(value: number): string { ... }
export function formatEur(value: number): string { ... }
```

**Do not redefine `BGN_PER_EUR` anywhere else in the codebase.** Import it from `lib/menu/currency.ts`.

### Display rule

- **BGN primary** — larger text, mono numerals, shown in full (e.g. `12.50`).
- **EUR secondary** — smaller text, muted color (`var(--ink-mute)`), prefix `≈`, e.g. `≈ 6.39 €`.

The `eurAbbrev` i18n key (`€`) is used so the abbreviation is translatable if needed.

## Webhook handling (Phase 2 — Stripe)

### Events to handle

- `customer.subscription.created` → set `tier = 'pro'`, set `stripe_subscription_id`
- `customer.subscription.updated` → handle plan changes, status changes
- `customer.subscription.deleted` → set `tier = 'free'`, clear subscription ID
- `invoice.payment_failed` → notify owner, give 7-day grace period before downgrade
- `invoice.payment_succeeded` → confirmation email

All webhooks handled in `app/api/webhooks/stripe/route.ts` with signature verification.
