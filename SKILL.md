# BMAA 2026 — Agent Build Rules

**Read `DESIGN.md` and `REQUIREMENTS.md` before this file makes full sense — this doc is the "how to build it," those are the "what it looks like" and "what it does."**

---

## 1. Stack & Versions

- Next.js — latest stable, App Router only (no Pages Router)
- React — latest stable paired with the Next.js version above
- Supabase — `@supabase/supabase-js` + `@supabase/ssr` for server/client split
- Tailwind CSS — latest, with a custom theme extension for the brand tokens in `DESIGN.md` §2–3
- shadcn/ui — install components as needed, don't bulk-install the entire library
- Framer Motion (`motion` package if using the newer naming)
- `@react-three/fiber` + `@react-three/drei` — hero 3D flourish only
- `react-hook-form` + `zod` (+ `@hookform/resolvers`)
- `recharts` — admin dashboard charts
- `lucide-react` — icons
- `papaparse`, `xlsx` (SheetJS), and a PDF export approach for admin exports
- Cloudinary — direct unsigned upload from client where possible (with a signed preset scoped to size/type) to avoid routing large files through the Next.js server unnecessarily; validate again server-side before persisting the URL
- **Bot verification (Turnstile OR hCaptcha OR built-in fallback — see note below):** `@marsidev/react-turnstile` (Cloudflare) or `@hcaptcha/react-hcaptcha` (hCaptcha) — widget on the vote form and admin login. These are interchangeable for this project's purposes; pick whichever dashboard is actually reachable when you set up keys. **If neither external dashboard is reachable, `BOT_VERIFY_PROVIDER=none` uses a fully self-contained fallback (honeypot field + submission-timing heuristic, both implemented in your own code, zero external service required) — this must not block project completion.** Server-side verification lives in one file (`lib/bot-verify.ts`, see §2/§3) specifically so this choice isn't locked in early and can be swapped later, including upgrading from the fallback to a real provider post-launch, without touching any other file.
- `@fingerprintjs/fingerprintjs` (or equivalent) — device fingerprint generation for vote eligibility

---

## 2. Project Structure

```
middleware.ts                     → rewrites {ADMIN_BASE_PATH}/* to /admin/*, 404s direct /admin/* hits
app/
  (public)/
    page.tsx                    → one-pager
    voting/
      page.tsx
  admin/                         → never linked publicly; only reachable via middleware rewrite
    layout.tsx                  → auth-gated layout, nav shell (role-aware — hides super_admin-only nav items from site_manager)
    login/page.tsx
    page.tsx                    → dashboard
    submissions/page.tsx
    voting/page.tsx             → live voting (admin only, role-aware raw-data visibility)
    settings/page.tsx
    admins/page.tsx             → super_admin only — manage site_manager accounts
  api/
    submissions/route.ts
    submissions/check/route.ts
    vote/route.ts                → verifies bot-check token (Turnstile or hCaptcha), computes fingerprint hash, calls cast_vote
    admin/
      submissions/route.ts
      submissions/export/route.ts
      voting/live/route.ts
      voting/export/route.ts
      settings/route.ts
      admins/route.ts            → super_admin only
components/
  ui/                            → shadcn primitives
  site/                          → one-pager sections (Hero, EntryForm, CategoryList, etc.)
  voting/                        → participant card, category tabs, vote modal
  admin/                         → dashboard cards, submissions table, nav (bottom bar + sidebar)
lib/
  constants/categories.ts        → single source of truth, see REQUIREMENTS.md §4.4
  supabase/
    client.ts                    → browser client
    server.ts                    → server client (service role, used only in API routes)
  auth/
    roles.ts                     → role-check helpers (requireSuperAdmin, requireAdmin), used in every /api/admin/* route
  validation/                    → zod schemas
  fingerprint.ts                 → voter fingerprint generation helper (client-side)
  bot-verify.ts                  → server-side bot-check: verifies Turnstile/hCaptcha token, OR runs the honeypot+timing fallback check when BOT_VERIFY_PROVIDER=none (see §1, §3)
  cloudinary.ts
types/
```

---

## 3. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never exposed to client
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
NEXT_PUBLIC_SITE_URL=
EMAIL_PROVIDER_API_KEY=           # confirm provider — see REQUIREMENTS.md §12
ADMIN_BASE_PATH=                  # random slug, e.g. "ops-7f3k2" — generate once, never commit the real value to a public repo history, never hardcode in source

# Bot verification — set ONE provider pair below and leave the others blank.
# BOT_VERIFY_PROVIDER tells lib/bot-verify.ts which one to use.
# "turnstile" | "hcaptcha" | "none"
#
# If "none": no external service or dashboard needed at all. lib/bot-verify.ts
# instead checks a hidden honeypot field (must arrive empty) and a submission-
# timing threshold (reject anything submitted implausibly fast after the
# confirmation modal opens, e.g. <800ms). This is a legitimate, real fallback
# — not a stub — and is fine to ship with if neither CAPTCHA dashboard is
# reachable. It can be upgraded to a real provider later without touching
# any other file, since every caller only ever calls the one function this
# file exports.
BOT_VERIFY_PROVIDER=turnstile      # "turnstile" or "hcaptcha"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=              # server-only
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=               # server-only
```

Never commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` must only ever be referenced in server-side files (API routes, `lib/supabase/server.ts`, `lib/turnstile.ts`) — if either shows up in anything under `app/(public)` or a client component, that's a bug, stop and fix it before proceeding. Same applies to `ADMIN_BASE_PATH` — it's read in `middleware.ts` server-side only, never passed to the client.

---

## 4. Conventions

- **Server actions vs API routes:** use API routes (`app/api/**/route.ts`) for anything called from client components with `fetch` (form submission, voting) — keeps a clean request/response boundary and makes rate-limiting/middleware easier to reason about. Server actions are fine for simple admin mutations within server components.
- **Forms:** every form uses `react-hook-form` + a `zod` schema from `lib/validation/`. Client-side validation is a UX nicety; the same rules (or stricter) must be re-checked server-side in the API route — never trust the client.
- **Categories:** always import from `lib/constants/categories.ts`. Never hardcode the category list a second time anywhere (dropdown, dedupe check, DB seed) — one file, multiple imports.
- **Dates/times:** store everything in UTC in Postgres (`timestamptz`), format for display in the user's local time client-side. Countdown logic must be computed from server-fetched settings, not a client-only clock, to avoid users spoofing their device clock to unlock early access.
- **Styling:** Tailwind utility classes, brand tokens from `DESIGN.md` wired into `tailwind.config` — no raw hex codes in components.
- **TypeScript:** strict mode on. No `any` unless there's a genuinely unavoidable third-party typing gap, and comment why.
- **Role checks:** every `/api/admin/*` route calls the appropriate helper from `lib/auth/roles.ts` (`requireAdmin` for either role, `requireSuperAdmin` where the matrix in `REQUIREMENTS.md` §6.1 restricts it) as its first line, before any query runs. Don't rely on the client hiding a button as the actual access control — the API route is the real gate.

---

## 5. Non-Negotiable Rules (things that are easy to get subtly wrong)

1. **Duplicate submissions get a message, never the reference ID.** See `REQUIREMENTS.md` §4.5. This is a deliberate anti-enumeration decision — don't "helpfully" add the ID back in.
2. **Public voting never exposes vote counts.** Not hidden with CSS — the query/API response itself must not include counts for the public-facing page.
3. **Voting page state (open/closed/not-started) is derived server-side from the `settings` table on every load**, not cached client-side indefinitely — someone shouldn't be able to keep an old "voting is open" state alive past the actual close time.
4. **All writes to `submissions` and `votes` go through API routes using the service role**, never direct client inserts against Supabase with the anon key — this is where the dedupe and rate-limit logic actually lives, and it's bypassable if the client can write directly.
5. **Mobile-first means built mobile-first**, not designed desktop-first and squeezed down. Every component's default (no breakpoint prefix) Tailwind classes should be the mobile layout.
6. **The 3D hero element is optional and deferred** — it must never block or meaningfully delay first paint on a mid-range Android phone on 3G/4G. If in doubt, ship without it and add it back once the rest is solid.
7. **The admin portal is never reachable at `/admin` directly.** Requests there return a plain 404. The only way in is `{ADMIN_BASE_PATH}` via the middleware rewrite. Never add a link, nav item, footer credit, or sitemap entry that points at `/admin` or leaks `ADMIN_BASE_PATH` — and never add it to `robots.txt`.
7a. **Every internal admin link, redirect, and nav item must resolve relative to the current base path — never a hardcoded `/admin/...` string.** A middleware rewrite changes what gets *served*, not what's in the browser's address bar. A hardcoded `<Link href="/admin/submissions">` (or a hardcoded redirect target, e.g. after login or after a mutation) will send the browser to the literal `/admin/submissions` on click — which either 404s (since direct `/admin/*` is blocked per rule 7) or, worse, briefly reveals the real internal route structure in the address bar. Build a small helper (e.g. `adminPath(subpath: string)` in `lib/auth/roles.ts` or a new `lib/admin-path.ts`, reading the current path segment client-side rather than the env var directly) and use it everywhere inside `app/admin/**` instead of hardcoding `/admin` or `/${ADMIN_BASE_PATH}`. Applies to `<Link>` hrefs, `router.push`, redirect responses, and any "copy admin link" convenience feature.
8. **`site_manager` accounts can never create or modify other admin accounts, and can never see raw IP addresses or fingerprint hashes** — only `super_admin` can. Check this server-side per §4's role-check convention, not just by hiding the UI for that role.
9. **The vote endpoint must reject before touching the database if the bot check fails** — whether that's a Turnstile/hCaptcha token failing verification, or (when `BOT_VERIFY_PROVIDER=none`) the honeypot field arriving non-empty or the submission-timing threshold being violated. Don't call `cast_vote` first and check second — check first, short-circuit on failure, regardless of which provider is active.
9a. **If shipping with `BOT_VERIFY_PROVIDER=none`, the vote form must still render the honeypot field and track/send the timing data** — the fallback only works if the client side actually implements its half. This isn't optional scaffolding to add "later"; it's the whole mechanism.
10. **Vote counting is per-vote rolling 24h, not calendar day.** A `count(*) where created_at > now() - interval '24 hours'` query, not a "reset at midnight" check — see `REQUIREMENTS.md` §7 for the exact RPC.
11. **Cover Art and Bold Front-View Photo are validated for type/size the instant they're selected in the entry form — not deferred to final submit.** Exact order is in `REQUIREMENTS.md` §4.5: raw sanity check → compression → post-compression size check → attach to form state, with server-side re-validation happening again at actual upload time regardless (client checks are UX, not the real gate). Don't let an artist fill out all 12 fields only to discover at the very end that their photo was too big — that's the specific failure mode this rule exists to prevent.

---

## 6. Suggested Build Order

1. Scaffold Next.js project, Tailwind + shadcn setup, wire brand tokens from `DESIGN.md` into `tailwind.config`.
2. Supabase project setup — run the schema from `REQUIREMENTS.md` §7, set up RLS, generate typed client.
3. `middleware.ts` — hidden admin path rewrite + 404 on direct `/admin/*` access. Build and verify this early, before there's anything sensitive behind it to protect.
4. `lib/constants/categories.ts` — categories + slug generation.
5. One-pager static sections (Hero, Eligibility, Dates, Categories) — dates wired to `settings` table read.
6. Entry form + submission API route (validation, dedupe check, Cloudinary upload, reference ID generation, confirmation email).
7. Submission success/tracking UI (reference ID display + copy, "check my status" lookup).
8. Admin auth + `admin_users` role column + `lib/auth/roles.ts` helpers + layout shell (bottom bar mobile / sidebar desktop, nav items filtered by role).
9. Admin submissions page (table, filters, sort, approve/reject, detail view).
10. Admin dashboard (cards + charts).
11. Admin settings page (date controls).
12. Admin account management page (`/admins`, super_admin only) — invite/revoke `site_manager` accounts.
13. Bot verification integration on both the vote form and the admin login form (Turnstile, hCaptcha, or the built-in honeypot+timing fallback, per `BOT_VERIFY_PROVIDER` — do not let an unreachable CAPTCHA dashboard block this phase; fall back to `none` and upgrade later if needed).
14. `/voting` page — states, participant grid, category tabs, vote confirmation modal, `cast_vote` flow with fingerprinting + Turnstile.
15. Admin live voting page (realtime counts, role-scoped flag visibility, export).
16. Export functionality (CSV/Excel/PDF) on both submissions and voting pages.
17. Motion pass (Framer Motion transitions) + optional 3D hero.
18. Full mobile-first QA pass across real breakpoints before anything else.

---

## 7. Before Calling Anything Done

- [ ] Every page tested at 375px width first, then scaled up.
- [ ] Duplicate submission flow verified to never leak a reference ID.
- [ ] Public `/voting` API responses inspected directly (not just the UI) to confirm no vote counts leak.
- [ ] Voting countdown/state verified against server time, not device clock.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and the active bot-check secret key (`TURNSTILE_SECRET_KEY` or `HCAPTCHA_SECRET_KEY`) confirmed absent from any client bundle (check the built output, not just the source).
- [ ] `ADMIN_BASE_PATH` confirmed absent from any client bundle, `robots.txt`, sitemap, or public HTML.
- [ ] Direct requests to `/admin/*` confirmed to return a plain 404, not a redirect.
- [ ] Every link/redirect inside the admin section clicked through manually to confirm the address bar always shows `{ADMIN_BASE_PATH}/...`, never a hardcoded `/admin/...`.
- [ ] `site_manager` login tested directly against `/api/admin/admins` and any raw-IP/fingerprint endpoints to confirm it's actually rejected server-side, not just hidden in the UI.
- [ ] Vote endpoint tested with an invalid/missing bot-check token (or, if `BOT_VERIFY_PROVIDER=none`, a filled honeypot / too-fast submission) to confirm it's rejected before `cast_vote` runs.
- [ ] A too-large or wrong-type file rejected immediately on selection in the entry form — before any other field is required, before compression runs, and before the API is ever called.
- [ ] Export functions tested with filters applied, not just the unfiltered full dataset.