# 03 — Design System

> **The single most important doc for avoiding "vibe-coded" generic SaaS look.**
> Read this before writing any UI code. Reference it in every component.

## Brand identity

HaresvaMi feels like the warm corner of a Bulgarian restaurant. Not corporate. Not minimal-Scandinavian. Not Silicon Valley dashboard. It's the digital equivalent of a handwritten chalkboard menu — clean, intentional, but with personality.

**Words that describe the brand:**
Warm. Honest. Bulgarian. Confident. Quiet. Unfussy.

**Words the brand is NOT:**
Sleek. Futuristic. Premium. Enterprise. AI-powered. Revolutionary. Gradient-heavy.

## Color system

### Source of truth

`app/globals.css` is the only source of truth for brand and Tailwind v4 tokens. New page-level work should use the mehana CSS variables first. Do not hard-code brand hex values in components.

```css
/* Mehana page tokens */
--bg: #f6f1e8;
--bg-2: #ede4d3;
--paper: #fdf9f1;
--ink: #1a1512;
--ink-2: #4a3f35;
--ink-mute: #8a7a68;
--rule: #d9cebb;
--accent: #c24d2c; /* PRIMARY BRAND: terracotta */
--accent-2: #e89a3c;
--plum: #5b2a2a;
--good: #6b8f5a;
--bad: #c24d2c;

/* Tailwind/shadcn support tokens also live in app/globals.css */
--color-cream-50: #fbfaf7;
--color-ink-900: #1a1814;
--color-success: #2d8659;
--color-warning: #d9883b;
--color-error: #c82f35;
```

The older `--color-coral-*` Tailwind palette is still available for shared shadcn-style utility components, but it is not the brand source of truth. For new marketing, auth, dashboard, and kiosk surfaces, use `var(--accent)` for the brand action color.

### Color rules

1. **Terracotta is for one thing per screen.** A primary CTA, a key metric, a notification dot. Never let multiple terracotta elements compete.
2. **Backgrounds are warm, not white.** Use `--bg` / `--paper` or the cream Tailwind tokens.
3. **Text is ink, not pure black.** Use `--ink` / `--ink-2` or the ink Tailwind tokens.
4. **No gradients.** Anywhere. Solid colors only.
5. **No shadows for "depth."** Use borders (`1px solid var(--rule)`) for separation.
6. **No glassmorphism, no blur effects.**

## Typography

### Font

The current app registers three `next/font` families in `app/layout.tsx` and exposes them through variables in `app/globals.css`.

```css
--f-display: var(--font-instrument-serif), "Cormorant Garamond", Georgia, serif;
--f-ui: var(--font-inter), system-ui, sans-serif;
--f-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
```

Use them like this:

- **Instrument Serif** (`--f-display`) — brand moments, large marketing headings, expressive numbers.
- **Inter** (`--f-ui`) — all Bulgarian UI, dashboard, forms, kiosk instructions, buttons.
- **JetBrains Mono** (`--f-mono`) — technical IDs, receipt/debug metadata, never body copy.

Cyrillic guidance:

- Bulgarian UI must render through Inter or another tested Cyrillic-capable fallback.
- Instrument Serif is display flavor, not the default Bulgarian reading face. Avoid long Cyrillic paragraphs in it.
- When touching `next/font` setup, keep Cyrillic coverage for UI text and verify real Bulgarian strings on Windows and Android.

### Type scale

```css
--text-xs: 0.75rem; /* 12px — captions, timestamps */
--text-sm: 0.875rem; /* 14px — secondary labels */
--text-base: 1rem; /* 16px — body */
--text-lg: 1.125rem; /* 18px — emphasized body */
--text-xl: 1.5rem; /* 24px — section headings */
--text-2xl: 2rem; /* 32px — page titles */
--text-3xl: 2.5rem; /* 40px — landing headlines */
--text-4xl: 3.5rem; /* 56px — kiosk standby text */
```

### Type rules

1. **Maximum 3 sizes per screen.** No tiny captions next to giant headings next to medium body. Restraint.
2. **Line height 1.5 for body, 1.2 for headings.**
3. **Use weight sparingly.** `400` for body, `500` for labels, `600` only where the UI system already uses it, `700` for strong emphasis.
4. **No uppercase by default.** Bulgarian doesn't read well in all-caps.
5. **Numbers in stats use weight 500, not 700.** Avoids "loud dashboard" feel.

## Spacing

Use Tailwind's default 4px scale, but stick to these values 95% of the time:

```
gap-2  (8px)   — tight related elements
gap-4  (16px)  — standard
gap-6  (24px)  — sections within a card
gap-8  (32px)  — between cards
gap-12 (48px)  — between major page sections
```

Avoid `gap-3`, `gap-5`, `gap-7` — these are reach values that often signal indecision.

## Border radius

```css
--radius-sm: 4px; /* Inputs, badges */
--radius-md: 8px; /* Buttons, cards */
--radius-lg: 16px; /* Major containers, modals */
--radius-xl: 24px; /* Hero elements, kiosk buttons */
--radius-full: 9999px; /* Avatars, pills, the big like/dislike buttons */
```

**Rule:** Pick one radius for the whole product feel. We use `md` (8px) as the default. Big touch targets in kiosk mode use `xl` (24px) or `full`.

## Components

### Buttons

Three variants, no more.

**Primary** — terracotta background, paper text. One per screen.

```tsx
<button className="rounded-md bg-[var(--accent)] px-6 py-3 font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)]">
  Запази
</button>
```

**Secondary** — paper background, ink text, rule border. The default action.

```tsx
<button className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-6 py-3 font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg-2)]">
  Откажи
</button>
```

**Ghost** — transparent, muted ink text. For tertiary actions.

```tsx
<button className="rounded-md px-6 py-3 font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]">
  Изтрий
</button>
```

**Kiosk-mode buttons** — much larger touch targets.

- Minimum 64px tall
- Minimum 200px wide
- Font size `text-2xl`
- Border radius `rounded-full` for primary actions

### Cards

```tsx
<div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
  {/* Card content */}
</div>
```

Rules:

- No drop shadows by default
- Border on warm paper/background uses `var(--rule)`
- Card padding is `p-6` (24px) standard, `p-8` for hero cards
- No nested cards. If you need a "card inside a card," it's a section, not a card.

### Inputs

```tsx
<input className="w-full rounded-md border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)] focus:outline-none" />
```

- Always show labels above inputs, never placeholder-as-label
- Error states use `border-error` and a small message below
- Required fields marked with a tiny terracotta dot, not asterisk

### Forms

- Labels: `text-sm font-medium text-ink-700`
- Spacing between fields: `gap-4` (16px)
- Submit button: full-width on mobile, auto-width on desktop
- Loading states: disable button, show "Запазване..." text, no spinner

### Dashboard setup flows

For owner setup tasks that have to be understood quickly, use a compact step strip above the work area instead of a long explanatory panel.

- Keep it to 3-4 steps with one short verb-led title per step.
- Use numbered circles; only the current step uses terracotta.
- Put the actual form/action card immediately below the steps.
- Use owner-facing Bulgarian like `връзка за таблет`, `свързано устройство`, `отмени достъпа`, and `валидна до`.
- Avoid implementation terms in UI copy. Owners should not see words like token, cookie, HttpOnly, or authorization.

## Iconography

### Rules

1. **Lucide icons are allowed, but used sparingly.** Default `size={20}` and `strokeWidth={1.5}` for a softer look.
2. **Never use icons as decoration.** Every icon must communicate a function.
3. **Custom illustrations welcome.** For empty states, onboarding, kiosk standby — consider hand-drawn or SVG illustrations instead of generic icons.
4. **No emojis in UI chrome.** Emojis are okay in user content (comments, restaurant names).
5. **Two exceptions for emojis in UI:** the heart ❤️ and broken heart 💔 on the final rating screen — these reinforce the "Харесва ми / Не ми харесва" emotional moment.

## Empty states

This is where AI-generated UIs always fail. Empty states must have personality.

### Bad (generic)

```
No data available
[Add new]
```

### Good (HaresvaMi style)

```
Все още няма отзиви

Когато сканираш първия бон с Харесва ми, отзивите ще се появяват тук.

[Опитай тестов бон]
```

### Empty state pattern

```tsx
<div className="text-center py-16 max-w-md mx-auto">
  <div className="text-4xl mb-4">
    {/* Optional small illustration or large icon */}
  </div>
  <h3 className="text-xl font-bold text-ink-900 mb-2">{title}</h3>
  <p className="text-ink-700 mb-6">{description}</p>
  {action && <Button>{action}</Button>}
</div>
```

## The kiosk screen — special design treatment

The kiosk screen is what customers see. It's the most important UI in the product. It should feel like a beautiful restaurant experience, not a generic survey.

### Kiosk design rules

1. **Fullscreen always.** No headers, no chrome, no navigation.
2. **Landscape orientation by default.** Most tablets stand horizontally at checkout.
3. **Large touch targets.** Minimum 64px height for any tappable element.
4. **High contrast.** Restaurants are often dimly lit. Warm background, ink text, terracotta CTAs.
5. **Animations are slow and confident.** 300ms transitions, ease-out curves. Never bouncy or playful.
6. **One action per screen.** Standby → tap to scan. Scan → take photo. Rate → tap rating. Done. No multi-step forms on one screen.
7. **Restaurant logo prominently displayed.** Reinforces this is THEIR experience, not ours.
8. **Manual fallback stays visible.** When AI scans are exhausted, unavailable, or unclear, the waiter can still select items manually.
9. **Tablet-first, mobile-safe.** Optimize for a 10-inch Android tablet in landscape, but keep every kiosk state usable on narrow phones and portrait tablets. The current scan layout collapses below roughly 900px.
10. **Bulgarian text must wrap cleanly.** No fixed-width labels that clip long Cyrillic words; buttons can grow taller before text overflows.

### Staff receipt review

The receipt review state is staff-facing, not customer-facing. It can be denser than the customer rating screen, but still needs touch-friendly controls because it runs on the same tablet.

- Show receipt rows as compact correction rows: raw receipt text, quantity, match source pill (`alias`, `fuzzy`, `unknown`), current menu match, and a menu selector.
- Confident matches should feel pre-approved. The waiter only acts when a row is wrong or unknown.
- Unknown rows may expose an ignore action, but ignored rows must look secondary and should not compete with the primary continue button.
- Keep the primary continue button large and terracotta; manual selection stays as the secondary escape hatch.

### Kiosk standby screen example

```
┌────────────────────────────────────────────────┐
│                                                │
│            [Restaurant logo, large]            │
│                                                │
│              "Как беше всичко?"                │
│                                                │
│      [Голям terracotta бутон: Сканирай бона]  │
│                                                │
│                                                │
│                         haresva.mi (tiny, bottom-right)
└────────────────────────────────────────────────┘
```

### Customer rating screen density

On 10-inch landscape tablets, the customer rating screen should keep the submit footer visible while the dish list scrolls internally.

- Optimize first for `1280x800`, `1024x768`, and `1366x768`.
- Aim for 7-8 visible dish rows at `1280x800` when dish names are typical length.
- Dish rows may be compact, but keep dish names at least 17px and star buttons about 44px square.
- Keep the optional overall `Харесва ми / Не ми харесва` choice visually secondary to per-dish stars and the primary submit button.
- The footer submit button must remain visible without scrolling the whole page.

## Voice & copy

This is part of design. Words matter as much as visuals.

### Bulgarian copy principles

1. **Write like a Bulgarian wrote it, not like Google Translate.**
2. **Use "ти" (informal you), not "Вие" (formal).** This is a friendly product, not a bank.
3. **Short sentences.** Bulgarian sentences are naturally longer than English. Trim aggressively.
4. **Avoid corporate jargon.** "Управление на менюто" is fine. "Менаджмънт на менюто" is bad.
5. **Use action verbs in CTAs.** "Сканирай бона" not "Сканиране на бон."
6. **Insights speak in real numbers and time.** "Кебапчето пада на 2.6/5 от 3 седмици" not "Има отрицателна тенденция в оценките на ястие 'Кебапче'."

### English copy principles

1. **Translation, not transcreation.** EN is for foreign tourists in BG restaurants and the rare English-speaking owner. Keep it simple, direct, no idioms.
2. **Same informal tone as BG.** "How was everything?" not "How was your dining experience?"

## Tailwind v4 Tokens

There is no `tailwind.config.ts` in the current app. Tailwind v4 reads project tokens from `app/globals.css`.

```css
@theme {
  --font-display:
    var(--font-instrument-serif), "Cormorant Garamond", Georgia, serif;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-3xl: 2.5rem;
  --text-4xl: 3.5rem;
}

:root {
  --accent: #c24d2c;
  --bg: #f6f1e8;
  --paper: #fdf9f1;
  --ink: #1a1512;
}
```

## Design system enforcement checklist

Before merging any UI code, verify:

- [ ] No purple, blue, or green gradients anywhere
- [ ] At most one terracotta/accent element per screen as primary
- [ ] Background is `--bg`, `--paper`, or a cream token, not pure white
- [ ] Text is `--ink` or an ink token, not pure black
- [ ] Maximum 3 font sizes on screen
- [ ] Empty states have human-written copy, not "No data"
- [ ] Buttons follow primary/secondary/ghost variants
- [ ] No drop shadows used for depth
- [ ] Bulgarian copy uses informal "ти"
- [ ] Touch targets in kiosk mode are 64px+ tall
- [ ] Kiosk scan failure and AI-limit states preserve manual item selection
- [ ] Kiosk screens wrap Bulgarian text cleanly on tablet landscape, tablet portrait, and narrow mobile
