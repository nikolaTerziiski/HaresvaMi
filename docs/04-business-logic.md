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
9. The waiter sees a staff-facing review screen before the customer rating step. Each receipt row shows the raw receipt text, quantity, matched menu item, and a Bulgarian match hint: `разпознато`, `провери`, or `неясно`.
10. Matched rows are preselected and require no extra work unless the waiter changes the menu item. Unknown rows default to ignored, but the waiter can select an active menu item when the row is real.
11. Continuing from review converts only confirmed, non-ignored rows into `SelectedItem` values for the customer rating screen. Ignored rows remain out of feedback submission.
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

### Product flow

1. Receipt scanned. AI returns rows with `matched_via: "alias"`, `"fuzzy_match"`, or `"unknown"`.
2. Waiter reviews raw receipt rows before the customer rating step.
3. When a waiter corrects or confirms a real receipt shortcut, the UI can call the learning API with the raw receipt text and chosen active menu item.
4. Next time that normalized receipt text appears, Gemini receives it in the restaurant alias list and can match it via `matched_via: "alias"`.

### Owner alias management

The Menu review/editor shows existing aliases as small chips stacked under each dish name. Dishes without aliases show a subtle `+ псевдоним` action. Rows with several aliases show only the first few chips and a compact `+ още` indicator to keep the menu list scannable.

Owners can open the `Псевдоними на ястия` side panel from the Menu toolbar or from an empty alias row. The panel explains the mapping in non-technical Bulgarian, shows `“ШП” → “Шопска салата”` as the example, and lets the owner manually connect one receipt text value to one saved menu item. New unsaved menu rows cannot receive aliases until the menu item exists in the database.

Owner-created aliases use `POST /api/receipt-aliases/learn`, so they follow the same authorization, normalization, menu item ownership check, and metadata-only storage rules as kiosk-learned aliases. AI suggestions, coverage percentage, deletion controls, and CSV import are intentionally out of scope for this MVP step.

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

The staff header, receipt preview, AI scan counts, setup labels, and staff badges are visible only in staff scan/manual/review/ready modes. They are hidden during customer rating and thank-you modes so the customer gets a clean fullscreen rating moment.

Customer-facing API routes authorize either:

- a valid kiosk cookie, for the tablet flow
- a valid owner session, for owner-driven testing and authenticated flows

Kiosk writes do not go directly through public Supabase table policies. `/api/feedback` authorizes the kiosk cookie or owner session first, then uses the service role to create `feedback_sessions` and `feedback_ratings`. `/api/extract-receipt` uses the same authorization model before checking scan entitlement and calling Gemini.

## Insights generation (Phase 3)

Plain-Bulgarian insights are generated weekly by a cron job.

### Insight types

1. **Trending down dish:** "Кебапчето пада на 2.6/5 от 3 седмици. Виж 12 отзива →"
2. **Trending up dish:** "Шопската ти сега е 4.4/5 — най-добрата ти оценка от началото на годината."
3. **New low:** "Един клиент даде 1/5 на агнешкото вчера и каза: '...'. Виж →"
4. **Quiet week:** "Тази седмица имаш само 8 отзива. Постави таблета по-видимо на масата за плащане?"
5. **Milestone:** "100 клиента вече ти дадоха отзив този месец. 78% казаха 'Харесва ми' 🎉"

### Generation flow

Weekly cron → for each restaurant with Pro tier:

1. Aggregate last 7 days of ratings vs prior 7 days
2. Identify dishes with significant changes (statistical significance: ≥5 ratings, change ≥0.75 points)
3. Use Claude Sonnet to write the insight in natural Bulgarian
4. Send push notification to owner's PWA + email

### Insight prompt (Claude)

```
You are writing a weekly insight for a Bulgarian restaurant owner about their customer feedback.

Restaurant: ${restaurantName}
This week: ${thisWeekStats}
Last week: ${lastWeekStats}
Notable changes: ${notableChanges}

Write ONE short insight (max 2 sentences) in informal Bulgarian (use "ти", not "Вие").
Include the dish name, the rating change, and a clear next action if relevant.
No corporate language. No "we noticed that..." preambles. Direct and human.

Examples of good insights:
- "Кебапчето пада на 2.6/5 от 3 седмици. Виж 12 отзива →"
- "Шопската ти сега е 4.4/5 — най-добрата ти оценка от началото на годината."
- "Един клиент даде 1/5 на агнешкото вчера. Прочети защо →"

Return only the insight text, no explanation.
```

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

## Webhook handling (Phase 2 — Stripe)

### Events to handle

- `customer.subscription.created` → set `tier = 'pro'`, set `stripe_subscription_id`
- `customer.subscription.updated` → handle plan changes, status changes
- `customer.subscription.deleted` → set `tier = 'free'`, clear subscription ID
- `invoice.payment_failed` → notify owner, give 7-day grace period before downgrade
- `invoice.payment_succeeded` → confirmation email

All webhooks handled in `app/api/webhooks/stripe/route.ts` with signature verification.
