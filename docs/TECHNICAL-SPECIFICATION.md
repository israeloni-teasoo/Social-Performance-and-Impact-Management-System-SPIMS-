# SPIMS — Technical Specification

**Social Performance & Impact Management System**
Prepared by Teasoo Consulting for review by Seplat Energy Plc IT.

This document describes what SPIMS is, how it is built, what it requires from your
infrastructure, what data leaves your network (and when), and what is not yet built.
It is written for technical review, not as a sales document — §11 lists the gaps as
plainly as §4 lists the features.

---

## 1. Purpose

SPIMS records Seplat's social investment programmes and reports their performance
against both Nigerian regulatory frameworks (NCDMB local content, PIA Host Community
Development Trust, NUPRC host-community regulations) and international standards (GRI,
IFRS S1/S2, IPIECA, UN SDGs).

Its organising principle is data provenance: every derived figure carries the metric,
the calculation, the source and the caveat behind it. Where a number is a projection
rather than a measurement, the system says so.

---

## 2. Architecture

Three tiers, all inside the customer network:

| Tier | Technology | Responsibility |
|---|---|---|
| Presentation | React 19 + TypeScript, built with Vite, served by nginx | Single-page application |
| Application | Node.js 22 + Express | API, sessions, business rules, migrations |
| Data | PostgreSQL 16 | All persistent state |

The API is written as framework-agnostic handlers (`server/handlers/*`) returning
`{status, body}`. Two thin adapters call them: an Express server for self-hosted
deployment, and serverless function wrappers for a cloud demo. **This is deliberate** —
the business logic has no dependency on either hosting model, so the self-hosted
deployment is not a second-class port.

The frontend and API are served from one origin. Sessions use an `HttpOnly`,
`SameSite=Lax` cookie; a split origin would require `SameSite=None` plus CORS, which is
weaker.

---

## 3. Data model

17 tables. The substantive ones:

| Table | Holds |
|---|---|
| `User` | Login accounts — email, bcrypt hash, role, active flag |
| `Project` | Programme master record — budget, pillar, state, status |
| `ProjectImpact` | Impact chain per programme: inputs, activities, outputs, outcomes, **reach**, impact, methodology, provenance |
| `CustomField` | Per-programme question/answer pairs with sources |
| `Community` | Host communities |
| `Stakeholder` | Stakeholder register |
| `FieldTask` / `TeamMember` | Field workflow and assignment |
| `Approval` / `ApprovalComment` | Manager approval queue |
| `Report` / `ReportComment` | Report definitions and review comments |
| `Target` | Organisational targets and progress |
| `SpendEntry` | Financial spend records |
| `EvidenceItem` | Evidence register (metadata only — see §11) |
| `Indicator` | Indicator library mapping local to global frameworks |
| `BulkUpload` | Audit record of CSV uploads |

Schema changes are managed as versioned Prisma migrations under
`prisma/migrations/`, applied by `prisma migrate deploy` before the API starts. No
hand-applied SQL; no schema drift between environments.

### Reach vs. Impact

Worth calling out because it is a modelling decision, not a display choice. `Reach`
counts everyone a programme interacted with; `Impact` counts only those who received
the intervention. They are separate fields and separate figures throughout. A
programme with no reach profile is reported as unmapped and excluded from portfolio
totals rather than counted as zero.

---

## 4. Interfaces

32 HTTP endpoints under `/api`. All accept and return JSON.

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/health` — liveness plus a real database round trip
- Read: `projects`, `project-impacts`, `communities`, `indicators`, `reports`,
  `evidence`, `stakeholders`, `targets`, `tasks`, `team`, `approvals`,
  `report-comments`, `custom-fields`
- Write: stakeholders, targets (create/close), tasks (assign/status), team invite,
  approvals (approve/return/comment), report comments, custom fields
  (create/update/delete), `bulk-upload`, `reports/generate-preview`

Only `/api/health` and the three `/api/auth/*` routes are reachable without a session.
Every other endpoint, read or write, requires one.

---

## 5. Authentication and sessions

- Passwords hashed with **bcrypt**, cost factor 10. Plaintext is never stored or logged.
- On login the server issues a **JWT** signed with `JWT_SECRET` (HS256), containing
  only user ID and role, with a 7-day expiry.
- The token is delivered as an **`HttpOnly` cookie**, so page JavaScript cannot read
  it — this is the main defence against session theft via XSS.
- `SameSite=Lax` mitigates CSRF on cross-site requests.
- `Secure` is on by default and configurable for internal-HTTP installs
  (`SESSION_COOKIE_SECURE`).
- Rotating `JWT_SECRET` invalidates all sessions immediately — the lever to pull in an
  incident.
- Accounts are **deactivated, never deleted**, because a user is referenced by the
  comments they wrote and the uploads they made. A deactivated account is refused at
  sign-in and its existing session stops working on its next request, not when the
  token expires — the role and active flag are read from the database per request.

Cross-origin access is **off by default**. If needed, `CORS_ORIGINS` takes an explicit
allowlist; the API never reflects arbitrary origins.

---

## 6. Authorisation

Enforcement happens in a single shared gate (`server/lib/guard.ts`) applied by both
adapters, against one permission table (`server/lib/permissions.ts`). One
implementation means the self-hosted and serverless deployments cannot drift into
different security postures.

**Reads** are available to any signed-in user. SPIMS is a single-tenant internal
system where staff are expected to see the portfolio; the meaningful restriction is on
who can change it. This is a deliberate decision rather than an omission.

**Writes** are restricted by role, derived from what each role's navigation actually
exposes — so the API permits exactly what the interface offers and nothing more:

| Action | Permitted role |
|---|---|
| Targets (create, close), bulk upload | Executive |
| Approvals (approve, return, comment), team invite, task assignment | Project Manager |
| Task status updates | Field Officer, Project Manager |
| Stakeholder register | Community Relations |
| Report preview, report comments, programme custom fields | Executive, Project Manager |
| Account administration — create, set role, deactivate, reset password | Executive |
| Changing your own password | Any signed-in user |

The account list is also restricted to the Executive on read, since it carries email
addresses and role assignments rather than portfolio data. Account administration sits
with the Executive because it is the senior role in this system; if Seplat wants
separation of duties, a dedicated administrator role can be split out without
disturbing anything else.

Three changes are refused outright, because each would leave the system with no way
in: deactivating your own account, changing your own role away from Executive, and
deactivating or demoting the last active Executive.

A write to a route with no permission rule is **refused by default**, so a route added
without a rule fails visibly in development rather than shipping unprotected.

Roles are read from the database on each request, not from the session token, so a
role change or a disabled account takes effect immediately rather than when the
seven-day token expires.

### Correction to an earlier draft

An earlier version of this document stated that every write endpoint verified a valid
session, and that there was no unauthenticated write path. **That was incorrect.** On
testing, every read endpoint and several write endpoints — targets, stakeholders, team
invite, task status, approval approve/return, and custom-field deletion — accepted
requests with no session at all. Only handlers that happened to take a user parameter
were protected.

This has been fixed and verified: unauthenticated requests to those endpoints now
return 401, and cross-role requests return 403. The correction is recorded here rather
than quietly amended, because the earlier statement was relied upon.

---

## 7. Outbound data flows

Complete list of everything that leaves the customer network.

### 7.1 Anthropic Claude API — optional, off by default

- **Trigger:** a user clicks "Preview report" and requests slide generation.
- **Endpoint:** `https://api.anthropic.com`, model `claude-sonnet-5`.
- **Sent:** the report name, lens, scope note, and the compiled report section
  content — the same aggregate figures that appear in the report itself.
- **Not sent:** credentials, password hashes, user records, or the database.
- **Disable:** leave `ANTHROPIC_API_KEY` empty. The feature returns a clear
  "not configured" message and nothing else changes.

Because report content is aggregate social-performance data rather than personal data,
the exposure is limited — but it is still data crossing your boundary to a third party,
and **it is Seplat IT's decision whether that is acceptable.** If it is not, the
feature can be left disabled indefinitely without affecting any other function.

### 7.2 Web fonts — resolved

Earlier versions requested the Poppins typeface from Google, so every user's browser
made a third-party request on each page load. **The font is now served by the
application itself.** The files are held in the repository and bundled at build time,
so no browser contacts Google, and the interface renders correctly with no outbound
access at all. Poppins is used under the SIL Open Font License 1.1.

### 7.3 Media monitoring — planned, not built

The requested media and social mention tracking module will require a third-party
monitoring API (Meltwater, Brand24 or similar). That is an additional outbound
integration and would need its own review. It is not present in the current system.

### 7.4 Nothing else

No telemetry, analytics, crash reporting, heartbeat, or vendor call-home. Teasoo has
no network path to a deployed instance.

---

## 8. Hosting requirements

- Linux host, Docker Engine 24+ with the Compose plugin
- 2 vCPU / 4 GB RAM / 20 GB disk for the expected load
- TLS terminated at your reverse proxy
- Outbound internet optional (see §7)
- Postgres is not published to the host network; only the API container reaches it

Full install, backup and upgrade procedures: `docs/SELF-HOSTING.md`.

---

## 9. Backup and recovery

All state is in PostgreSQL — there is no second persistent store. `pg_dump` /
`pg_restore` procedures are in the runbook. Dumps contain personal data (names,
emails, password hashes) and should be encrypted at rest and retained per Seplat
policy.

The application containers are stateless and can be rebuilt from source at any time.

---

## 10. Data ownership

- Data resides in Seplat's Postgres instance on Seplat infrastructure.
- Secrets are generated by Seplat and never shared with Teasoo.
- Teasoo has no access to the running system, its database, or its logs.
- Support is provided against the source code. Diagnosing a production issue requires
  Seplat to share logs or a redacted extract deliberately.
- Licence model: Seplat purchases usage rights and hosts independently; Teasoo
  provides installation, training and ongoing maintenance under the commercial terms,
  covered by NDA.

---

## 11. Known gaps

Stated plainly so they can be weighed during review.

| # | Gap | Impact | Remedy |
|---|---|---|---|
| 1 | ~~No server-side role enforcement~~ — **fixed**, see §6 | Was: any caller, signed in or not, could reach most endpoints | Closed: shared guard, permission table, default-deny on writes |
| 2 | ~~No user-management screen~~ — **closed** | Was: accounts could only be created by command line | Executives create accounts, set roles, deactivate and reset passwords in the interface; every user can change their own password |
| 3 | **Evidence upload is metadata only** | No file storage; the register records descriptions, not documents | Object storage plus upload/download |
| 4 | **Bulk upload is partial** | Financial spend writes to live records; beneficiary counts, activity logs and project data are validated and logged for review only | Needs Seplat's decision on aggregation rules before automating |
| 5 | **SROI and compliance figures are illustrative** | Labelled as such in the interface, with methodology shown, but not computed from live data | Agree financial proxies with Seplat M&E, then compute |
| 6 | ~~Google Fonts dependency~~ — **closed** (§7.2) | Was: a third-party request from each user's browser on every page load | Font files are served by the application; verified that a signed-in session makes zero external requests |
| 7 | **PowerPoint export produces an outline, not a file** | No `.pptx` with chart graphics | Generation library plus chart rendering |
| 8 | **No audit log** | Data changes record who and when on the row, but there is no immutable append-only trail | Dedicated audit table if required for assurance |
| 9 | **Demo dataset ships in the repository** | Demo account passwords are public | Do not seed production; delete demo accounts (runbook §4) |

Items 1, 2 and 6 are closed — the three we considered blocking for a production
go-live holding real data. Of what remains, items 4 and 5 depend on decisions only
Seplat can make; 3, 7 and 8 are scheduled work.

---

## 12. Technology summary

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19, TypeScript, Vite | Mainstream, long-lived, large hiring pool |
| Backend | Node.js 22, Express | Same language across the stack |
| ORM | Prisma 5 | Type-safe queries, versioned migrations |
| Database | PostgreSQL 16 | Open source, no licence cost, standard in Seplat-scale estates |
| Auth | bcrypt + JWT in an HttpOnly cookie | No third-party identity dependency |
| Packaging | Docker Compose | Reproducible install, no host-level dependency beyond Docker |

No proprietary runtime, no vendor lock-in, no per-seat third-party licence. The entire
stack is open source and the source is delivered to Seplat.

### Possible future integration

Single sign-on against Seplat's existing identity provider (Entra ID / Active
Directory) is not built, but the auth layer is isolated enough that adding OIDC would
not disturb the rest of the system. Worth raising if SSO is a requirement — it is
easier to plan for now than to retrofit later.

---

*Prepared by Teasoo Consulting. Questions on any section can be directed to the
project team.*
