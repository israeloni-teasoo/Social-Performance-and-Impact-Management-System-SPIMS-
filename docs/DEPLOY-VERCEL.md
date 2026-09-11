# SPIMS — Deploying on Vercel

The managed deployment model. For the self-hosted model see `SELF-HOSTING.md`; for what
the two mean for data ownership, see §2.1 and §10 of `TECHNICAL-SPECIFICATION.md`
before starting — the difference is not technical.

Version 1.1 · 11 September 2026

---

## What you need

1. A **Vercel** account, owned by Seplat rather than by Teasoo. Whoever owns it can
   read every environment variable, including the session signing key.

   It must be a **Pro** team, not Hobby. This is not a capacity judgement — Vercel's
   fair-use terms restrict Hobby to non-commercial personal projects, and define
   commercial use to include any deployment someone was paid to build. A consultancy
   deliverable for Seplat is squarely inside that definition on both counts. Pro is
   about $20 per seat per month. Hobby will also hold the deployment to one cron run
   per day; see §4.
2. A **PostgreSQL** database. Vercel does not provide one. Supabase is the
   recommendation: it is standard PostgreSQL, so the schema and migrations apply
   unchanged, and unlike the alternatives it can also be self-hosted later — which is
   what keeps the move back onto Seplat infrastructure a dump-and-restore rather than a
   migration project.
3. Nothing else. No API key is required for the system to work; the two optional
   integrations are described below.

---

## 1. The database, and the one setting that matters

Create the database and take **two** connection strings from it. This is the step that
is easy to get wrong and expensive to diagnose.

| Variable | Which string | Why |
|---|---|---|
| `DATABASE_URL` | The **pooled** connection — Supabase port `6543`, or a Neon `-pooler` host — with `?pgbouncer=true&connection_limit=1` appended | Serverless functions come and go constantly. Without a pooler, each one opens its own connections and the database runs out of them under quite ordinary load. The failure looks like an outage, not like a configuration mistake. |
| `DIRECT_URL` | The **direct** connection, port `5432` | Migrations alter the schema, which cannot be done through a transaction pooler. Prisma uses this for migrations only. |

Example:

```
DATABASE_URL="postgresql://postgres.abc:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abc:PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

---

## 2. Environment variables

Set these in **Project → Settings → Environment Variables**, for Production (and
Preview, if you use preview deployments).

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled. See above. |
| `DIRECT_URL` | Yes | Direct. See above. |
| `JWT_SECRET` | Yes | Signs session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Changing it signs everyone out, which is the emergency lever if a session is ever suspected compromised. |
| `CRON_SECRET` | Only for scheduled media collection | Generate the same way. Leave it unset and scheduled collection refuses every request — see §4. |
| `ANTHROPIC_API_KEY` | No | Only for AI-drafted report commentary. Every export works without it. |
| `MEDIA_FETCH_TIMEOUT_MS` | No | Defaults to 20000. Lower it if a collection run is being cut short. |
| `PUBLIC_APP_URL` | No | The deployment's public address, e.g. `https://spims.seplat.com`. Alerts use it for the link back to the review queue; without it they still send, but carry no link. On Vercel it falls back to the project's production domain, so a custom domain is the case that needs it. |
| `ALERT_WEBHOOK_TIMEOUT_MS` | No | Defaults to 10000. |
| `SESSION_COOKIE_SECURE` | No | Defaults to on in production, which is right for Vercel. Do not set it to `false` here. |

`NODE_ENV` is set to `production` by Vercel; do not set it yourself.

---

## 3. Deploy

Import the repository. Leave **Root Directory** at the repository root — if you point
it at `frontend/`, Vercel stops reading `vercel.json` and never builds `api/`, so you
get the interface with no API behind it, which is the silent-demo-data failure in §5.

`vercel.json` carries the build configuration:

```
npx prisma generate && cd frontend && npm install && npm run build
```

`prisma generate` is repeated here even though `postinstall` already runs it, because
Vercel caches `node_modules` between builds and a cached install skips `postinstall` —
leaving a Prisma client generated against the previous schema.

### Apply migrations

Migrations are **not** run by the build, and are applied deliberately, from a machine
with the direct connection string:

```bash
DIRECT_URL="<direct connection>" DATABASE_URL="<direct connection>" npx prisma migrate deploy
```

They used to run in the build command. That was wrong in two ways. Every preview
deployment migrated the production database, so an experimental branch could alter the
live schema without anyone deciding it should. And it coupled deployment to database
reachability: a transient connection failure — or simply a missing `DIRECT_URL` — failed
the whole build with a Prisma schema-validation error that says nothing about the
deployment being otherwise sound.

Order matters when a release includes a schema change: apply the migration, then deploy.
Run `npm run check:routes` before deploying, which is the guard described in §6.

### Create the first account

There is no self-registration, so the first account is created from a machine with the
database credentials to hand:

```bash
DATABASE_URL="<direct connection>" npm run create:user
```

It prompts for name, email, role and password. Make it an `exec`; that role can then
create everyone else from **Settings → User accounts**.

**Do not seed the demo dataset into a production database.** The demo account passwords
are in the repository and therefore public.

---

## 4. Scheduled media collection

`vercel.json` registers a cron job that collects mentions once a day:

```json
{ "path": "/api/cron/collect-mentions", "schedule": "0 6 * * *" }
```

Once a day is the Hobby ceiling, and Vercel enforces it at deploy time: a more frequent
expression is rejected with *"Hobby accounts are limited to daily cron jobs"* and the
deployment fails. The schedule shipped is therefore the one that deploys on either plan.

On Pro, change it to `0 6,18 * * *` for twice-daily collection. Runs overlap on purpose
— de-duplication makes an overlap free, whereas a gap between windows loses coverage
silently. Vercel may fire the job anywhere inside the scheduled hour, which this job
does not care about.

**Set `CRON_SECRET` or this does nothing.** Vercel sends it as an `Authorization:
Bearer` header; the endpoint refuses every request when the variable is unset. That is
deliberate: the alternative — allowing the call when no secret is configured — would
leave a deployment that forgot the variable exposing an unauthenticated endpoint that
makes outbound network requests. Off until configured is the safe end of that trade.

The job reports success with `skipped: true` when no sources are configured, so an
unconfigured install does not show as a failing job every night.

To turn scheduled collection off, remove the `crons` block, or simply pause every
source under **Media & Mentions → Sources**. Collection remains available on demand
from the button on that screen either way.

### Being told, rather than having to look

Collection on its own only means the queue fills sooner. Under **Media & Mentions →
Alerts** an Executive sets a watchlist — named rules, each a short list of terms — and
one or more webhooks to post to when a newly collected mention matches one.

Keep the rules narrow. A rule matching most coverage teaches people to ignore the
alerts, and everything else still arrives in the queue regardless; rules decide what is
urgent, not what is collected. Matching ignores case and picks up word endings, so
`spill` also catches "spills" and "spillage", but it will not fire inside another word.

For **Microsoft Teams**, the webhook must come from a *Workflows* template — channel →
Workflows → "Post to a channel when a webhook request is received". The old Office 365
connector webhooks were switched off in May 2026 and a URL from that flow will not work
however valid it looks. For **Slack**, an Incoming Webhook for the channel. Anything
else receives a documented JSON body naming the flagged mentions and the rules they
matched.

Two things worth knowing before you configure one:

- **The webhook URL is a credential.** Anyone holding it can post into that channel. It
  is stored server-side and never shown again — the screen displays only its host — and
  it must be `https`.
- **An alert is sent at most once per mention.** If a webhook is broken at the moment a
  story lands, that alert is not re-sent when it is fixed; the mention still sits in the
  queue. Use *Send a test* after configuring, and watch for a channel showing a failed
  last attempt. §7.4 of the technical specification explains the reasoning.

---

## 5. Checking it worked

```bash
curl https://<your-deployment>/api/health
# {"status":"ok","database":"connected"}
```

A `503` here means the functions are running but cannot reach the database — almost
always `DATABASE_URL`. HTML instead of JSON means the API functions did not deploy at
all, in which case the interface will silently fall back to its bundled sample data and
look like it is working. **That is the failure mode worth checking for deliberately:**
sign in and confirm a change you make survives a reload in a different browser. If it
does not, you are looking at demo data.

Then confirm, in order:

1. Sign in with the account created above.
2. **Settings** shows `Database: PostgreSQL` and a real user count.
3. Create a project; reload; it is still there.
4. Export a report as PDF and as PowerPoint.
5. **Media & Mentions → Sources**, add a source, then *Check for new mentions*. A
   failing source names its own error rather than returning an empty queue.

---

## 6. How the API is deployed, and the two things not to change

Vercel turns **every file under `api/` into its own function**. There is exactly one:
`api/index.ts`, which hands the request to the same Express app used when self-hosting.
`vercel.json` sends every `/api` path to it:

```json
"rewrites": [{ "source": "/api/(.*)", "destination": "/api/index?__path=$1" }]
```

**Do not add a file per route.** Vercel's Hobby plan refuses a deployment carrying more
than twelve functions and this project has 48 routes. And on a plan where it succeeds, a
route in `server/app.ts` with no file under `api/` does not 404 — the deployment answers
with HTML, the interface reads HTML as "no API here", and the whole thing falls back to
bundled sample data while looking like it works.

**Do not replace the rewrite with a bracketed filename.** `api/[...path].ts` looks like a
catch-all and is not one: that is a Next.js convention, and Vercel compiles any
`[segment]` under `api/` to `([^/]+)` — exactly one path segment. It was tried, and the
result was a deployment where `/api/health` worked and `/api/auth/me` returned Vercel's
HTML 404, so every screen reported that there was no server. Routing belongs in
`vercel.json`.

Three checks, in increasing order of cost and confidence:

| Command | What it proves |
|---|---|
| `npm run check:routes` | The file and the rewrite still agree, and nothing has been added under `api/` |
| `npm run smoke:api` | The function answers, including in the rewritten `?__path=` form, against a real database |
| `npm run check:vercel` | Every route reaches the function **in the routing table Vercel actually builds** |

The last one is the one that matters before a deploy. It runs `vercel build` locally —
no account needed — and replays the generated route table. Reasoning about Vercel's
routing was wrong twice; reading its own build output was right the first time.

---

## 7. Costs

| Item | Cost |
|---|---|
| Vercel | Pro, about $20 per seat per month. Hobby is free but its terms exclude commercial use, and it caps collection at one run per day. |
| Database | Supabase and Neon both have free tiers that fit this dataset. Paid tiers start around $25/month. |
| Media monitoring, press and web | None. The sources are public. |
| AI commentary | Usage-based and small. Optional. |

Third-party costs are recharged at cost and are not part of the platform fee.

---

## 8. Moving to Seplat infrastructure later

Not a rewrite, and worth knowing before committing to managed hosting:

1. `pg_dump` from the managed database.
2. Restore into Postgres on Seplat infrastructure.
3. Follow `SELF-HOSTING.md`, pointing `DATABASE_URL` at it.
4. Replace the Vercel cron entry with a system cron job against the same path and
   bearer token.

No application code changes — and no second code path to go stale, because the Vercel
function is the Express app. What runs managed is what runs self-hosted.
