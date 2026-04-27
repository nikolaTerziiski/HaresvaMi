# 00 — Product Vision

## The problem

Restaurant owners in Bulgaria have almost no reliable way to know which specific dishes their customers love or hate. Existing options:

- **QR code on receipt** → Almost nobody scans it. Customers leave the restaurant and forget.
- **Google reviews** → Only motivated (usually angry) customers leave them. Bias toward extremes.
- **Verbal "was everything okay?" from waiter** → Customers default to "yes, thank you" out of politeness.
- **International tools (Zonka, SurveyStance)** → Generic experience surveys. They ask "how was the food" not "how was the кебапче you actually ordered."

The owner ends up flying blind. They might know revenue per dish from the POS, but not satisfaction per dish. A dish can sell well _and_ be hated — customers order it once, dislike it, never come back, and the owner never knows.

## The insight

The moment of payment is the only reliable feedback window. The customer is still at the table, has just finished eating, and the experience is fresh. If feedback is asked at this moment with zero friction, response rates jump from <2% (QR codes) to 30%+ (handed tablet).

But generic "rate your visit 1–5" feedback is low-signal noise. The real value is **per-dish ratings tied to what the customer actually ordered**. To do that without the customer manually selecting from a menu of 80 items, we need to know what they ordered — which means reading their receipt.

## The solution

A tablet sits at the checkout. The owner is logged in, kiosk mode is active. When a customer pays:

1. Waiter taps "Сканирай бона" (scan receipt)
2. Tablet camera reads the printed receipt
3. AI extracts the items, matches them to the restaurant's menu (using a learned alias dictionary for abbreviations like "PK" → "Пържени картофи")
4. Tablet is handed to the customer
5. Customer sees: "Какво поръча днес?" with each dish, gives 1–10 rating per item (optional comment)
6. Final screen: big "❤️ Харесва ми" / "💔 Не ми харесва" buttons
7. Thank you screen, auto-resets to standby

Owner sees in dashboard:

- Per-dish satisfaction trends over time
- Plain Bulgarian alerts: "Кебапчето пада на 5.2/10 от 3 седмици. Виж отзивите →"
- % "Харесва ми" this week vs last week

## Target user (primary)

**Persona: Дани, 42, owner of a 50-seat mehana in Plovdiv**

- Owns the restaurant for 8 years
- Has 1 unused Android tablet in a drawer (was for the old POS)
- Speaks Bulgarian, broken English
- Doesn't read business books, doesn't know what NPS is
- Wants to know "do people like my new menu?" and "is the new chef good?"
- Will pay for something useful, but cancels anything he doesn't open weekly
- Heard about the product from a friend or saw it in another restaurant

**What Дани needs from the product:**

- Setup in under 30 minutes
- One-tap kiosk mode that any waiter can run
- Insights in plain Bulgarian, on his phone, once a week
- A reason to open the app every Monday morning

## Non-target users (for now)

- Restaurant chains (different sales motion, multi-location features needed)
- Hotels, bars, cafés without table service (different flow)
- English-speaking markets (will come later, BG-first now)
- Owners who don't speak Bulgarian (every word in product is BG-first)

## Business model

### Tiers

**Free (forever):**

- 1 location
- Manual item selection only (no receipt scanning)
- Up to 50 feedback responses per month
- Basic dashboard
- Bulgarian only

**Pro — €10/month** (with 14-day trial of all Pro features):

- 1 location
- AI receipt scanning (unlimited)
- Unlimited feedback responses
- Item-level analytics with trends
- Plain-Bulgarian weekly insights
- BG + EN customer interface
- Push notifications

**Restaurant Group — €40/month** (post-MVP):

- Multiple locations
- Cross-location comparisons
- Staff performance per location
- API access

### Why €10 (not €7, not €15)

- €7 doesn't cover Gemini API costs at high volume + Supabase + Stripe fees
- €15 is the price ceiling for a small Bulgarian mehana — beyond it, sales conversion drops sharply
- €10 round number, easy mental math, ~20 BGN — feels affordable

This is a starting price. Adjust after first 50 paying customers based on churn data.

### Unit economics check

At €10/month:

- Stripe fees: ~€0.50
- Supabase (per restaurant, light usage): ~€0.20
- Gemini API (assume 100 receipts/month avg): ~€0.30
- Net per restaurant: ~€9.00/month gross margin

Break-even on personal time: probably never on this product alone. This is a starter SaaS, not a unicorn play. Goal is €2-5K MRR within 12 months.

## Success metrics (v1)

**By end of Month 3:**

- 30 free-tier signups
- 10 paying restaurants
- €100 MRR
- Average response per restaurant: 50+/month
- One restaurant publicly endorsing the product

**By end of Month 12:**

- 200 free-tier signups
- 80 paying restaurants
- €800 MRR
- One case study showing "X restaurant improved Y dish from 5/10 to 8/10 after acting on feedback"

## What we are NOT

- Not a POS system
- Not a reservation system
- Not a Google Reviews replacement
- Not an analytics dashboard for chains
- Not a delivery feedback tool

Stay focused. Resist scope creep. If a feature doesn't help Дани learn what customers think of his кебапче, it doesn't ship in v1.
