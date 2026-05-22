# Beta Runbook — One Real Service Shift

> **Goal of this document:** walk one developer through running the HaresvaMi feedback loop at a real mehana during a real evening shift. This is a measurement exercise, not a polish exercise. The runbook fails if the developer edits code during the shift.

---

## 1. Goal

Run HaresvaMi for a full service shift — a real mehana, real waiters, real customers paying their bills. The only thing being measured is whether the feedback loop works in the wild: waiter scans or picks dishes, customer rates, owner sees the data.

**This is not a feature sprint.** If something looks wrong during the shift, write it down and triage it after. Do not open your editor. Do not push a hotfix. If the product can only be measured while you are standing next to it fixing things, you are not measuring the product — you are measuring yourself.

The evening is a success if:

- At least one complete feedback session flows through without developer intervention.
- The kill/pivot thresholds in section 6 have real numbers to evaluate against.

The evening is a failure if any of these happen:

- You pushed code during the shift.
- You "quickly added" something a waiter asked for.
- You stood next to the tablet and guided every interaction.

---

## 2. Pre-Shift Checklist (the day before)

Work through this list the day before the shift. Do not skip steps and plan to catch up on the evening.

### Restaurant and menu

- [ ] Restaurant created in `/dashboard`. Name, address, and logo filled in.
- [ ] Menu populated with **at least 20 active items** across at least 3 categories. The kiosk falls back to manual selection when AI fails — but if the manual list is too sparse, customers have nothing to rate.
- [ ] Verify the menu by opening `/dashboard/menu`, scanning the item list, and confirming every item has a Bulgarian name and price.

### Kiosk session

- [ ] At least one kiosk session created from `/dashboard/tablet`.
- [ ] The session connected on the **actual tablet that will be used tonight** — not a developer browser, not a phone emulator, the real device.
- [ ] Verify: open `/` in the tablet browser after connecting. It must redirect directly to `/kiosk/scan`, not the landing page. If it does not, go back to `/dashboard/tablet` and reconnect.

### PWA

- [ ] "Add to Home Screen" done on the tablet. The home-screen icon must show the real terracotta `#C24D2C` logo. If it shows a generic letter or a browser icon, the manifest is not loading correctly — do not proceed until this is fixed.
- [ ] Tap the home-screen icon cold (not from a recently-used app list). Confirm it lands on `/kiosk/scan` directly.

### Scan quota

- [ ] Check the venue's entitlement. In production this hits the production Supabase project.
- [ ] For the first beta shift: start the Pro trial manually from the Supabase dashboard (`restaurants` table, set `tier = 'pro'`, insert a row into `scan_credit_grants` with 100 credits and a 14-day expiry). Do not do this from the UI — the UI trial button will be the real user path later; for now use a direct DB edit with an audit note.
- [ ] Confirm scan entitlement is visible in `/dashboard/billing`: it should show remaining AI scans > 0.
- [ ] Note the remaining count. You will compare it after the shift to confirm scans were consumed correctly.

### Owner readiness

- [ ] Owner has walked through the **manual fallback flow at least once on their own device** — go to `/kiosk/scan`, tap "Избери ръчно", select two or three dishes, tap "Продължи с избраните", tap "Започни оценяване", rate something, tap "Готово". The owner should be able to describe this flow to a waiter in their own words.
- [ ] Owner has the developer's phone number saved. The only legitimate reason to call is "the tablet is completely dead or stolen." Everything else waits until after the shift.

---

## 3. Tablet Setup Script (the evening)

Do this 30 minutes before service opens, before the rush.

1. Power on the tablet. Plug it in or verify the battery is at least 80%.
2. Connect to the restaurant Wi-Fi. Confirm it is the same network the tablet used when you set up the kiosk session.
3. Tap the home-screen PWA icon — should land directly on `/kiosk/scan` with the staff preparation screen showing "Какво яде този гост?" and the "Сканирай бона" and "Избери ръчно" buttons.
4. Hand the tablet to the waiter who will run it tonight. Do not set it up at the checkout yourself — the waiter should do the first real scan without help.

**If the tablet shows the public landing page or a login screen instead of `/kiosk/scan`:**

The kiosk cookie has expired or was cleared. Go to `/dashboard/tablet` on the owner's browser, find the session for this device in "Свързани устройства", tap "Копирай връзката", open that link on the tablet. It should redirect automatically to `/kiosk/scan` and set the cookie again. The session row is not revoked — reconnecting takes 10 seconds.

**If "Стартирай на това устройство" is needed:** open `/dashboard/tablet` directly on the tablet browser while the owner is logged in, tap "Стартирай на това устройство". The browser will sign out of the owner session and switch to kiosk mode. The dashboard will require a fresh login after this.

---

## 4. Manual Fallback Walkthrough

Waiters must know this before the first customer. Spend 5 minutes showing them — do not assume they read anything.

**What triggers the fallback:**

- AI extraction fails or times out — the kiosk automatically shows the manual dish picker ("Избери ръчно").
- AI returns no matched items — same result.
- Scan quota is exhausted — the kiosk silently falls back to manual with no error message visible to the customer. The waiter sees the manual screen.

**The waiter steps:**

1. Tap "Избери ръчно" (or see the manual screen appear automatically after a failed scan).
2. Scroll or search the dish list. Tap each dish the customer ordered. A checkmark appears. Selected count shows "X избрани" at the bottom.
3. Tap "Продължи с избраните".
4. Tap "Започни оценяване" to hand off to the customer.
5. Customer rates. Waiter steps away.

**Tell the waiter in Bulgarian:**

> "Ако сканирането не работи, избери ястията на ръка. Това е нормално."

That is all they need. Do not explain AI, do not explain tiers, do not explain confidence scores. One sentence.

---

## 5. Known Failure Modes

For each failure mode below, the expected behavior and the staff-facing response are described.

### Gemini timeout

The Gemini API call did not complete in time. The kiosk cancels the request and falls back to the manual dish picker. No error appears on the customer-facing screen.

What the waiter sees: the manual screen appears with "Не успяхме да разпознаем бона. Избери ястията ръчно и продължи."

Staff response: tap the dishes manually and continue. Do not retry the scan — the customer is waiting.

> "Апаратът не успя да прочете бележката. Избери ястията ръчно — отнема 20 секунди."

### Blurry or unreadable photo

Gemini responds with `{"items": [], "error": "unreadable"}`. The API returns no matched items. The kiosk falls back to manual.

What the waiter sees: same manual fallback screen.

Staff response: proceed manually. If the same waiter has repeated blurry scans, check that they are holding the tablet steady and that the receipt is lying flat.

> "Бележката не се вижда ясно. Продължи с ръчния избор."

### No menu match — most rows show `неразпознато`

Gemini reads the receipt but cannot match items to the menu. Review screen shows rows with match source "неразпознато". Matched rows are preselected; unknown rows are ignored by default.

What the waiter sees: the review screen with most rows empty or crossed out.

Staff response: in the review screen, the waiter can tap each unmatched row and pick the correct menu item from a dropdown. Alternatively, tap "Промени ръчно" to go to the full manual picker and select dishes there.

This failure mode improves over time as the alias learning loop runs. Every correction the waiter makes in the review screen is stored in `receipt_aliases` and fed back to Gemini on the next scan.

> "Апаратът не познава тези ястия от бележката. Избери ги ръчно — следващия път ще ги знае."

### Scan limit exhausted

`canScanReceipt()` returns exhausted. The API blocks the Gemini call. The kiosk falls to the manual picker with no error visible to the customer. The waiter header shows "Сканирането е спряно заради лимита. Ръчният избор остава достъпен."

The customer never sees this. Manual selection continues normally. No feedback session is blocked.

Action after the shift: check `/dashboard/billing` — if the Pro trial credits are spent, either start a new grant or upgrade to Pro before the next shift.

> "Сканирането е изчерпано за тази нощ. Продължавай с ръчния избор — работи абсолютно същото."

### Tablet loses Wi-Fi mid-session

The feedback submission call to `/api/feedback` fails silently. The customer sees "Не успяхме да запазим отзива. Опитай пак." The thank-you screen does not appear.

Staff response: tap "Опитай пак". If Wi-Fi is still down, the session cannot be saved. The kiosk resets after 30 minutes of inactivity — the rating is lost.

If the tablet drops Wi-Fi repeatedly in one spot, move it to a location with a stronger signal or connect it via a mobile hotspot for the rest of the shift. Write this down — it is a venue setup problem, not a product bug.

> "Интернетът спря за секунда. Натисни 'Опитай пак'."

---

## 6. Kill / Pivot Thresholds

Decide on these thresholds **before the shift starts**. Write the commit: "I will pivot the plan if X." If you measure against thresholds you set after seeing the data, you are fooling yourself.

### Session completion rate: ≥ 30%

A completed session is one where a customer rated at least one dish or gave an overall "Харесва ми / Не ми харесва" answer.

Count: completed sessions / total sessions started (waiter tapped "Започни оценяване").

**If below 30%:** the customer form is wrong. The rating screen is too slow, too long, or too confusing. Before the next shift, run the form on paper or on a phone and watch someone use it without explaining anything.

### Scans yielding at least one matched item: ≥ 40%

Count: scan attempts where Gemini returned at least one non-`unknown` row / total scan button taps.

**If below 40%:** AI receipt matching is not reliable enough to be the primary flow. Switch to manual-first: show the manual picker immediately and offer "Сканирай бона" as a secondary option. Pause further investment in AI scan accuracy until manual baseline is proven.

### Owner opens `/dashboard` within 24 hours of the shift: yes / no

Check the Supabase `auth.audit_log_entries` or add a simple last-seen field to the restaurants table. The question is binary: did the owner open the dashboard the next morning?

**If no:** the dashboard is not pulling them back. The next bet is push notifications and a Monday-morning ritual (weekly summary email or push, scheduled by cron). Without a pull mechanism, retention will not happen on its own.

### Waiter speed complaints: 0 acceptable

Count: any quote from a waiter that says the tablet is slowing them down — "този таблет ме бави", "нямам време за това", "клиентите чакат", or anything equivalent.

**If any:** stop using the tablet for the rest of the shift. Collect the exact complaint word for word. The workflow is wrong — either the number of taps is too high, the screen transitions are too slow, or the waiter was not trained properly. All three must be investigated before the next shift. Do not ship UI changes based on one night; diagnose first.

---

## 7. One-Line Post-Shift Questionnaire

Ask these questions immediately after the shift, while the experience is fresh. Pen and paper, or voice memo — do not send a form.

### For the waiter

> "Кое те забави най-много?"

> "Какво беше излишно?"

One question at a time. Wait for the answer. Do not prompt or suggest. If they say "nothing" to both, they are being polite — ask for the moment that felt the slowest.

### For the owner

> "Утре какво ще погледнеш първо?"

> "Имаше ли момент, в който поиска да не съществува таблетът?"

The first question tells you whether the dashboard has a natural pull. The second surfaces the emotional low point of the evening, which is usually the most actionable signal.

---

## 8. What NOT to Do During the Shift

These are hard constraints, not suggestions.

**Do not push code.** If you find a bug during the shift, write it down — exact steps to reproduce, what the screen showed, what you expected. Fix it after.

**Do not "quickly add" a feature the owner asks for verbally.** Owner asks: "Can you make it show the table number?" The answer is: "Good idea — I'll write that down." Not: "Give me two minutes."

**Do not silently change kiosk copy because a customer looked confused.** If a customer hesitated at "Харесва ми / Не ми харесва", that is data. Write it down. Changing copy mid-shift invalidates the measurement.

**Do not stand next to the tablet.** Observe from across the room. If you are the safety net, you are not measuring anything — you are running the product manually. If something goes wrong and no one calls the developer's number, the product handled it. If someone calls, that is also data.

---

## 9. After the Shift (within 48 hours)

### Triage

Review the bugs and observations you wrote down during the shift. Classify each as:

- **Blocking** — broke a customer flow or a waiter flow. Fix before the next shift.
- **Non-blocking** — annoyance, confusion, or improvement. Triage in the next sprint.
- **Out of scope** — venue-specific or infrastructure (Wi-Fi, receipt format). Note it, do not build it yet.

Only fix blocking bugs before the next shift. Do not scope-creep.

### Update docs

Per the documentation update rule in `AGENTS.md`:

- If the feedback flow changed or broke: update `docs/04-business-logic.md`.
- If you learned something about the product or the target user: update `docs/00-product.md`.
- If the local testing checklist missed a step: update `docs/LOCAL-TESTING.md`.

### Kill / pivot / proceed decision

Evaluate each threshold from section 6 against the real numbers. Write the decision in a dated note (a commit message, a Notion page, a text file — anywhere that is not your head):

- Session completion rate: X% — proceed / pivot
- Scan match rate: X% — proceed / pause AI
- Owner opened dashboard next day: yes / no
- Waiter speed complaints: X — proceed / stop

If any threshold triggers a pivot, that pivot is the next task. No new features until the pivot is resolved.

### Owner week-1 summary

Send the owner a short message — WhatsApp, Viber, or SMS, whatever they use — with:

- How many customers rated dishes tonight.
- The highest-rated dish and the lowest-rated dish (if there is enough data).
- One sentence about what happens next.

Do this even if the data is thin. "3 клиенти оцениха ястия довечера. Пилешката чорба взе 5 звезди. Следващата седмица ще видим повече." This keeps the owner engaged and makes the product feel alive before the dashboard has enough data to show trends automatically.
