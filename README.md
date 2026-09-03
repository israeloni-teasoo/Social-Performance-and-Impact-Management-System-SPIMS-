# SPIMS — Social Performance & Impact Management System

An implementation of the SPIMS platform designed for Teasoo Consulting / Seplat Energy, built from the Claude Design handoff in `project/SPIMS.dc.html` (see `chats/` for the design conversation that shaped it).

SPIMS moves social-investment reporting from a spend register to an output → outcome → impact chain, with one dataset that produces both a Nigerian local-compliance report (NCDMB/PIA/NUPRC) and a global ESG report (GRI/IFRS/SDG). It has four personas — **Executive**, **Project Manager**, **Field Officer**, and **Community Relations** — each with their own workspace. The sign-in screen lists a demo account for each persona.

**Live demo**: `https://<owner>.github.io/<repo>/` via GitHub Pages. Pages is a static host with no API, so the app detects that and runs in **demo mode** — it signs in against the bundled demo accounts, reads the sample dataset, and saves changes to the viewer's browser only. A "Demo mode" pill in the topbar makes this unambiguous during a client demo. Claude report generation is the one feature that genuinely needs a server and says so.

## Stack

This is now a real full-stack app, not a static prototype:

- **Frontend** — React + TypeScript + Vite (`frontend/`).
- **API** — TypeScript serverless functions (`api/`), sharing handler logic with a local Express dev server (`server/devServer.ts`) so the same code runs in dev and in production.
- **Database** — PostgreSQL via [Prisma](https://www.prisma.io) (`prisma/schema.prisma`). All portfolio data (projects, impacts, communities, indicators, reports, stakeholders, tasks, team, approvals, targets, spend, bulk uploads) lives here — nothing is bundled seed data in the shipped app anymore.
- **Auth** — real sessions: bcrypt-hashed passwords, signed httpOnly JWT cookies. The four demo accounts are seeded users, not a client-side allow-list.
- **Claude** — `/api/reports/generate-preview` calls the Anthropic API server-side to draft a slide outline from a report's compiled content (the "Slide preview" button in Reports & Exports). Requires `ANTHROPIC_API_KEY`; degrades to a clear error if it's not set, rather than failing silently.

Styling matches the original design system (navy `#111C55` / crimson `#E31A38` / Poppins).

## Project layout

```
frontend/         React app — views/, components/, useAuth.ts, useAppData.ts, api.ts
server/           Shared backend logic
  handlers/       Framework-agnostic request handlers (one file per resource)
  lib/            db (Prisma client), auth (JWT/bcrypt), session (cookies), csv
  devServer.ts    Express server for local dev — mounts the same handlers as api/
api/              Vercel serverless functions — thin wrappers around server/handlers
prisma/           schema.prisma + seed.ts (seeds from frontend/src/data/seed.ts + accounts.ts)
chats/            Original design conversation transcripts (provenance)
project/          Original Claude Design HTML/CSS/JS handoff bundle (reference only)
.github/          GitHub Actions workflow (deploys frontend/ only — see Versions)
vercel.json       Build config for deploying frontend + api/ together on Vercel
```

## Running it locally

Requires a local PostgreSQL instance (`postgresql://localhost:5432` by default).

```bash
# 1. Install backend deps at the repo root, and frontend deps separately
npm install
cd frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# .env needs: DATABASE_URL (point it at your local Postgres), JWT_SECRET (any random
# string — the file has a one-liner to generate one), ANTHROPIC_API_KEY (optional,
# only needed for the Claude slide-preview feature)

# 3. Create the schema and seed demo data
npx prisma migrate dev
npm run prisma:seed

# 4. Run both dev servers (in separate terminals)
npm run dev:api              # API on http://localhost:8787
cd frontend && npm run dev   # Frontend on http://localhost:5173, proxies /api to :8787
```

Sign in with any of the four seeded demo accounts (shown on the sign-in screen — passwords are also visible in `frontend/src/data/accounts.ts`, which is what `prisma/seed.ts` hashes and loads).

## Deploying to production

The target setup is **Vercel** (hosts the frontend build and the `api/` functions together, one deploy) **+ a managed Postgres** **+ an Anthropic API key**.

**Supabase is the recommended database.** It is plain Postgres, so the schema and migrations apply unchanged, and unlike Neon it can also be self-hosted via Docker — which matters because Seplat's stated model is to host on their own infrastructure. Two Supabase-specific details:

- `DATABASE_URL` must point at the **connection pooler** (port 6543, with `?pgbouncer=true`), since serverless functions open many short-lived connections.
- `DIRECT_URL` must point at the **direct connection** (port 5432); Prisma needs it for `migrate deploy`, which cannot run through the pooler.

1. **Database**: create a project at [supabase.com](https://supabase.com) (or [neon.tech](https://neon.tech)), copy its connection string(s).
2. **Vercel**: import this repo as a new Vercel project. `vercel.json` at the repo root already points it at `frontend/` for the build output and auto-detects `api/` for the serverless functions — no manual config needed there.
3. **Environment variables** (Vercel project → Settings → Environment Variables):
   - `DATABASE_URL` — the Neon connection string from step 1.
   - `JWT_SECRET` — a random 64-char hex string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com) → API Keys (a developer/billing account, separate from a claude.ai login — add a payment method under Billing first). Omit this and the app still works; the Claude preview button just returns a clear "not configured" message instead of crashing.
4. **Deploy**. `vercel.json`'s build command runs `prisma migrate deploy` against `DATABASE_URL` before building, so the schema is applied automatically.
5. **Seed the production database once**, from your machine, pointed at the Neon connection string: `DATABASE_URL="<neon-url>" npm run prisma:seed`.

## What's implemented

- **Executive**: Dashboard, Project Portfolio, Impact Chain, Communities, Reports & Exports (with Claude slide preview), Targets, Bulk Upload.
- **Reach, reported separately from Impact**: reach counts everyone a programme interacted with (applicants, attendees, people screened, catchment residents); impact counts only those who received the intervention. Both appear on the Executive Dashboard with a per-pillar breakdown, on every programme page with a conversion rate and a programme-specific note, and in exports. STEAM is the worked example — 120,000 scholarship applicants, 48 awards.
- **Custom fields per programme**: questions a programme keeps being asked, answered on its own page with a source and a last-updated stamp, and carried into that programme's export.
- **Manager**: My Projects, New Project (intake form), Approvals Queue, My Team.
- **Field Officer**: My Tasks, Log Activity, Evidence Repository.
- **Community Relations**: Stakeholder Register, Communities.
- Shared: Help & Standards (indicator/standards library and FAQ).

## Versions

- **`main`** — the current, actively developed build, now backed by a real database and API (see Stack above).
- **GitHub Pages** (the `.github/workflows` deploy target) builds only `frontend/` as a static site, with no database or API behind it. The app detects the absence of an API by response content type — a static host answers unknown paths with HTML, a real API returns JSON, including a 401 JSON when signed out, so status code alone is not a usable signal — and falls back to demo mode. Pages therefore stays a valid demo target; it is not a deployment target for real data.
- **`v1-archive`** branch — a frozen snapshot of the original v1 static prototype (state reviewed with Seplat before the 26 Aug 2026 feedback round), preserved for reference/rollback.

## Self-hosting

Seplat's stated model is to hold their own data on their own infrastructure, with no
vendor access after handover. `docker compose up -d --build` brings up the full stack
— nginx serving the build and proxying the API, the Node API, and PostgreSQL on a
named volume with no host port published.

- **[docs/SELF-HOSTING.md](docs/SELF-HOSTING.md)** — install, first-boot, TLS, backup
  and restore, upgrades, troubleshooting, and the handover position.
- **[docs/TECHNICAL-SPECIFICATION.md](docs/TECHNICAL-SPECIFICATION.md)** — for Seplat
  IT review: architecture, data model, auth, outbound data flows, and a plain list of
  known gaps.

Because the API is written as framework-agnostic handlers with thin adapters, the
self-hosted Express deployment and the serverless demo run the same business logic.

Accounts for a real deployment are created with `npm run create:user` — the demo seed
must never be used where real data lives, since its passwords are in this repository.

## Roadmap

- **PowerPoint file export** — the Claude-generated slide *outline* exists (Reports & Exports → Preview report → Slide preview); turning that into an actual downloadable `.pptx` with real chart graphics is the remaining piece.
- **Deeper bulk-upload ingestion** — Financial spend CSVs are parsed and written straight into spend records. Beneficiary counts, activity logs, and project master data are validated and parsed server-side but only logged as a reviewable upload (`BulkUpload` table) rather than written into live project/task records yet — that needs a decision on aggregation rules before it's safe to automate.
- **Reach for new programmes** — a programme without a reach profile is shown as unmapped and excluded from portfolio totals rather than counted as zero. Any programme added after this round needs its reach separated before it contributes to the headline figures.
- **Real SROI / compliance calculation** — both are still illustrative figures with a documented intended methodology (see the ⓘ tooltips on the Executive Dashboard), not computed from the data now sitting in Postgres.
- **ESG-Horizon "Social" module integration** — Teasoo's existing ESG-Horizon reporting/sustainability platform will eventually absorb this Social pillar; noted here for continuity, not yet started.
- "Our People" section of the flagship report (health/safety/D&I/environment) is intentionally a stub pending HR/HSE/environmental data sources SPIMS doesn't yet track.

## Known gaps

- Evidence "Upload" is presentational (no real file upload/storage) — it's the one workflow still not backed by a real table.
- No server-side role enforcement yet beyond "is this a valid session" — a Field Officer's session token could technically call a Manager-only endpoint. Routes don't currently check `role` before acting; that's the next hardening pass before a real deployment holding live data.
- Poppins is loaded from Google Fonts, so every user's browser makes a third-party request on each page load. It degrades to a system font stack when unreachable, but the font should be self-hosted before any production go-live — see [docs/SELF-HOSTING.md](docs/SELF-HOSTING.md) §8.
- No user-management screen — accounts are created with `npm run create:user`. No audit log beyond per-row "updated by/at" stamps.
- The full list, written for Seplat IT review, is in [docs/TECHNICAL-SPECIFICATION.md](docs/TECHNICAL-SPECIFICATION.md) §11.
- PDF/Excel/Word exports remain hand-generated client-side with zero dependencies (unchanged from the static-prototype version) — they now include the actual compiled report content and the report's scope (project selection + financial year), not just metadata.
