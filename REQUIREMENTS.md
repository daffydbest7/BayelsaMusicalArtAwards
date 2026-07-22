# BMAA 2026 — Product & Technical Requirements

**Companion docs:** `DESIGN.md` (visual system), `SKILL.md` (agent build conventions). This file is the "what to build" — read all three before writing code.

---

## 1. Overview & Goals

A mobile-first web app for the Bayelsa Musical Artiste Awards 2026 ("Beyond the Plains"). Two public-facing surfaces, zero signup for artists or voters:

1. A **one-pager** (`/`) — brand story, eligibility, entry dates, categories, and the entry form.
2. A **`/voting`** page — only meaningful while voting is open; where the public votes for nominees.

Everything else lives behind `/admin`, which is the only part of the app requiring authentication.

**Core tension to hold onto throughout the build:** the client wants zero friction for artists and voters (no accounts), but the platform still needs to prevent obvious abuse. Every decision below (dedupe logic, voter fingerprinting) exists to resolve that tension without adding signup.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (latest, App Router) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth — **admin only**, no public accounts |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Motion | Framer Motion |
| 3D | `@react-three/fiber` + `drei` (hero flourish only, see `DESIGN.md` §8) |
| Image hosting | Cloudinary |
| Forms | `react-hook-form` + `zod` |
| Charts | `recharts` (admin dashboard) |
| Icons | `lucide-react` |
| Export | `papaparse` (CSV), `xlsx`/SheetJS (Excel), a PDF lib for admin export (e.g. `@react-pdf/renderer` or server-side) |

---

## 3. Information Architecture

```
/                                  → One-pager (public)
/voting                            → Voting page (public, gated by settings)
{ADMIN_BASE_PATH}/login            → Admin auth (path itself is a secret — not literally "/admin/login")
{ADMIN_BASE_PATH}                  → Dashboard
{ADMIN_BASE_PATH}/submissions      → Review queue
{ADMIN_BASE_PATH}/voting           → Live voting (admin-only visibility)
{ADMIN_BASE_PATH}/settings         → Dates & config
{ADMIN_BASE_PATH}/admins           → super_admin only — manage site_manager accounts
/admin/*                           → does not exist publicly; any request here returns a generic 404
```

`{ADMIN_BASE_PATH}` is a random slug generated once and stored only in the `ADMIN_BASE_PATH` environment variable — never hardcoded in source, never linked from any public page, never listed in `robots.txt` (doing so would broadcast the exact path to anyone reading the file). See §6.1 for the full implementation and its honest limits.

---

## 4. Public Site — One Pager

### 4.1 Hero
- "BAYELSA MUSICAL ARTISTE AWARDS Presents" / "BMAA 2026" / "BEYOND THE PLAINS" theme tag.
- CTA `[ ENTER NOW ]` — smooth-scrolls to the entry form.
- Copy: "Are you a Bayelsa-born or Bayelsa-based artiste? This is your stage. This is your award."

### 4.2 Entry Requirements
- Eligibility window: **Dec 27, 2021 – Apr 27, 2026** (final, intentional — BMAA has been dormant for years, so this covers the backlog of eligible material, not a typo).
- Must be publicly available on radio, TV, or digital platforms.
- Artist must own rights to all submitted material.

### 4.3 Entry Dates
- **Pulled live from `settings` table — never hardcoded in the component.** Renders a countdown to open, or to close, depending on current state relative to `submission_open_at` / `submission_close_at`.
- Late entries not accepted — form should hard-disable (not just visually gray out) once `submission_close_at` has passed, checked server-side too, not just client clock.

### 4.4 Categories

26 categories, **defined once as a frontend constant** (`lib/constants/categories.ts`), imported by both the entry form and any server-side validation — this is the single source of truth, no admin CRUD, no database table for categories, no extra network round-trip to fetch them.

```ts
export const CATEGORIES = [
  "Artist of the Year",
  "Song of the Year",
  "Album of the Year",
  "Best New Act",
  "Best Male Artist",
  "Best Female Artist",
  "Best Collaboration",
  "Music Video of the Year",
  "Best Video Director",
  "Music Producer of the Year",
  "Sound Engineer of the Year",
  "Best DJ",
  "Afrobeats Song of the Year",
  "Best Rap Artist",
  "Best Rap Album",
  "Best Gospel Act",
  "Best Gospel Song",
  "Best Gospel Album",
  "Best Gospel Video",
  "Best Gospel Choir",
  "Best Owigiri Artist",
  "Best Owigiri Song",
  "Best Owigiri Pop Artist",
  "Best Campus Act",
  "Hypeman of the Year",
  "Best Bayelsa Artist in the Diaspora",
] as const;
```

Each category gets a stable `slug` (kebab-case of the name) generated from this same file — used as the foreign-key-equivalent value stored on `submissions.category` and `votes.category`, since there's no `categories` table to reference.

### 4.5 Entry Form

All fields required unless noted.

| # | Field | Input type | Notes |
|---|---|---|---|
| 1 | Stage Name | Text | |
| 2 | Real Name | Text | |
| 3 | Phone/WhatsApp | Phone | Normalize to `+234` format on submit |
| 4 | Email | Email | Normalize to lowercase, trim on submit |
| 5 | Artist Location | Text | City, LGA |
| 6 | Category | Dropdown | From `CATEGORIES` constant, mobile = full-screen sheet (see `DESIGN.md` §6) |
| 7 | Song Title | Text | |
| 8 | Audio/Video Link | URL | YouTube, Audiomack, SoundCloud etc. — validate it's a well-formed URL, don't restrict to a domain allowlist |
| 9 | Material Release Date | Date picker | Should fall within the eligibility window; soft-validate (warn, don't hard-block, in case of edge cases) |
| 10 | Cover Art | File upload | JPG/PNG, max 5MB. **Validated immediately on file select** — see note below the table, not just at final submit. |
| 11 | Bold Front-View Photo | File upload | **Single file** (confirmed). JPG/PNG, max 5MB. This is the image shown on `/voting` cards. **Validated immediately on file select**, same as above. |
| 12 | Social Handles | Text group | Instagram (@), Facebook, TikTok (@), YouTube (link) — all optional within this group |

**File validation order (matters — this is the fix for a real usability gap):** validate file **type and size the moment a file is selected in the dropzone**, before the artist fills in anything else — not deferred to form submit, and not deferred to the point of the actual Cloudinary/API call. A file that's too large or the wrong type is rejected instantly, inline, with a clear message ("File too large — max 5MB, yours is 8.2MB" beats a generic error), and the dropzone stays interactive so they can pick a different file immediately. This must happen *before* client-side compression runs too — compressing an 80MB file before telling the person it's rejected wastes their time and battery for nothing. The full validated order:

1. File selected → **immediate client-side check**: correct MIME type (JPG/PNG only) and size ceiling before compression (reject obvious garbage early, e.g. anything over ~25MB raw — no phone camera photo should exceed that, so this is a fast-fail for wrong-file-picked scenarios).
2. Client-side compression (`browser-image-compression`) runs on files that passed step 1.
3. **Post-compression check**: confirm the compressed result is under the real 5MB ceiling. If a photo still doesn't fit after compression (rare, but possible with certain source formats), reject with a clear message rather than silently uploading an oversized file.
4. Only once both checks pass does the file get attached to the form's pending submission state — the artist can now fill in the rest of the form (or already has) without any chance of the whole submission failing at the end over something that could've been caught in seconds.
5. Server-side, the same type/size rules are re-validated before forwarding to Cloudinary — client-side checks are a UX nicety, never a substitute for the server enforcing its own limits (a request could bypass the browser entirely).

**Submit flow:**
1. Client-side field validation (`zod` schema) — by this point, both image fields have already passed their own validation per the file-validation order above, so this step is checking text/format fields, not re-litigating the images.
2. Server-side duplicate check — see below.
3. If unique: upload images to Cloudinary (server re-validates type/size first, per step 5 above), generate reference ID, insert into `submissions`, send confirmation email to artist + notification to `bayelsamusiccontent@gmail.com`.
4. Success screen: shows reference ID in `mono-lg` styling with a copy-to-clipboard button, plus "save this — you'll need it to follow up on your submission status."

**Duplicate submission handling (updated requirement):**

Check is scoped to **(normalized email OR normalized phone) + category** — an artist *can* legitimately enter multiple categories, so the uniqueness is per-category, not global.

- **If a duplicate is found: inform the user an entry already exists for this email/phone in this category — but do NOT return the existing reference ID in the response or render it on screen.**
- Message: *"An entry for this category already exists using this email or phone number. If you've lost your reference ID, contact **bayelsamusiccontent@gmail.com** or WhatsApp **+234 904 359 9284** with the email/phone you used to submit, and we'll confirm your status."*
- Rationale: returning the ID on a duplicate check would let anyone harvest another artist's reference ID just by resubmitting a guessed/known email or phone number. Making them go through a human-verified support channel closes that hole.
- Implementation: this must be checked server-side (API route / server action using the Supabase service role), never trust a client-side check alone.
- **Sequencing note:** run the duplicate check *before* the (already-validated) images are actually uploaded to Cloudinary — no reason to spend an upload against Cloudinary's quota for a submission that's about to be rejected as a duplicate anyway. Order: validate fields → check duplicate → *then* upload images → insert record.

### 4.6 Alternative Submission
Static content block: WhatsApp +234 904 359 9284, email bayelsamusiccontent@gmail.com, for anyone hitting form issues.

### 4.7 Footer
Social (@BMAAOfficial), hashtags (#BMAA2026 #BeyondThePlains).

---

## 5. `/voting` Page

### 5.1 States (driven by `settings` table, checked server-side on load, not just client-rendered)

| State | Condition | UI |
|---|---|---|
| Not yet open | `now < voting_open_at` | "Voting is not currently active. Come back later." + countdown to `voting_open_at` |
| Active | `voting_open_at ≤ now < voting_close_at` | Full voting UI + countdown to close |
| Closed | `now ≥ voting_close_at` | "Voting has closed. Thank you for participating." (winners announcement copy can be added later) |

### 5.2 Category Sections & Participant Grid

**Pattern confirmed against real platforms** — MTV VMAs (vote.mtv.com) and the People's Choice Awards (votepca.com), both high-traffic, many-category, many-nominee voting sites. Their shared approach, and the reason it's the right one here too:

- **All categories are stacked vertically as sections on one continuous scrollable page — never hidden behind a tab switcher.** MTV's own guidance to voters is literally "scroll through, spot your faves, and vote." With 26 categories, a tab-switcher forces a voter to already know exactly which category they want before they can see anything in it; a scrollable stack lets a casual voter browse the way they'd watch an actual award show unfold, category by category, while someone who came for one specific artist can jump straight there.
- **A sticky category chip bar stays pinned near the top, acting as jump-navigation, not a filter.** Tapping a chip smooth-scrolls the page to that category's section — it does not hide or swap out any other section. As the user scrolls, the chip for the currently-visible category highlights (scroll-spy behavior), so orientation is never lost in a long page.
- Each category section header shows the category name and nominee count (e.g. "Best Male Artist · 8 nominees") — small but genuinely useful at this scale, since it tells a voter what they're committing to scroll through before they do.
- Nominee grid within each section: 2 columns on mobile, scaling up on larger breakpoints. Photo-forward (the Bold Front-View Photo is the dominant visual element per card, per `DESIGN.md` §6).
- **No vote counts are ever rendered on this page** — public voting is blind, only admin sees live standings. Enforce this server-side (the public API/query for this page must not select vote counts at all — don't just hide it with CSS).
- Lazy-load images below the fold — with 26 categories × multiple nominees each, this isn't optional, it's required for the page to be usable on a mid-range Android phone on mobile data.
- A lightweight "votes remaining today" indicator per category (derived from the 5-vote shared budget in §5.4), shown once the voter has cast at least one vote in that category this session — reinforces the mechanic without needing a account/login to explain it.

### 5.3 Vote Confirmation Modal
Per `DESIGN.md` §6 — tap card → modal with photo, stage name, category, song title → confirm → success state inline (shows votes remaining in that category, per PCA's pattern of clear post-action state) → modal closes back to the grid, scroll position preserved.

### 5.3a Distinct Failure States (researched from PCA's voting FAQ)

Real platforms are explicit that different failure reasons need different messages, not one generic "vote failed" — copying this directly:

| Condition | Message |
|---|---|
| 5-vote budget already used in this category (rolling 24h) | "You've used all your votes for [Category] today. Come back in [X hours] for more." |
| Voting window not yet open | "Voting hasn't started yet — check back [date/time]." |
| Voting window has closed | "Voting has closed for BMAA 2026. Thank you for participating." |
| Bot-check failed | Generic retry prompt — don't reveal that a bot-check specifically triggered, to avoid coaching abuse attempts on how to get past it. |



### 5.4 Anti-Fraud Implementation (finalized)

**Vote limit:** 5 votes per (voter, category) — a shared budget across nominees in that category, not per-nominee. Rolling 24h window measured **per individual vote** (each vote frees up its own slot exactly 24h after it was cast), not a calendar-day reset — this specifically avoids a "stack 5 votes right before midnight, then 5 more right after" burst exploit.

**Identity key:** `voter_fingerprint_hash` (FingerprintJS or equivalent) is the **sole hard-match key** for eligibility. IP address is still captured and stored on every vote row, but **only for the admin flagging dashboard** — it is explicitly not part of the eligibility check. This was a deliberate late-stage revision: keying on fingerprint+IP together meant a routine mobile-data/airplane-mode toggle (which silently hands a phone a new carrier IP) would grant a fresh 5-vote budget for free — a bigger hole than it first looked like, since it requires zero technical skill. Dropping IP from the hard match closes that gap while keeping it fully available as a secondary signal for spotting suspicious patterns.

**Bot protection:** Cloudflare Turnstile or hCaptcha (either is acceptable — see `SKILL.md` §1/§3 for the swappable implementation) on the vote endpoint (and on the admin login form, see §6.1), verified server-side before `cast_vote` is ever called. This doesn't stop a human manually operating fingerprint-spoofing software, but it stops unsophisticated scripted/bot abuse essentially for free, with no visible challenge for legitimate voters in the overwhelming majority of cases.

**If neither provider's dashboard is reachable during development, a third mode (`BOT_VERIFY_PROVIDER=none`) is an acceptable launch configuration** — a self-contained honeypot field + submission-timing heuristic, requiring no external account at all. It's a real, established technique, weaker than a managed CAPTCHA against sophisticated bots but a genuine improvement over nothing, and works alongside the fingerprint + 5-vote-limit system already in place. This must never be treated as a reason to delay or block shipping the project — swap in a real provider post-launch if/when a dashboard becomes reachable, which requires no changes outside `lib/bot-verify.ts`.

**Client-facing policy decision (already made, not open for re-litigation mid-build):** switching browsers or devices to gain additional votes is treated as enthusiastic fan campaigning, not fraud, and is not defended against. What this system *does* defend against is one actor pretending to be many via automation. The exact line — what's stopped vs. accepted, and why — is documented in §11, Accepted Risks, and should be shared with the client as-is.

### 5.5 Post-vote Feedback
Inline success state in the modal, plus subtle non-intrusive indicator elsewhere on the page (e.g. a small "voted" checkmark on that category tab for the remainder of the session) so users have a sense of what they've done this visit — this is a client-side convenience only, not a security mechanism.

---

## 6. Admin Portal

### 6.1 Auth & Roles

**Two privilege levels**, enforced via a `role` column on `admin_users` (see §7) — not just "is this user an admin":

| Capability | `super_admin` | `site_manager` |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Review/approve/reject submissions | ✅ | ✅ |
| Export submissions | ✅ | ✅ |
| Live voting standings | ✅ | ✅ |
| Export voting standings | ✅ | ✅ |
| Edit settings (dates) | ✅ | ✅ |
| Fraud/velocity flags — aggregate view (category, pattern, count) | ✅ | ✅ |
| Fraud/velocity flags — raw records (IP addresses, fingerprint hashes) | ✅ | ❌ |
| Create / revoke admin accounts | ✅ | ❌ |
| Change another admin's role | ✅ | ❌ |

`super_admin` is you; `site_manager` is the credential set handed to the client. The split isn't about trust — it's about blast radius. Account provisioning and raw identifying data are the two things that are expensive to clean up if a `site_manager` login is ever phished or shared carelessly, so those stay behind the higher tier; everything the client actually needs to run the event day-to-day is available to both. Enforce this server-side in every `/api/admin/*` route by checking the specific `role`, not just session presence — RLS alone checking "is this `auth.uid()` in `admin_users`" is not sufficient once there are two tiers with different capabilities.

**Hidden admin path.** The entire admin portal is served from a non-obvious, randomly generated path rather than `/admin` — e.g. something like `/ops-7f3k2`, generated once and stored only in the `ADMIN_BASE_PATH` environment variable, never hardcoded in source or committed to the repo. Implementation detail that matters: Next.js App Router folder names are static, so this can't just be an env-named folder — it needs a middleware rewrite:

- Keep the real routes at `app/admin/*` internally — this is never exposed as a URL.
- `middleware.ts` rewrites any request matching `/${process.env.ADMIN_BASE_PATH}/*` to the internal `/admin/*` routes.
- Any direct request to `/admin/*`, or to anything else unmatched, returns a plain **404**, not a redirect — a redirect would confirm the path exists, a 404 doesn't.
- `/admin` is never linked from anywhere on the public site, never listed in `robots.txt` (listing it there broadcasts the exact path to anyone who reads the file — leave it out entirely), and admin pages carry `noindex, nofollow` as a backstop in case a crawler ever reaches one anyway.
- The admin login page `<title>` should be something neutral, not "BMAA Admin Login" — browser tab titles, history, and link previews can all leak it otherwise.

**Be straight about what this does and doesn't do.** This is noise reduction, not the actual security boundary — and it should be framed that way to the client, not oversold. It stops opportunistic bots that scan for common paths like `/admin`, `/wp-admin`, `/dashboard`, and it cuts down the unwanted attention/log noise you asked to avoid. It does **not** stop a determined attacker: the route name still exists as a string inside the compiled JS shipped to every visitor's browser, and anyone who inspects that can find it. The actual security boundary is real auth plus:

- **A bot-check widget (Turnstile or hCaptcha) on the login form itself**, in addition to the vote endpoint — deters credential-stuffing/brute-force bots even if they do find the path.
- **Rate-limit and lock out** repeated failed login attempts by IP.
- **Generic "invalid credentials" messaging** — never reveal whether the email exists or the password was wrong, to avoid user enumeration.
- **TOTP-based 2FA** (Supabase Auth supports this natively) — strongly recommended for `super_admin` at minimum, ideally both roles. It's close to free to turn on and meaningfully raises the bar even if the path and password both leak.

### 6.2 Dashboard
Cards + charts (`recharts`), for example:
- Total submissions (with pending/approved/rejected breakdown)
- Submissions per category (bar chart)
- Submission trend over time (line chart)
- Days remaining in current phase (submission or voting window)
- Total votes cast (only shown here and on the live voting page, never public)

### 6.3 Submissions Page
- Table (or card list on mobile) of all submissions.
- **Filters:** category (critical — 26 categories means this is used constantly), status (pending/approved/rejected), date range.
- **Sort:** by submission date, stage name, category.
- Row action: opens a detail view (drawer/modal) showing every form field + both uploaded images at full size, with **Approve** / **Reject** actions (reject should support an optional reason, stored for internal reference and/or included in a rejection notification).
- **Export:** CSV, Excel, and PDF — respecting whatever filters are currently applied (i.e. "export what I'm looking at," not always the full dataset).

### 6.4 Settings Page
- `submission_open_at`, `submission_close_at`, `voting_open_at`, `voting_close_at` — datetime pickers, these drive the dynamic countdown/state logic across the whole public site.
- Any future toggle (e.g. an OTP-escalation switch, if added later) lives here too.

### 6.5 Live Voting Page (admin-only)
- Real-time vote counts per category and per participant — use Supabase Realtime subscriptions on the `votes`/aggregate table so numbers update live without polling.
- Sortable by vote count within each category (who's leading).
- Vote-velocity flag: surface unusual spikes (e.g. a burst of votes from a narrow IP range, or a fingerprint repeatedly voting right at the edge of its 24h reset) as a visual flag — not an auto-block, per §5.4/§11. `site_manager` sees the flag itself (category, rough pattern, count); raw identifying data (IP addresses, fingerprint hashes) is visible to `super_admin` only, per the role split in §6.1.
- **Export:** current standings as CSV/Excel/PDF, timestamped.

### 6.6 Navigation
Per `DESIGN.md` §6: bottom tab bar on mobile, collapsible sidebar on desktop (breakpoint at `md`, 768px).

---

## 7. Data Model (Supabase / Postgres)

```sql
-- Submissions
create table submissions (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null,           -- e.g. BMAA-2026-XXXXXX
  stage_name text not null,
  real_name text not null,
  phone text not null,                          -- normalized +234 format
  email text not null,                          -- normalized lowercase
  location text not null,
  category text not null,                       -- slug from CATEGORIES constant
  song_title text not null,
  media_link text not null,
  release_date date not null,
  cover_art_url text not null,
  photo_url text not null,
  instagram text,
  facebook text,
  tiktok text,
  youtube text,
  status text not null default 'pending',       -- pending | approved | rejected
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

-- Partial unique indexes enforce per-category dedupe on email OR phone
create unique index submissions_email_category_unique
  on submissions (lower(email), category);
create unique index submissions_phone_category_unique
  on submissions (phone, category);

-- Votes (append-only ledger — also serves as the eligibility-check source directly,
-- no separate rate-limit table needed)
create table votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id),
  category text not null,
  voter_fingerprint_hash text not null,         -- sole hard-match key for eligibility
  ip_address inet,                               -- advisory only — admin flagging dashboard,
                                                  -- NEVER part of the eligibility check
  created_at timestamptz not null default now()
);

create index votes_fingerprint_category_time_idx
  on votes (voter_fingerprint_hash, category, created_at);

-- Site settings (singleton row)
create table settings (
  id int primary key default 1,
  submission_open_at timestamptz,
  submission_close_at timestamptz,
  voting_open_at timestamptz,
  voting_close_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

-- Admin role mapping — two tiers, see REQUIREMENTS.md §6.1 for the permission matrix
create table admin_users (
  user_id uuid primary key references auth.users(id),
  role text not null default 'site_manager' check (role in ('super_admin', 'site_manager')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
```

**`cast_vote` RPC (atomic, prevents race conditions on rapid double-submit):**

```sql
create or replace function cast_vote(
  p_submission_id uuid,
  p_category text,
  p_voter_fingerprint_hash text,
  p_ip_address inet
) returns jsonb as $$
declare
  v_lock_key bigint := hashtextextended(p_voter_fingerprint_hash || p_category, 0);
  v_count int;
begin
  -- serialize concurrent requests from the same voter+category so a rapid
  -- double-tap can't race past the 5-vote limit
  perform pg_advisory_xact_lock(v_lock_key);

  select count(*) into v_count
  from votes
  where voter_fingerprint_hash = p_voter_fingerprint_hash
    and category = p_category
    and created_at > now() - interval '24 hours';

  if v_count >= 5 then
    return jsonb_build_object('success', false, 'reason', 'limit_reached', 'votes_used', v_count);
  end if;

  insert into votes (submission_id, category, voter_fingerprint_hash, ip_address)
  values (p_submission_id, p_category, p_voter_fingerprint_hash, p_ip_address);

  return jsonb_build_object('success', true, 'votes_remaining', 4 - v_count);
end;
$$ language plpgsql security definer;
```

**Verification order in `/api/vote`:** bot-check token verified first (Turnstile or hCaptcha, whichever `BOT_VERIFY_PROVIDER` is set to) — reject before touching the database at all if it fails — then fingerprint + category + submission_id are passed to `cast_vote`, and the result is relayed to the client. If phone-OTP is ever added later for a subset of votes, it slots in as another pre-check before this call — this schema and function don't need to change.

---

## 8. API / Server Actions

| Route | Method | Purpose |
|---|---|---|
| `/api/submissions` | POST | Create submission (server-side dedupe check, Cloudinary upload orchestration, reference ID generation) |
| `/api/submissions/check` | POST | Public "track my submission" lookup by reference ID |
| `/api/vote` | POST | Verifies bot-check token (Turnstile or hCaptcha), then calls `cast_vote` RPC with fingerprint + category + submission_id |
| `/api/admin/submissions` | GET/PATCH | List (filtered/sorted), approve/reject — admin session + role required |
| `/api/admin/submissions/export` | GET | CSV/Excel/PDF export — admin session + role required |
| `/api/admin/voting/live` | GET | Live standings — admin session + role required, never exposed publicly. Raw IP/fingerprint fields stripped from the response for `site_manager` callers, per §6.1 |
| `/api/admin/voting/export` | GET | Standings export — admin session + role required |
| `/api/admin/settings` | GET/PATCH | Read/update the singleton settings row |
| `/api/admin/admins` | GET/POST/PATCH/DELETE | Invite, view, change role, or revoke admin accounts — **`super_admin` only** |

All `/api/admin/*` routes are served through the hidden path described in §3/§6.1 in production, and every one of them checks the caller's specific `role` against the permission matrix in §6.1 — "admin session required" is necessary but not sufficient on its own.

---

## 9. Security & RLS

- Public `anon` key: **no direct table writes**. All writes (submissions, votes) go through API routes using the Supabase **service role** key server-side, so validation/dedupe/rate-limiting logic can't be bypassed by hitting Supabase directly from the client.
- RLS enabled on every table. Public read access only where genuinely needed (e.g. nothing — even the `/voting` grid should be served through an API route/server component that explicitly excludes vote counts, not a direct public table read).
- Admin routes: RLS policies scoped to `auth.uid()` existing in `admin_users`, **plus** an explicit `role` check per route per the matrix in §6.1 — RLS presence alone is not sufficient with two privilege tiers.
- Admin portal served from a randomly generated hidden path (`ADMIN_BASE_PATH`), never `/admin` directly — full implementation and honest limits in §6.1.
- Bot-check widget (Cloudflare Turnstile or hCaptcha) verified server-side on both `/api/vote` and the admin login form before either is processed.
- Admin login attempts rate-limited and locked out after repeated failures, with generic error messaging to prevent user enumeration.
- TOTP 2FA enabled at minimum for `super_admin`, ideally both roles.
- File uploads validated server-side for type/size before forwarding to Cloudinary — don't trust client-side validation alone.
- Rate-limit `/api/submissions` and `/api/vote` by IP at the edge/middleware level as a first line of defense against scripted abuse, independent of the fingerprint logic.

---

## 10. Non-Functional Requirements

- **Mobile-first, non-negotiable:** build and test at 375px width first. 98% of expected traffic is mobile.
- Performance: optimize images via Cloudinary transforms + `next/image`, lazy-load below-the-fold content, keep the 3D hero element optional/deferred (see `DESIGN.md` §8).
- SEO: the one-pager needs proper meta tags/OG image (the flyer image is a natural OG image candidate) since this will be shared on social media.
- Accessibility: per `DESIGN.md` §10.

---

## 11. Accepted Risks — Voting Integrity

Documented explicitly so nothing here is a surprise later, and so this table can be shown to the client as the agreed line between "defended against" and "accepted as the cost of a free, no-signup system."

| Vector | Severity | Status |
|---|---|---|
| Switching browsers/devices to vote again | High | **Accepted** — client decision, treated as fan enthusiasm, not defended against |
| VPN, extra SIM cards, airplane-mode/IP toggling, incognito, clearing cookies, used alone | None–Low | Closed by the fingerprint-primary key design — none of these grant extra votes on their own |
| Naive scripted/bot vote spam | Low (with Turnstile/hCaptcha) or Low–Medium (with the `none` honeypot+timing fallback) | Closed by a bot-check widget on the vote endpoint where a dashboard is reachable; substantially reduced, not eliminated, by the built-in fallback where it isn't — see §5.4 |
| Scripted bot spam paired with a paid CAPTCHA-solving service | Medium | **Accepted residual risk** — raises the cost from free to paid-per-attempt; this is the realistic ceiling for any bot-check, not a gap specific to this build |
| Fingerprint spoofing via anti-detect browser software, operated manually by a human | Critical | **Accepted residual risk** — the actual ceiling of a frictionless, no-signup system. Closing this requires phone-OTP or similar identity verification, which was explicitly ruled out in favor of zero signup friction |
| Fingerprint collision between two different real voters on near-identical devices/networks (false positive, not a cheat) | Low likelihood | **Accepted** — no clean fix at this scale; if a legitimate voter reports being incorrectly blocked, this is the likely cause |

**The line, in one sentence, for the client:** this system stops a script or bot pretending to be many people; it does not, and was never going to, stop one determined person manually working around it, or a real fanbase organizing to vote often — the second one isn't fraud, and no public voting system anywhere fully stops the first without real friction (accounts, OTP, ID verification), which this project has deliberately chosen not to add.

---

## 12. Open Items / Assumptions

- Confirm exact SMTP/email service for confirmation emails (not yet specified — Resend, SendGrid, or similar).
- Confirm which Cloudinary account/credentials to use.
- Confirm the `super_admin` (you) and `site_manager` (client) account emails before go-live, so accounts can be provisioned via `/api/admin/admins` rather than direct DB inserts.
- Register a bot-check site key pair (Cloudflare Turnstile or hCaptcha — whichever dashboard is reachable) before build starts on §5.4/§6.1. **If neither is reachable, this is not a blocker** — build with `BOT_VERIFY_PROVIDER=none` (see §5.4) and revisit later.