# Working notes for this repository

SPIMS — Social Performance & Impact Management System, built by Teasoo Consulting for
Seplat Energy Plc.

## Standing instruction: keep the status report current

Four generated files are the client-facing record of where the project stands. **They
must be updated in the same commit as any change that alters what the system does, what
is outstanding, or what is recommended.**

| Source | Outputs |
|---|---|
| `docs/status-report/content.cjs` | `docs/PROJECT-STATUS.md`, `docs/SPIMS-Project-Status.docx` — the full report |
| `docs/status-report/note.cjs` | `docs/PROGRESS-NOTE.md`, `docs/SPIMS-Progress-Note.docx` — the short note for circulation |

All four are generated. Never edit them by hand:

1. Edit the relevant source above.
2. Run `npm run report` — it rebuilds both documents.
3. Commit the regenerated files alongside the change.

Keep the note brief: if a section grows past a short table, it belongs in the full
report instead.

Bump `meta.version` and set `meta.date` and `meta.commit` when the substance changes.
A change that only touches internals — a refactor with no behavioural difference — does
not need a version bump, but anything a reader of the report would care about does.

The other two documents follow the same rule when they are affected:

- `docs/TECHNICAL-SPECIFICATION.md` — for Seplat IT. Architecture, data model, auth,
  outbound data flows, known gaps.
- `docs/SELF-HOSTING.md` — the operator runbook for the self-hosted model.
- `docs/DEPLOY-VERCEL.md` — the runbook for the managed (Vercel) model.
- `docs/REPORTING-ARCHITECTURE.md` — reporting decisions, and what was deliberately
  not adopted.
- `docs/SSO-SCOPE.md` — single sign-on options and effort.

## Reporting rules that apply to the product itself

- **Every derived figure carries its provenance** — metric, calculation, source and
  caveat. A number without a source is not reportable.
- **Reach and impact are separate.** Reach counts everyone a programme interacted with;
  impact counts only those who received the intervention. Never merge them into one
  figure. A programme with no reach profile is shown as unmapped, never as zero.
- **Illustrative figures must say so** in the interface, not only in documentation.
  SROI and the compliance percentages are currently illustrative.

## Reporting architecture

Reports flow: **analytics layer → report spec → renderer**. See
`docs/REPORTING-ARCHITECTURE.md` for the decision record.

- `frontend/src/analytics/metrics.ts` is the **only** place a reported figure is
  calculated. No screen, exporter or prompt may compute one of its own.
- `frontend/src/report/spec.ts` describes a report as data. Its block list is a closed
  set — a renderer's switch ends in `assertNever`, so adding a block without updating
  every renderer fails the build rather than shipping a blank page.
- `frontend/src/report/validate.ts` reconciles narrative figures against analytics
  before export. When it flags something, check the validator's verified set before
  assuming the report is wrong — a false positive there is worse than no check.
- Adding an output format means a new renderer of the spec. Never a second pipeline.
- `frontend/src/report/theme.ts` holds the palette, sampled from Seplat's published
  2025 report. Both renderers draw from it; neither defines a colour of its own.
- **Every export surface goes through `frontend/src/report/download.ts`.** It is what
  reconciles the narrative against analytics before a file is written. A screen that
  wires up its own export would silently issue an unvalidated report.
- Chapters are read off the section headings (`Our Impact — what changed`), not
  invented. Adding a report means writing headings in that form, not editing renderers.
- In the deck, `line: { width: 0 }` does **not** remove a shape's border — PptxGenJS
  ignores the zero and draws a grey stroke. Use `line: { type: 'none' }`.
- The exports are modelled on that report deliberately — typeface, colours, chapter
  tabs, the way figures are set. Changing those is a brand decision, not a styling
  preference. They carry no Seplat logo and must not claim to be their document.

### Verifying an export

`cd frontend && npm i --no-save playwright && npm run build && node scripts/verify-exports.mjs`

Run it after touching either renderer. It exports through the real UI — a renderer that
works when called directly and is never wired to a button is the failure this catches —
and separately pushes every block type through both renderers, because the flagship
report contains no callout to exercise.

## Conventions

- Business logic lives in `server/handlers/*` as hosting-agnostic functions returning
  `{status, body}`. One thin adapter calls them: `server/app.ts` (Express). Vercel
  mounts that same app through the single catch-all `api/[...path].ts`. **Never put
  logic in the adapter.**
- Authorisation is one shared decision in `server/lib/guard.ts` against the table in
  `server/lib/permissions.ts`. Adding a route means adding its permission rule; writes
  with no rule are refused by default.
- Frontend store hooks are dual-mode: live API when one is present, bundled seed data
  and `localStorage` otherwise. `isApiAvailable()` detects this by **response content
  type**, not status code — a signed-out API legitimately returns 401 JSON, while a
  static host returns 200 HTML.
- Data hooks must only mount for a signed-in user. They load once on mount, so mounting
  them earlier means a 401, a silent fallback to seed data, and no re-fetch after login.

## Testing expectations

Seed data and database content are currently identical, so "the numbers look right"
does **not** prove the backend is being used. To verify live mode genuinely reads the
database, insert a row that exists nowhere in the seed and confirm it appears.

Before pushing: `npx tsc --noEmit -p tsconfig.json`, `cd frontend && npx tsc -b`,
`npx oxlint src`, `npm run build`, and exercise both demo and live modes. Also
`npm run check:routes` (the API is still one catch-all function) and `npm run test:parsers`
(the media source parsers and the alert matcher). `npm run smoke:api` drives the
catch-all against a real database when the deployment shape itself is in question, and
`npm run smoke:alerts` drives collection through to alert delivery against a local feed
and a local webhook — the only way to exercise that path without real outbound access,
which a development sandbox does not have.

## Deployment

Two models, both live: self-hosted (Docker, Express) and managed (Vercel). Both run the
same Express app. Things that bite on the serverless side:

- **`api/` must hold exactly one file, `api/index.ts`,** with routing done by the
  `/api/(.*)` rewrite in `vercel.json`. Vercel makes a function per file, and 48 of them
  exceeds the Hobby ceiling of twelve. A route missing from `api/` answers with the
  single-page application's HTML, which the frontend reads as "no API" and silently falls
  back to seed data. Adding routes is free; adding files under `api/` is not.
- **A bracketed filename is not a catch-all.** `api/[...path].ts` was tried and shipped
  broken: Vercel compiles any `[segment]` under `api/` to `([^/]+)`, one path segment
  only, so `/api/health` worked and `/api/auth/me` returned an HTML 404 and put the whole
  interface into demo mode. `[...]` is a Next.js convention. Routing belongs in
  `vercel.json`, and the rewrite passes the original path as `__path` for `api/index.ts`
  to restore.
- **Run `npm run check:vercel` before deploying.** It runs `vercel build` locally (no
  account needed) and replays the real generated route table against every Express route.
  Nothing else in the toolchain can see a routing mistake, because locally Express does
  the routing and Express is never the problem.
- **The catch-all works because Vercel skips its request helpers for Express.** The
  launcher injects a lazy `req.body` only when the default export has no `.listen`
  method, so an Express app receives an untouched stream for `express.json()`. Exporting
  a bare `(req, res)` function instead would reintroduce that race.
- **Migrations do not run in the build.** Build-time `prisma migrate deploy` let every
  preview deployment migrate production, and failed the build outright when `DIRECT_URL`
  was unset. Apply them deliberately, before deploying.
- **Cron frequency is plan-bound.** Hobby rejects anything more often than daily at
  deploy time. `vercel.json` ships the daily schedule so it deploys on either plan.
- **`server/lib/db.ts` caches the Prisma client on `globalThis` unconditionally.** The
  usual dev-only guard leaks a connection pool per invocation on serverless. Do not
  "tidy" it back.
- **`DATABASE_URL` must be the pooled connection** on serverless; `DIRECT_URL` is the
  unpooled one migrations need.
- **Long-running routes need `maxDuration`** in `vercel.json`. A mention run cut short
  by the platform writes no run record, which is precisely the silent-empty-queue
  failure the run log exists to prevent.
- `SELF_AUTHENTICATED_ROUTES` in `permissions.ts` is the one place default-deny is set
  aside. Anything listed there must authenticate its own caller and fail closed.
- **Routes are registered through the local `get`/`post` wrappers in `app.ts`, never
  `app.get`/`app.post` directly.** Express 4 lets a rejected promise from an async
  handler go unhandled, which terminates the process — on serverless that is a crashed
  invocation answering with the host's HTML error page, i.e. demo mode again. The
  wrappers route the rejection to the error handler at the foot of the file, which
  always replies JSON and keeps the detail in the log.

## Media monitoring

Phase one only: free press and web sources (GDELT, news RSS, Google Alerts). Social
platforms need a paid provider and are not built.

- **Fetching is server-side, always.** It is the only reason no user's browser contacts
  an outside host. Never move it into the frontend.
- **Collection sends nothing about Seplat** — a search term, and for feed sources not
  even that. Keep it that way; the specification undertakes it in §7.3. **Alerting is
  the exception and is scoped deliberately**: it sends the org name, the article's
  headline, outlet and public URL, and the rule names it matched. Never widen that to
  carry programme data, figures or user identity — §7.4 undertakes it, and the payload
  builders in `lib/media/alerts.ts` are the only place it is constructed.
- **Sources are opt-in.** With none active, nothing is contacted at all.
- A mention is evidence someone published something. It is **never** a reported figure
  and must not be mixed into the analytics layer.
- The coverage limitation travels with the data (`COVERAGE_NOTE`, duplicated server and
  client), not only in documentation.
- Parsers live in `server/lib/media/parse.ts` and are tested against fixtures:
  `npm run test:parsers`. The fixtures were written from documented formats, not
  captured live, so treat the first real run as the real test.
- **A webhook URL is a credential.** It never reaches the browser — `maskUrl` returns
  the host only — and configuration refuses plain http.
- **Alerts are at-most-once**, marked on the attempt rather than on confirmed delivery.
  Do not "fix" this into a retry: it would double-post alerts that did arrive, and a
  webhook broken for a week would dump a week of backlog when repaired. Failures are
  recorded on the channel and shown on screen instead.
- The queue polls every 45s while it is open and visible, pausing on a hidden tab. That
  interval is a cost decision as much as a freshness one on a per-invocation platform.

## Never commit

`.env`, real credentials, or any API key. `ANTHROPIC_API_KEY`, `DATABASE_URL` and
`JWT_SECRET` are server-side only and must never reach the browser bundle.
