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
- `docs/SELF-HOSTING.md` — the operator runbook.
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
  `{status, body}`. Two thin adapters call them: `server/app.ts` (Express, self-hosted)
  and `api/*` (serverless, demo). **Never put logic in an adapter** — it would exist in
  only one deployment.
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
`npx oxlint src`, `npm run build`, and exercise both demo and live modes.

## Never commit

`.env`, real credentials, or any API key. `ANTHROPIC_API_KEY`, `DATABASE_URL` and
`JWT_SECRET` are server-side only and must never reach the browser bundle.
