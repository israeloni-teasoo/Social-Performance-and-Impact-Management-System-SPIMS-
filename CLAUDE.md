# Working notes for this repository

SPIMS — Social Performance & Impact Management System, built by Teasoo Consulting for
Seplat Energy Plc.

## Standing instruction: keep the status report current

`docs/SPIMS-Project-Status.docx` and `docs/PROJECT-STATUS.md` are the client-facing
record of where the project stands. **They must be updated in the same commit as any
change that alters what the system does, what is outstanding, or what is recommended.**

Both files are generated. Never edit them by hand:

1. Edit `docs/status-report/content.cjs` — the single source for both.
2. Run `npm run report`.
3. Commit the regenerated `docs/PROJECT-STATUS.md` and `docs/SPIMS-Project-Status.docx`
   alongside the change.

Bump `meta.version` and set `meta.date` and `meta.commit` when the substance changes.
A change that only touches internals — a refactor with no behavioural difference — does
not need a version bump, but anything a reader of the report would care about does.

The other two documents follow the same rule when they are affected:

- `docs/TECHNICAL-SPECIFICATION.md` — for Seplat IT. Architecture, data model, auth,
  outbound data flows, known gaps.
- `docs/SELF-HOSTING.md` — the operator runbook.

## Reporting rules that apply to the product itself

- **Every derived figure carries its provenance** — metric, calculation, source and
  caveat. A number without a source is not reportable.
- **Reach and impact are separate.** Reach counts everyone a programme interacted with;
  impact counts only those who received the intervention. Never merge them into one
  figure. A programme with no reach profile is shown as unmapped, never as zero.
- **Illustrative figures must say so** in the interface, not only in documentation.
  SROI and the compliance percentages are currently illustrative.

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
