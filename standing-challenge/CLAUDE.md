@AGENTS.md

# Stå på! — Project State

## What it is
A cozy internal site for The Brave's 16 employees to compete on standing-desk time. Pick 30/60/90 min, a timer runs, everyone sees a live pixel-art office (who stands/sits), plus today/this-week leaderboards. Visual delight is the #1 success criterion.

- Design spec: `../docs/superpowers/specs/2026-09-11-sta-pa-design.md`
- Chosen mockup (room): `../docs/superpowers/specs/mockups/2026-09-11-pikselkontoret.html`
- Git root is the parent folder; this Next app lives in `standing-challenge/` (Vercel Root Directory = `standing-challenge`).

## Stack
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Auth.js v5 (Google, `@thebrave.no` only) · Neon Postgres + Drizzle ORM (`neon-http`) · Vitest · CSS Modules (Tailwind only for its reset).

## Commands
- `npm run dev` · `npm run build` · `npm run lint` · `npm test`
- `npm run db:push` / `db:seed` / `db:import` — target the **dev** DB from `.env.development.local`
- `npm run db:push:prod` / `db:import:prod` — target production (`DB_TARGET=prod`, reads `.env.local`)
- `/dev/room` (dev only, `?hour=` previews the sky) renders the room with demo data — no DB needed.

## Structure
- `lib/` — pure, unit-tested logic: `time` (Europe/Oslo day/week), `sessions` (round rules), `snapshot` (office state), `figure` (model + palettes), `sprite` (pixel rects), `access` (domain/admin), `leaderboard`, `room-layout`, `sky`, `format`, `employee-import`, `demo-office`. Server/DB glue without tests: `office`, `current-employee`, `clock-config`, `alerts` (Web Audio pling + notifications).
- `db/` — Drizzle schema (`employees`, `stand_sessions`; partial unique index = max one open session) and client.
- `app/actions/` — Server Actions (`stand`, `admin`, `auth`); every action re-checks auth itself.
- `app/api/office` — polled every 5 s by the client.
- `components/` — `OfficeApp` (client shell: polling, ticking clock, tab title, favicon), `office/OfficeRoom` (scene), `PixelPerson`, `MyStatus`, `Leaderboard`, `StillStandingDialog`, `admin/*` (FigureBuilder, SeatGrid).
- `scripts/` — `seed-dev`, `import-employees` (reads `data/employees.json`), `make-icon`.

## Rules & conventions
- UI copy in Norwegian bokmål. Pixel art only for figures/scene — text and buttons use Bricolage Grotesque (headings) + DM Sans (UI), never pixel fonts.
- All day/week math in Europe/Oslo (`lib/time.ts`); never use the server's local time.
- Rounds are 30/60/90 min; 5 min grace for «Står du fortsatt?» (30 s with `DEV_FAST_TIME=1`, dev only). Expired rounds are closed lazily on read — no cron.
- Figure model: `hairStyle` short|buzz|long|bun|curly, `hair`/`skin`/`shirt` from palettes in `lib/figure.ts`, `eyewear` none|glasses|sunglasses, `beard` none|stubble|full, `mustache` boolean, `deskItem` mug|plant. Head avatars use `HEAD_BOX` (18:21) — keep SVG width/height at that ratio.
- No `proxy.ts`/middleware: auth is checked in pages (redirect), route handlers (401) and inside each Server Action.
- Keep testable logic in `lib/` with a `*.test.ts` next to it.

## Data & environments
- `data/employees.json` holds the real employees (names + work emails) — **gitignored, never commit**. Exported from the figure-builder prototype; loaded with `db:import`.
- `.env.local` = production values pulled from Vercel/Neon. Local dev must use `.env.development.local` (Neon branch `dev`, `AUTH_SECRET`, `ADMIN_EMAILS`), which Next loads first in dev. Seed/dev-import refuse to run without it. Don't log in locally before it exists — the app would otherwise write to production.
- Env names: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS` (av@thebrave.no), optional `DEV_FAST_TIME=1`. See `.env.example`.
