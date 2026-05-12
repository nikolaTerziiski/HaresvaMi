# Local Testing

Use this checklist to run the current Billing + Feedback MVP locally and test the owner, menu, tablet, kiosk, and feedback loop.

## Prerequisites

- Node.js 20 or newer.
- npm.
- A Supabase project, either local through Supabase CLI or a hosted dev project.
- Docker, only if you use the local Supabase CLI stack.

Create your local env file:

```bash
cp .env.example .env.local
```

Fill at least these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=HaresvaMi
EXTRACT_RECEIPT_RATE_LIMIT_PER_MINUTE=20
```

`GOOGLE_GEMINI_API_KEY` is optional for manual MVP testing. Add it only when testing receipt scanning.

## Run The App

Install dependencies:

```bash
npm ci
```

Start the Next.js dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If you change `.env.local`, restart `npm run dev`.

## Quality Gates

Run these before reporting a task as complete:

```bash
npm run format:check
npm run typecheck
npm test
```

What they do:

- `npm run format:check` checks Prettier formatting.
- `npm run typecheck` runs TypeScript with `tsc --noEmit`.
- `npm test` discovers every `tests/**/*.test.ts` file and runs Node's test runner through `tsx`.

## Database Reset

For a local Supabase CLI database, run from the repo root:

```bash
supabase db reset
```

This is destructive for the local database. It drops local data, reapplies `supabase/migrations/*.sql`, and runs `supabase/seed.sql` if present.

If the local Supabase stack is not running:

```bash
supabase start
supabase db reset
```

Do not run destructive reset commands against production. For hosted Supabase, use a separate dev project and apply migrations there.

## Manual MVP Flow

Use two browser contexts if possible:

- owner browser: normal browser session
- tablet browser: incognito/private window or a second browser

This avoids mixing the owner Supabase session with the kiosk HttpOnly cookie.

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000/register` and create an owner account, or open `http://localhost:3000/login` if the owner already exists.
3. Create the restaurant during onboarding. The user-facing flow is Bulgarian-first, for example `Име на ресторанта` and `Продължи към таблото`.
4. Open Dashboard -> `Меню`.
5. Add menu items. For the manual path, use `Въведи ръчно`, add at least the required menu items, then `Запази менюто`.
6. Open Dashboard -> `Таблет`.
7. Create a tablet session:
   - optionally enter `Име на устройството`, for example `Таблет на бара`
   - click `Създай връзка`
   - use `Копирай` or `Отвори`
8. Open the generated `/kiosk/connect?token=ks_...` link in the tablet browser.
9. Verify that `/kiosk/connect` redirects to `/kiosk/scan`.
10. With the tablet still connected, open `http://localhost:3000/` in that tablet browser and verify it redirects directly to `/kiosk/scan`, not the landing page.
11. On `/kiosk/scan`, submit manual feedback:
    - click `Избери ръчно`
    - select at least one menu item
    - click `Продължи с избраните`
    - click `Започни оценяване`
    - verify the customer rating screen uses compact full-width rows with image/fallback, description when available, quantity when > 1, and 1-5 star buttons
    - rate at least one item from 1 to 5 stars, or choose the secondary `Харесва ми` / `Не ми харесва`
    - click `Готово`
    - verify the thank-you screen auto-resets back to the staff preparation screen
12. Return to the owner browser and open Dashboard -> `Отзиви`.
13. Verify the new feedback appears in the dashboard after refresh if needed.
14. In the owner browser, open `http://localhost:3000/` and verify it redirects directly to `/dashboard`.
15. Return to Dashboard -> `Таблет`.
16. In `Активни таблети`, revoke the session with `Отмени`.
17. In the tablet browser, refresh `/kiosk/scan` or reopen the old `/kiosk/connect?token=ks_...` link.
18. Verify revoked access fails:
    - `/kiosk/scan` should show `Таблетът не е свързан.`
    - the old connect link should show the invalid/expired tablet-link page

## Optional Receipt Scan Flow

Only run this if `GOOGLE_GEMINI_API_KEY` is configured in `.env.local`.

1. Make sure the restaurant has active menu items.
2. Make sure the plan or trial has remaining AI scan entitlement.
3. Open the connected tablet at `/kiosk/scan`.
4. Click `Сканирай бона`.
5. Allow camera access if the browser asks.
6. Take or upload a clear receipt photo.
7. If Gemini extracts menu items, review them and continue with `Продължи с тях`.
8. If extraction fails, verify the fallback path still lets you use `Избери ръчно`.
9. Finish feedback and verify it appears in Dashboard -> `Отзиви`.

Successful receipt extraction consumes one AI scan credit. Failed extraction should not consume credit.

## Known MVP Limitations

- QR code setup is not implemented yet. Use the generated tablet link directly.
- The local rate limiter is in-memory and not production-grade.
- Stripe live payments are not required for the current local MVP flow.
- Camera behavior can vary by browser and tablet. Test on the real Android tablet before relying on it in a restaurant.
- Manual item selection is the reliable fallback whenever AI scanning is unavailable, out of credits, or unable to read the receipt.
