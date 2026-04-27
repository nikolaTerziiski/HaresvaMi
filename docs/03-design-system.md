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

### Primary palette

```css
/* Coral — the brand color, used sparingly for emphasis */
--color-coral-50: #fff4f4;
--color-coral-100: #ffe5e6;
--color-coral-200: #ffcbcd;
--color-coral-300: #ffa0a4;
--color-coral-400: #ff7a80;
--color-coral-500: #ff5a5f; /* PRIMARY BRAND */
--color-coral-600: #ed3f45;
--color-coral-700: #c82f35;
--color-coral-800: #a02227;
--color-coral-900: #7a1b1f;

/* Warm neutrals — for everything else */
--color-cream-50: #fbfaf7; /* Page background */
--color-cream-100: #f5f2ec;
--color-cream-200: #ebe6dc;

--color-ink-900: #1a1814; /* Primary text */
--color-ink-700: #4a4640; /* Secondary text */
--color-ink-500: #8a857c; /* Muted text */
--color-ink-300: #c4bfb5; /* Borders */
--color-ink-100: #e8e4dc; /* Subtle dividers */

/* Functional colors — used very sparingly */
--color-success: #2d8659; /* Pickle green, not Apple green */
--color-warning: #d9883b; /* Mustard, not safety orange */
--color-error: #c82f35; /* Coral-700, same family as brand */
```

### Color rules

1. **Coral is for one thing per screen.** A primary CTA, a key metric, a notification dot. Never two coral elements competing for attention.
2. **Backgrounds are cream, not white.** Pure white feels sterile and SaaS-y. `#FBFAF7` is warmer and more restaurant-like.
3. **Text is ink, not pure black.** `#1A1814` has warmth.
4. **No gradients.** Anywhere. Solid colors only.
5. **No shadows for "depth."** Use borders (`1px solid var(--color-ink-100)`) for separation.
6. **No glassmorphism, no blur effects.**

## Typography

### Font

**Manrope** — single family, three weights.

```css
font-family: "Manrope", system-ui, sans-serif;
```

Weights used:

- `400` — body text
- `500` — labels, secondary headings
- `700` — primary headings, emphasis

Why Manrope:

- Excellent Cyrillic glyphs (most fonts have weak BG support)
- Slightly geometric but warm
- Free, open source
- Loads fast

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
3. **Never use `font-weight: 600`.** Jumps to 700.
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

**Primary** — coral background, cream text. One per screen.

```tsx
<button className="bg-coral-500 hover:bg-coral-600 text-cream-50 font-medium px-6 py-3 rounded-md transition-colors">
  Запази
</button>
```

**Secondary** — ink-100 background, ink-900 text. The default action.

```tsx
<button className="bg-ink-100 hover:bg-ink-200 text-ink-900 font-medium px-6 py-3 rounded-md transition-colors">
  Откажи
</button>
```

**Ghost** — transparent, ink-700 text. For tertiary actions.

```tsx
<button className="text-ink-700 hover:text-ink-900 hover:bg-ink-100 font-medium px-6 py-3 rounded-md transition-colors">
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
<div className="bg-cream-50 border border-ink-100 rounded-lg p-6">
  {/* Card content */}
</div>
```

Rules:

- No drop shadows by default
- Border on cream-50 background uses `border-ink-100`
- Card padding is `p-6` (24px) standard, `p-8` for hero cards
- No nested cards. If you need a "card inside a card," it's a section, not a card.

### Inputs

```tsx
<input className="w-full bg-cream-50 border border-ink-300 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 rounded-md px-4 py-3 text-base text-ink-900 placeholder:text-ink-500" />
```

- Always show labels above inputs, never placeholder-as-label
- Error states use `border-error` and a small message below
- Required fields marked with a tiny coral dot, not asterisk

### Forms

- Labels: `text-sm font-medium text-ink-700`
- Spacing between fields: `gap-4` (16px)
- Submit button: full-width on mobile, auto-width on desktop
- Loading states: disable button, show "Запазване..." text, no spinner

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
4. **High contrast.** Restaurants are often dimly lit. Cream background, ink-900 text, coral CTAs.
5. **Animations are slow and confident.** 300ms transitions, ease-out curves. Never bouncy or playful.
6. **One action per screen.** Standby → tap to scan. Scan → take photo. Rate → tap rating. Done. No multi-step forms on one screen.
7. **Restaurant logo prominently displayed.** Reinforces this is THEIR experience, not ours.

### Kiosk standby screen example

```
┌────────────────────────────────────────────────┐
│                                                │
│            [Restaurant logo, large]            │
│                                                │
│              "Как беше всичко?"                │
│                                                │
│         [Голям coral бутон: Сканирай бона]    │
│                                                │
│                                                │
│                         haresva.mi (tiny, bottom-right)
└────────────────────────────────────────────────┘
```

## Voice & copy

This is part of design. Words matter as much as visuals.

### Bulgarian copy principles

1. **Write like a Bulgarian wrote it, not like Google Translate.**
2. **Use "ти" (informal you), not "Вие" (formal).** This is a friendly product, not a bank.
3. **Short sentences.** Bulgarian sentences are naturally longer than English. Trim aggressively.
4. **Avoid corporate jargon.** "Управление на менюто" is fine. "Менаджмънт на менюто" is bad.
5. **Use action verbs in CTAs.** "Сканирай бона" not "Сканиране на бон."
6. **Insights speak in real numbers and time.** "Кебапчето пада на 5.2/10 от 3 седмици" not "Има отрицателна тенденция в оценките на ястие 'Кебапче'."

### English copy principles

1. **Translation, not transcreation.** EN is for foreign tourists in BG restaurants and the rare English-speaking owner. Keep it simple, direct, no idioms.
2. **Same informal tone as BG.** "How was everything?" not "How was your dining experience?"

## Tailwind config

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#FFF4F4",
          100: "#FFE5E6",
          200: "#FFCBCD",
          300: "#FFA0A4",
          400: "#FF7A80",
          500: "#FF5A5F",
          600: "#ED3F45",
          700: "#C82F35",
          800: "#A02227",
          900: "#7A1B1F",
        },
        cream: {
          50: "#FBFAF7",
          100: "#F5F2EC",
          200: "#EBE6DC",
        },
        ink: {
          900: "#1A1814",
          700: "#4A4640",
          500: "#8A857C",
          300: "#C4BFB5",
          100: "#E8E4DC",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      fontSize: {
        "4xl": ["3.5rem", { lineHeight: "1.1" }],
      },
      borderRadius: {
        xl: "24px",
      },
    },
  },
} satisfies Config;
```

## Design system enforcement checklist

Before merging any UI code, verify:

- [ ] No purple, blue, or green gradients anywhere
- [ ] At most one coral element per screen as primary
- [ ] Background is `cream-50`, not pure white
- [ ] Text is `ink-900`, not pure black
- [ ] Maximum 3 font sizes on screen
- [ ] Empty states have human-written copy, not "No data"
- [ ] Buttons follow primary/secondary/ghost variants
- [ ] No drop shadows used for depth
- [ ] Bulgarian copy uses informal "ти"
- [ ] Touch targets in kiosk mode are 64px+ tall
