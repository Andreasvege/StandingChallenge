@AGENTS.md

# Stå på! — Project State

## What it is
A cozy internal site for The Brave's 16 employees to compete on standing-desk time. Pick 30/60/90 min, a timer runs, everyone sees a live pixel-art office (who stands at a raised desk, who dozes at a lowered one), plus today/this-week leaderboards. **Visual delight is the #1 success criterion** — colleagues should think «herregud så gøy og koselig!».

- Design spec: `../docs/superpowers/specs/2026-09-11-sta-pa-design.md`
- Approved room mockup (sprite origin): `../docs/superpowers/specs/mockups/2026-09-11-pikselkontoret.html`
- Brainstorm mockups + figure-builder prototypes (v1–v4): `../.superpowers/brainstorm/` (gitignored, local only)
- Git root is the parent folder; this Next app lives in `standing-challenge/`.

## Current status (2026-09-13)
- **Live** at https://standing-challenge.vercel.app, used by the real 16 employees (imported, all seated). Leaderboards were reset to zero after testing.
- Verified in production: Google login for `@thebrave.no` (admin + a regular colleague), start/stop a round, room with real figures, admin figure builder, phone layout, `/dev/room` → 404, `/api/office` → 401 when logged out, only the Google provider exposed (no dev login).
- **Not yet verified in production:** a round actually expiring → «Står du fortsatt?» dialog, pling and browser notification (notification permission is requested on the first Start click).
- Checks: 101 Vitest tests, `tsc`, ESLint and `next build` all pass.

## Deployment
- Vercel project `standing-challenge` lives in the **Brave** team (scope `brave-abc43642`), *not* "Andreas' projects". The Vercel MCP connector only sees "Andreas' projects" — use the Vercel CLI: `vercel <cmd> --scope brave-abc43642` (e.g. `vercel env ls --project standing-challenge`, `vercel ls standing-challenge`, `vercel inspect <url> --logs`).
- Pushing to `master` on GitHub (`Andreasvege/StandingChallenge`) triggers a production deploy.
- Project settings that matter: Root Directory `standing-challenge`, **Framework Preset = Next.js** (it was "Other", which failed with "No Output Directory named public"), **Function Region = lhr1 London** (Neon DB is `eu-west-2` London). Check a response's `x-vercel-id` header — the middle part is the function region.
- Google OAuth client is set up with redirect URIs for `http://localhost:3000/api/auth/callback/google` and `https://standing-challenge.vercel.app/api/auth/callback/google`. A custom domain (e.g. `stapa.thebrave.no`) would need a new redirect URI.

## Stack
Next.js 16.3 (App Router, Turbopack) · React 19 · TypeScript strict · Auth.js v5 beta (`next-auth@5.0.0-beta.32`, Google, `@thebrave.no` only) · Neon Postgres + Drizzle ORM (`neon-http`) · Vitest 3 · CSS Modules (Tailwind only for its reset).

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm test`
- `npm run db:push:prod` — apply `db/schema.ts` to the database in `.env.local`
- `npm run db:import:prod` — upsert employees from `data/employees.json` (by email; never deletes)
- `db:push` / `db:seed` / `db:import` (without `:prod`) target a dev DB from `.env.development.local` and refuse to run without it. There is currently **no** dev DB (see Data below).
- `/dev/room` (dev only; `?hour=21` previews the evening sky) renders the room with demo data — no login or DB.
- One-off DB queries: `npx tsx -e` with `loadEnvConfig(process.cwd(), false)` from `@next/env` + `neon(process.env.DATABASE_URL!)`, wrapped in an async IIFE (tsx `-e` has no top-level await).

## Structure
- `lib/` — pure, unit-tested logic: `time` (Europe/Oslo day/week), `sessions` (round rules), `snapshot` (office state + live advance between polls), `figure` (model + palettes), `sprite` (pixel rects), `sprite-art` (hand-drawn art helpers), `cheers` (heiarop rules), `plant` (kontorplanten), `access` (domain/admin), `leaderboard`, `room-layout`, `sky`, `format`, `employee-import`, `demo-office`. Server/DB glue without tests: `office` (snapshot + lazy expiry + recent cheers), `current-employee`, `clock-config`, `alerts` (Web Audio pling + notifications).
- `db/` — Drizzle schema (`employees`, `stand_sessions` with a partial unique index = max one open session per person, `cheers`) and client.
- `app/actions/` — Server Actions (`stand`, `cheer`, `admin`, `auth`); every action re-checks auth itself.
- `app/api/office` — polled every 5 s by the client; 401 when logged out.
- `components/` — `OfficeApp` (client shell: polling, ticking clock, tab title, dynamic favicon, heiarop toasts via `CheerToasts`), `office/OfficeRoom` (scene; desktop 2×8, phones ≤700px 4×4 with compact two-line bubbles; tap a colleague for the heiarop menu), `office/OfficePlant`, `PixelPerson`, `MyStatus`, `Leaderboard`, `StillStandingDialog`, `admin/*` (FigureBuilder, SeatGrid).

## Heiarop & kontorplanten
- **Heiarop:** tap a colleague → menu with today's total and emojis (standing: 👏🔥💪☕, sitting: ⬆️ «reis deg!», 👀, ☕). `sendCheer` stores it in `cheers` (sender = logged-in user; no self-cheers; 30 s cooldown per sender→receiver). Snapshots carry cheers from the last 8 s (`CHEER_SHOW_MS`, longer than a poll); the room floats the emoji over the receiver's head and the receiver gets a toast. Everything is derived from `now` — no effects/state for animations. Preview with `/dev/room?cheer=1`.
- **Kontorplanten:** a potted plant on a wall shelf (back-left corner on desktop, between the windows on phones) grows through 6 stages with the whole office's standing this week toward `WEEKLY_GOAL_HOURS` (30), blooming at the goal; resets Monday with the week totals. Sign «12/30 t»; tap for the full label.
- `scripts/` — `import-employees`, `seed-dev`, `make-icon`.

## Rules & conventions
- UI copy in Norwegian bokmål. Pixel art only for figures/scene — text and buttons use Bricolage Grotesque (headings) + DM Sans (UI), never pixel fonts. The user reacts strongly to visuals: show rendered screenshots/mockups for visual changes.
- All day/week math in Europe/Oslo (`lib/time.ts`); never use the server's local time.
- Rounds are 30/60/90 min; 5 min grace for «Står du fortsatt?» (30 s and minutes-as-seconds with `DEV_FAST_TIME=1`, dev only). Expired rounds are closed lazily on read — no cron.
- No `proxy.ts`/middleware: auth is checked in pages (redirect), route handlers (401) and inside each Server Action. The dev Credentials login exists only when `NODE_ENV=development`.
- Keep testable logic in `lib/` with a `*.test.ts` next to it.

## Figures / sprites
- Figure model: `hairStyle` short|buzz|long|bun|curly, `hair`/`skin`/`shirt` from the palettes in `lib/figure.ts`, `eyewear` none|glasses|sunglasses, `beard` none|stubble|full, `mustache` boolean, `deskItem` mug|plant.
- Sprites are `<rect>`s on a 40×48 grid (figure + desk). In `lib/sprite.ts`, `head(p, f, x, y, …)` draws relative to the face's top-left `x, y` — standing `(7, 11)`, sitting `(7, 17)` — so anything drawn relative to `x, y` works in both poses. Painter helpers: `r(x, y, w, h, fill)` plain rect, `o(…)` rect with a 1px `#120d22` outline, `dots(…)`. Colour helpers: `shade`, `lighten`, `blend`.
- Head avatars use `HEAD_BOX` (18:21) — keep SVG width/height at that ratio or pixels outside the box leak in.
- Adding a coded figure option = type + palette/validation in `lib/figure.ts`, drawing in `lib/sprite.ts`, a chip in `components/admin/FigureBuilder.tsx`, and tests.
- **Hand-drawn art (the user draws these himself):** PNGs in `sprites/hode/` (26×22, head art → `figure.headwear`) and `sprites/pult/` (18×12, desk items → extra `figure.deskItem` values). `npm run sprites` (`scripts/build-sprites.ts`) converts them to rects in `lib/sprite-art.generated.ts` (never edit by hand), and rewrites the drawing templates + palettes (`sta-pa.gpl`/`.hex`) in `sprites/mal/`. The file name becomes the id/label (`rosa lue.png` → «Rosa lue»). Head canvas top-left = face top-left + (−6, −8) (`HEAD_CANVAS`); desk canvas = (20, deskTop − 12) (`DESK_CANVAS`); anchors in `FACE`/`DESK_TOP`. Pixels identical to the template are dropped when a drawing was made on top of it. Pure helpers + tests in `lib/sprite-art.ts`. User-facing guide: `sprites/README.md`. `headwear` is optional in `Figure` so rows saved before it existed stay valid. Examples shipped: `caps` and `katt`.

## Data & environments
- There is **one** Neon database (production). By the user's choice there is no dev branch, so local `npm run dev` + login writes to production. Clean up test sessions after local testing: `delete from stand_sessions where ended_at is not null` (only when the user confirms they were tests).
- `data/employees.json` holds the real employees (names + work emails) — **gitignored, never commit or print emails**. Exported from the figure-builder prototype; loaded with `db:import:prod`.
- `.env.local` (gitignored): Neon vars from the Vercel integration + `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS` (av@thebrave.no). Auth.js v5 only reads the `AUTH_GOOGLE_*` names. The same auth vars are set in Vercel (Production + Preview). Optional `DEV_FAST_TIME=1` locally. See `.env.example`.

## Ideas / next steps (not started)
1. Sprite pipeline so the user can draw hats, headphones, pets, plants in Piskel/Aseprite (see Figures above).
2. Custom domain, e.g. `stapa.thebrave.no` (+ Google redirect URI).
3. Streaks and badges (explicitly out of scope for v1).
4. Small a11y nit: the blurred demo room behind `/login` is `aria-hidden` but its buttons are still focusable — add `inert` to the backdrop.
5. Holiday themes (make it month by month. e.g. October: Halloween, December: Christmas etc.)
6. Create weather animations (rain, snow, thunder?) and connect it to Yr/MET API so that its live updated.