# BMAA 2026 — Design System

**Project:** Bayelsa Musical Artiste Awards 2026 — "Beyond the Plains"
**Purpose of this doc:** Single source of truth for visual language. Every UI decision (color, type, spacing, motion) should trace back to something in this file. If a design decision isn't covered here, default to the principle in §11 (mobile-first, dark/gold, condensed data density) rather than inventing a new direction.

---

## 1. Brand Overview

BMAA is a returning event (dormant for several years, relaunching for 2026) celebrating Bayelsa's music scene. The visual identity — pulled directly from the official flyer and trophy photography — is **dark, glossy, gold-lit, award-show energy**. Not flat/corporate. Think stage lighting, not a SaaS dashboard, for the public-facing site. The admin portal can be calmer/more utilitarian since it's a working tool, but should still carry the gold accent as brand DNA.

---

## 2. Color Palette

Extracted directly from the official flyer (not estimated):

| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#110804` | Primary background (near-black, warm undertone — never pure `#000`) |
| `--gold-primary` | `#d2942e` | Headlines, primary CTA fill, star/icon accents, active states |
| `--bronze-accent` | `#904206` | Secondary buttons, hover states, dividers |
| `--brown-deep` | `#6c3c0a` | Borders, card outlines, subtle depth |
| `--surface` | `#1a120c` | Card/panel backgrounds (lighter than base bg, still dark) |
| `--white` | `#F5F1EB` | Body text on dark (off-white, not pure white — softer against gold) |

Semantic colors (admin status pills, alerts) — intentionally desaturated so they don't fight the gold brand:

| Token | Hex | Usage |
|---|---|---|
| `--status-pending` | `#C9A227` | Muted amber — pending review |
| `--status-approved` | `#3F9142` | Muted green |
| `--status-rejected` | `#B3412F` | Muted rust-red (not fire-engine red — stays in the warm family) |
| `--status-live` | `#2E8FA3` | Cool teal — used *only* for the live-voting "LIVE" indicator, deliberately the one cool color in the palette so it pops against all the warm tones |

**Tailwind config mapping:** add all of the above under `theme.extend.colors.brand.*` — do not use raw hex in components.

---

## 3. Typography

Confirmed via direct inspection of the reference site. Three-font system, each with a distinct job:

| Font | Role | Weights used | Source |
|---|---|---|---|
| **Space Grotesk** | Display / headings — hero title, section headers, category names | 500 (subheads), 700 (hero/display) | Google Fonts, variable |
| **Inter** | Body copy, form labels/inputs, buttons, all general UI text | 400 (body), 500 (labels), 600 (buttons/emphasis) | Google Fonts, variable |
| **JetBrains Mono** | Reference IDs, vote counts, countdown timers, dashboard stats, timestamps | 500 | Google Fonts |

**Note on Space Grotesk weight:** if inspecting the reference site shows an odd computed name like "Space Grotesk Light Bold," that's a variable-font artifact (browsers sometimes report a garbled label for an interpolated instance), not a real named style. Use the static weight tokens above (500/700) rather than trying to replicate an inspector's mid-range reading.

### Type Scale

| Token | Font | Size (mobile) | Size (desktop) | Weight | Tracking |
|---|---|---|---|---|---|
| `display` | Space Grotesk | 2.25rem / 36px | 4rem / 64px | 700 | -0.02em |
| `h1` | Space Grotesk | 1.75rem / 28px | 2.5rem / 40px | 700 | -0.01em |
| `h2` | Space Grotesk | 1.375rem / 22px | 1.875rem / 30px | 600 | -0.01em |
| `h3` | Space Grotesk | 1.125rem / 18px | 1.5rem / 24px | 500 | normal |
| `body` | Inter | 0.9375rem / 15px | 1rem / 16px | 400 | normal |
| `caption` | Inter | 0.8125rem / 13px | 0.875rem / 14px | 400 | normal |
| `mono-lg` | JetBrains Mono | 1.5rem / 24px | 2rem / 32px | 500 | -0.01em (vote counts, countdown) |
| `mono-sm` | JetBrains Mono | 0.75rem / 12px | 0.8125rem / 13px | 500 | normal (reference IDs, timestamps) |

Why this combination works for the brief (long category names, dense admin tables, small mobile screens): Inter is one of the most legible typefaces at small sizes, which is where most of this app's text actually lives (form labels, table rows, category names on cards). Space Grotesk carries the drama for the handful of large display moments. JetBrains Mono makes numbers — especially vote counts — read as precise and tamper-evident rather than decorative.

---

## 4. Spacing & Layout Grid

- Base unit: **4px**. Use Tailwind's default scale (4, 8, 12, 16, 24, 32, 48, 64...) — don't introduce arbitrary values.
- Mobile container padding: `16px` horizontal minimum.
- Max content width (desktop): `1280px`, centered.
- Card grid gap: `12px` mobile / `20px` desktop.

### Breakpoints (Tailwind defaults — do not customize)

| Breakpoint | Width | Primary use |
|---|---|---|
| base | 0–639px | **Design here first.** 98% of traffic is mobile. |
| `sm` | 640px | Large phones landscape |
| `md` | 768px | Tablets — admin sidebar starts appearing here |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktop |

---

## 5. Elevation & Surfaces

- No pure flat cards. Every card/panel gets a subtle `1px solid var(--brown-deep)` border plus a soft dark shadow (`shadow-black/40`) — this replicates the flyer's glossy, lit-from-above feel without needing heavy gradients everywhere.
- Gold elements (primary buttons, active nav icons, "LIVE" badge) get a soft outer glow on hover/focus: `box-shadow: 0 0 24px -4px rgba(210, 148, 46, 0.45)`. Use sparingly — glow on everything reads as noise, not premium.
- Admin dashboard cards: flatter, `--surface` background, no glow, gold used only as a thin top-border accent per card to keep the working UI calm.

---

## 6. Components

**Buttons**
- Primary: `--gold-primary` fill, `--bg-base` text (dark text on gold for contrast, not white-on-gold), rounded-md, Inter 600.
- Secondary: `--bronze-accent` fill or outline variant, `--white` text.
- Destructive (reject action): `--status-rejected`, used only inside admin.
- Ghost: transparent, gold text, gold underline on hover.

**Status Pills** (submissions table, artist tracking)
- Pill shape, `caption` size, semantic color at 15% opacity background + full-opacity text/border.

**Category Jump-Nav** (`/voting` page — researched pattern, see `REQUIREMENTS.md` §5.2)
- Sticky horizontal chip bar pinned near the top of the voting page, one chip per category. **This is jump-navigation, not a filter/tab-switch** — tapping a chip smooth-scrolls the page to that category's section; it never hides other sections. Real high-traffic voting platforms (MTV VMAs, People's Choice Awards) keep all categories visible in one continuous scroll for exactly this reason — it supports both a voter who knows exactly who they want and one who's just browsing.
- Active-state highlight follows scroll position (scroll-spy) — whichever category section is currently in viewport gets the gold-highlighted chip, so a long scroll session never loses orientation.
- Each category section gets its own heading with nominee count (e.g. "Best Male Artist · 8 nominees") directly above its grid.

**Participant Card** (within each category section)
- Portrait photo (see §9 for aspect ratio), stage name in `h3`, vote count intentionally **not shown publicly** (only admin sees live counts — this must be enforced in the component, not just hidden via CSS). Category tag is omitted here since the card already lives inside its category's section heading — repeating it per-card is redundant at this density.
- Tap target for "Vote" is the full card on mobile, not a tiny button — this is a mobile-first, thumb-driven interaction.

**Vote Confirmation Modal**
- Triggered on card tap. Shows: participant photo, stage name, category, song title. One clear confirm CTA (`Cast Your Vote`), one cancel. Framer Motion spring entrance (scale 0.95→1, opacity fade), not a hard cut.
- After confirm: success state inline in the same modal (checkmark animation + "Vote counted — X of 5 votes used for this category today"), matching the 5-vote shared budget in `REQUIREMENTS.md` §5.4, not a separate page.
- Failure states get distinct, specific messaging (budget used vs. voting not open vs. voting closed) per `REQUIREMENTS.md` §5.3a — never one generic "vote failed."

**Countdown Timer** (hero + `/voting` states)
- JetBrains Mono, `mono-lg`. Segments (DD:HH:MM:SS) in individually boxed cells with `--surface` background — reads like a scoreboard, reinforces the "official award show" tone.

**Forms**
- shadcn/ui form primitives throughout, dark theme.
- File upload fields: drag-and-drop zone with visible size/format constraints stated inline (not just in a tooltip) — e.g. "JPG or PNG, max 5MB" always visible under the dropzone. **Validation fires the instant a file is selected**, not at form submit — see `REQUIREMENTS.md` §4.5 for the exact order. A rejected file shows its specific reason (wrong type / too large, with the actual size shown) right in the dropzone, and the zone stays interactive for another attempt.
- Date picker: shadcn calendar, dark theme.
- Dropdown (category select): must handle 26 options gracefully on mobile — use a full-screen sheet/drawer pattern on mobile rather than a tiny native `<select>` popover, searchable if shadcn Combobox is used.

**Admin Navigation**
- **Mobile (< 768px):** fixed bottom tab bar, 5 icons max (Dashboard, Submissions, Voting, Settings, More/overflow if needed), `lucide-react` icons, active state = gold icon + small gold dot indicator, `--surface` background with top border.
- **Desktop (≥ 768px):** fixed left sidebar, collapsible (icon-only collapsed state, expand on click, remember preference in local state). Same icon set as mobile for consistency.

---

## 7. Iconography

`lucide-react` throughout — consistent stroke weight (default), gold or off-white depending on context, never mixed icon sets.

---

## 8. Motion (Framer Motion)

- Hero section: staged entrance (heading → subheading → theme tag → CTA), 80–120ms stagger, subtle upward slide (12px) + fade. Nothing bouncy — this is a formal award brand, not a playful consumer app.
- Scroll-reveal on each one-pager section (fade + slight upward slide as section enters viewport, `whileInView`, `once: true` — don't re-trigger on scroll-back, it gets annoying).
- Vote confirmation modal: spring transition as described in §6.
- Optional hero flourish: a lightweight **3D trophy element** (`@react-three/fiber` + `drei`), slow auto-rotate, replicating the trophy product photo as an interactive centerpiece. This is progressive enhancement only:
  - Lazy-load the 3D canvas (don't block initial paint).
  - Respect `prefers-reduced-motion` — fall back to the static flyer/trophy image.
  - On low-end mobile (test via a simple device-memory/connection check or just cap it to `md`+ breakpoints), skip 3D entirely and show the static image. Given 98% mobile traffic, this must never become a performance liability — it's a nice-to-have, not a requirement to gate launch on.

---

## 9. Imagery & Uploads

- **Cover Art:** square, 1:1 crop on display.
- **Bold Front-View Photo** (the one used in voting cards): portrait, 3:4 crop on display, but store the original upload and let Cloudinary handle responsive crop/transform on delivery rather than pre-cropping client-side.
- All uploads go through Cloudinary. **Validate type and size immediately on file select, before compression, before the rest of the form is even filled in** — a rejected file should never surface as a surprise at final submit. See `REQUIREMENTS.md` §4.5 for the exact validation order (raw pre-check → compress → post-compression size check → attach to form state → server re-validates at actual upload time).
- Client-side compress before upload (e.g. `browser-image-compression`) — most users are on mobile data in Nigeria, so shrinking a 12MB phone photo to something reasonable before it leaves the device matters both for their data cost and upload reliability on weaker connections. Compression only runs on files that already passed the initial type/size sanity check — don't waste time compressing a file that was never going to be accepted.
- Cloudinary delivery: always request `f_auto,q_auto` transformations, and explicit width constraints per placement (don't ship a full-res image into a 200px card).

---

## 10. Accessibility

- Gold-on-black (`#d2942e` on `#110804`) passes AA for large text/headings but is borderline for small body text — never use gold as small-text color, reserve it for headings, icons, and large UI elements. Body copy stays `--white` (`#F5F1EB`).
- All interactive elements get visible focus states (gold outline), not just hover states — matters for keyboard-nav admin users.
- Respect `prefers-reduced-motion` globally, not just for the 3D hero.

---

## 11. Guiding Principle

When in doubt: **mobile-first, dark/gold, condensed-but-legible.** Design the 375px-wide view first, always. Desktop admin sidebar and desktop landing-page layout are enhancements of the mobile experience, not the other way around.