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

Three tiers. **Where they run depends on which deployment model is chosen — see §2.1,
because it changes what can and cannot be undertaken about the data.**

| Tier | Technology | Responsibility |
|---|---|---|
| Presentation | React 19 + TypeScript, built with Vite, served by nginx | Single-page application |
| Application | Node.js 22 + Express | API, sessions, business rules, migrations |
| Data | PostgreSQL 16 | All persistent state |

The API is written as framework-agnostic handlers (`server/handlers/*`) returning
`{status, body}`, called by one thin Express adapter. Managed hosting mounts that same
adapter as a single catch-all function rather than reimplementing it. **This is
deliberate** — the business logic has no dependency on either hosting model, and
neither deployment is a second-class port of the other.

An earlier design gave the managed model its own wrapper per route. That was abandoned
for two reasons. It exceeded the host's per-deployment function limit, so the
deployment was refused outright. And a route present in one adapter but not the other
failed silently rather than loudly: the unmatched path returned the single-page
application's HTML, which the interface reads as "no API present", falling back to
bundled sample data while appearing to work.

The frontend and API are served from one origin. Sessions use an `HttpOnly`,
`SameSite=Lax` cookie; a split origin would require `SameSite=None` plus CORS, which is
weaker.

### 2.1 Two deployment models

Both are supported and run identical business logic. They differ in one respect that
matters more than any technical detail: **who holds the data.**

| | Self-hosted | Managed (Vercel) |
|---|---|---|
| Application | Docker Compose on Seplat infrastructure | The same Express application, as one Vercel function |
| Database | PostgreSQL inside the Seplat estate | A managed provider (Supabase or Neon) |
| Interface | nginx container | Vercel's static edge |
| Scheduled collection | System cron | Vercel Cron |
| **Data at rest** | **Seplat infrastructure** | **The database provider's infrastructure** |
| **Data in transit** | Stays within the network | Passes through Vercel |
| Operator access | Seplat only | Vercel and the database provider hold operational access to their own platforms |

**Seplat is currently proceeding with the managed model.** That is a legitimate choice
— it removes the infrastructure and operational burden entirely, and it is the fastest
route to a working system — but it must be made with open eyes, so this document states
the consequence plainly rather than leaving the earlier self-hosting language standing:

> Under the managed model, Seplat's social performance data is stored and processed on
> third-party infrastructure outside Seplat's estate. The data-sovereignty position
> described elsewhere in this document applies to the self-hosted model only.

The two models are not a one-way door. The database is standard PostgreSQL and the
application is standard Node; moving from managed hosting to Seplat infrastructure is a
database dump, a restore and a redeploy, with no code change. That reversibility is
cheap precisely because there is no separate managed-hosting code path to maintain or
to rot: the function the managed model runs *is* the self-hosted application.

What does **not** change between the models: authentication, the role permission table,
the absence of any telemetry, and the fact that the only outbound calls are those in
§7 — every one optional and off by default.

---

## 3. Data model

17 tables. The substantive ones:

| Table | Holds |
|---|---|
| `User` | Login accounts — email, bcrypt hash, role, active flag |
| `Project` | Programme master record — budget, pillar, state, status, plus intake detail (timeline, funding source, community, partners) |
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
| `OrgSettings` | Organisation name, financial year, currency, target year, data-status note |

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

Enforcement happens in a single shared gate (`server/lib/guard.ts`), against one
permission table (`server/lib/permissions.ts`), ahead of the route table so a route
cannot be added without being covered. One implementation, reached by one adapter,
means the self-hosted and managed deployments cannot drift into different security
postures.

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
| Organisation settings | Executive (readable by any signed-in user, since the interface needs them) |
| Creating and updating projects | Executive, Project Manager |
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

### 7.3 Media and web monitoring — built (press and web only)

Phase one is implemented and is the second outbound flow in the system. It reads three
kinds of free, public source:

| Source | Host contacted | What is sent |
|---|---|---|
| GDELT DOC 2.0 article index | `api.gdeltproject.org` | A search term, e.g. `"Seplat Energy"` |
| A news outlet's own RSS/Atom feed | that outlet's domain | Nothing — a plain GET of a public feed |
| A Google Alerts feed | `google.com` | Nothing — a plain GET of the feed URL you created |

Four properties this integration is built to hold, which are worth checking during
review because they are the whole basis on which it is acceptable:

1. **Server-side only.** The application server makes these calls. No user's browser
   ever contacts these hosts, so outbound traffic comes from one address your firewall
   can see and control.
2. **No Seplat data is transmitted.** A search term and nothing else. Not programme
   names, not figures, not who is signed in, not any beneficiary record.
3. **Opt-in and default-off.** Sources are configured in the interface by an Executive.
   With none configured, nothing is contacted at all — a fresh install makes no
   outbound request of any kind.
4. **No credentials, no subscription, no account.** All three source types are public
   and unauthenticated. There is no API key to hold or to leak.

Requests carry a `User-Agent` identifying SPIMS, time out after 20 seconds, and a
failing source is reported to the operator rather than silently swallowed.

If this must be blocked entirely, deactivating every source stops it, and blocking the
hosts above at the firewall stops it independently of the application.

**Not included:** social media and hashtag tracking. The major platforms release
mention data only through licensed partners, so that requires a paid provider — no
amount of engineering removes that. The limitation is stated in the API response and
shown on the screen, not only here.

### 7.4 Alert delivery — built, off until configured

The third outbound flow, and the only one that sends anything **about** Seplat rather
than only a search term. It must be read differently from §7.3 for that reason.

When a newly collected mention matches a watchlist rule, SPIMS posts a message to the
webhook URLs configured under **Media & Mentions → Alerts**. Nothing is sent when no
rule matches, and nothing at all is sent until both a rule and a channel exist — a
fresh install makes no such call.

| What leaves | Where it goes |
|---|---|
| The organisation name as configured in Settings | The webhook host you configured — typically Microsoft Teams or Slack |
| The headline, outlet and public URL of the article | The same |
| The names of the rules it matched | The same |
| A link back to this deployment, when `PUBLIC_APP_URL` is set | The same |

What does **not** leave: any programme data, any figure, any beneficiary record, any
user identity, and the article text beyond the outlet's own headline. The payload is
built from the public article and from configuration, never from the portfolio.

Three properties worth checking during review:

1. **The webhook URL is a credential.** Anyone holding it can post into that channel.
   It is stored server-side, never returned to the browser — only its host is, so that
   channels can be told apart — and only an Executive can add or remove one.
2. **https only.** A plaintext webhook is refused at configuration time, because the
   URL is a bearer credential and the payload names the coverage Seplat is watching for.
3. **At most once.** A mention is marked notified when the attempt is made, not when
   delivery is confirmed. A retry risks double-posting an alert that did arrive, and a
   webhook broken for a week would deliver a week of backlog in one burst when fixed.
   A failed delivery is recorded against the channel and shown on the screen; the queue
   remains the durable record, and the alert is only a prompt to go and look at it.

Alerting is narrow by design. Rules are opt-in and named, and a mention matching none
is collected silently into the queue as before. Alerting on everything collected would
train people to ignore the alerts, which is worse than having none.

To stop it entirely: remove the channels, or block the webhook host at the firewall.
Collection and the review queue are unaffected.

### 7.5 Nothing else

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

**Under the self-hosted model:**

- Data resides in Seplat's Postgres instance on Seplat infrastructure.
- Secrets are generated by Seplat and never shared with Teasoo.
- Teasoo has no access to the running system, its database, or its logs.
- Support is provided against the source code. Diagnosing a production issue requires
  Seplat to share logs or a redacted extract deliberately.
- Licence model: Seplat purchases usage rights and hosts independently; Teasoo
  provides installation, training and ongoing maintenance under the commercial terms,
  covered by NDA.

**Under the managed model (Vercel), the first three change:**

- Data resides with the chosen database provider (Supabase or Neon), not on Seplat
  infrastructure. Their terms, jurisdiction and retention policy apply, and Seplat
  should review them as it would any processor.
- Secrets are held in the Vercel project's environment variables. Whoever administers
  that Vercel account can read them, so account ownership should sit with Seplat rather
  than with Teasoo.
- Teasoo has access to the running system only to the extent Seplat grants it on those
  two accounts, and can be removed from both at any time without touching the code.

The remaining points hold unchanged. If any of the above is unacceptable to Seplat's
information-security policy, the self-hosted model exists precisely for that case and
requires no code change.

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
| 7 | ~~PowerPoint export produces an outline, not a file~~ — **closed** | Was: no `.pptx` file at all | A real `.pptx` with native, editable chart objects and embedded worksheets. See §11.1 for the one dependency advisory it introduces |
| 8a | **Mention monitoring covers press and web only** | No social media or hashtag tracking; the queue is not a complete picture of coverage | A paid provider (§7.3). Stated in the interface, not only in this document |
| 8 | **No audit log** | Data changes record who and when on the row, but there is no immutable append-only trail | Dedicated audit table if required for assurance |
| 9 | **Demo dataset ships in the repository** | Demo account passwords are public | Do not seed production; delete demo accounts (runbook §4) |

Items 1, 2, 6 and 7 are closed. Of what remains, items 4 and 5 depend on decisions
only Seplat can make; 3 and 8 are scheduled work.

### 11.1 One open advisory, disclosed

`npm audit` reports **two high-severity advisories** in `image-size`, reached as a
transitive dependency of PptxGenJS (the PowerPoint library). We are not able to close
them and are not going to pretend otherwise, so here is the full position:

- **The advisory range is `*`.** Every published version of `image-size` is affected,
  including the newest. There is no version to upgrade to. `npm audit fix --force`
  "resolves" it by downgrading PptxGenJS from 4.0.1 to 1.1.5, which is not a fix.
- **The vulnerable code is never loaded.** The advisories describe infinite loops in
  the ICNS, JXL and HEIF image parsers. `image-size` is a Node-only dependency;
  PptxGenJS's browser build imports JSZip and nothing else, which we verified against
  the shipped bundle. It does not enter the code a user's browser runs.
- **Nothing feeds it an image.** SPIMS decks contain no images at all — the charts are
  native chart objects. There is no path by which a file, trusted or otherwise, reaches
  an image parser.

Our assessment is that the exposure is nil and the risk of downgrading the library is
real. If Seplat IT's policy is that no dependency may carry an open high-severity
advisory regardless of reachability, tell us and we will remove PowerPoint export
rather than argue the point — the rest of the system is unaffected.

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
Directory) is not built. It is now scoped in full — options, what changes, what Seplat
must supply, effort and risk — in **docs/SSO-SCOPE.md**. Summary: OpenID Connect
against Entra ID, 3–5 days of development plus testing against Seplat's tenant, no
third-party cost, and a local break-glass Executive account retained permanently.

---

*Prepared by Teasoo Consulting. Questions on any section can be directed to the
project team.*
