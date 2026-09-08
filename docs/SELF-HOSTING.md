# SPIMS — Self-Hosting Runbook

For the IT team operating SPIMS on Seplat's own infrastructure.

SPIMS runs entirely inside your network. There is no vendor-hosted component, no
call-home, and no route by which Teasoo can reach your database once this is
installed. Everything below runs on hardware you control.

---

## Status of this runbook

Honest statement of what has and has not been validated, so you know where to expect
friction:

| Component | Status |
|---|---|
| Application, API, database schema, migrations, auth | Verified working |
| Health endpoint, user provisioning, cookie and CORS settings | Verified working |
| `docker compose config` | Validates |
| Container images built and the three-service stack started | **Not yet run** — the build environment could not reach Docker Hub |

The application layer is tested. The container definitions are written but have not
been built on a real Docker host, so budget time for first-build fixes — most likely
base-image tags or a corporate registry mirror. Everything here is otherwise
straightforward.

---

## 1. What you are running

Three containers behind your own TLS terminator:

```
        your load balancer / reverse proxy (TLS)
                        │
                        ▼
        ┌───────────────────────────────┐
        │  web    nginx                 │  serves the built frontend,
        │         :80                   │  proxies /api to the API
        └───────────────┬───────────────┘
                        │  /api/*
        ┌───────────────▼───────────────┐
        │  api    Node 22 + Express     │  business logic, sessions,
        │         :8787                 │  migrations
        └───────────────┬───────────────┘
                        │
        ┌───────────────▼───────────────┐
        │  db     PostgreSQL 16         │  all data, on a named volume
        │         :5432 (internal only) │
        └───────────────────────────────┘
```

The browser only ever talks to `web`. Postgres is **not** published to the host — only
the `api` container can reach it.

The frontend and API are served from a single origin on purpose. The session cookie is
`HttpOnly` and `SameSite=Lax`; splitting them across origins would force `SameSite=None`
and a CORS policy, which is weaker and harder to operate.

---

## 2. Requirements

- Linux host with Docker Engine 24+ and the Compose plugin
- 2 vCPU, 4 GB RAM, 20 GB disk is comfortable for the expected load (tens of
  concurrent users, not thousands)
- A TLS certificate and a reverse proxy to terminate it
- Outbound internet access is **optional** — see §8

---

## 3. Install

```bash
git clone <repository-url> spims
cd spims
cp .env.docker.example .env
```

Fill in `.env`. Generate each secret separately:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable | Notes |
|---|---|
| `POSTGRES_PASSWORD` | Required. No default — the stack refuses to start without it. |
| `JWT_SECRET` | Required. Signs session tokens. Changing it signs everyone out. |
| `HTTP_PORT` | Host port nginx binds to. Default `8080`. |
| `SESSION_COOKIE_SECURE` | Leave `true` if serving over HTTPS. See §7 if not. |
| `ANTHROPIC_API_KEY` | Optional. Leave empty to run with no outbound calls at all. |
| `SEED_ON_START` | Leave `false` for any deployment holding real data. |

Then:

```bash
docker compose up -d --build
```

Migrations run automatically before the API accepts traffic, so a deployment can never
serve requests against an older schema.

Confirm it is up:

```bash
curl -s localhost:8080/api/health
# {"status":"ok","database":"connected"}
```

This endpoint reports `503` with `"database":"unreachable"` if Postgres is down, so it
is safe to wire into your monitoring as a real dependency check rather than a bare
liveness ping.

---

## 4. Create the first real account

**This step is not optional.** The demo accounts exist to make the prototype
explorable and **their passwords are published in this repository**. They must never
be a way into a deployment holding real data.

```bash
docker compose exec api npm run create:user -- \
  --email firstname.lastname@seplat.com \
  --name "Firstname Lastname" \
  --role exec
```

You will be prompted for a password (minimum 12 characters). It is never passed as an
argument, so it does not reach shell history or the process list.

Roles: `exec`, `manager`, `field`, `relations`.

If you loaded the demo dataset to try the system out, remove those accounts before
going live:

```sql
DELETE FROM "User" WHERE email IN (
  'amaka.okonkwo@seplat.com','tunde.bello@seplat.com',
  'grace.idemudia@seplat.com','blessing.aganbi@seplat.com'
);
```

> This script exists to create the **first** account. After that, sign in as that
> Executive and use **User Accounts** in the interface to create everyone else, set
> roles, deactivate people who leave, and reset passwords. Every user can change their
> own password from the same screen.
>
> Deactivating an account signs it out immediately — the existing session stops working
> on its next request. Accounts are deactivated rather than deleted so the comments and
> uploads attributed to that person survive.

---

## 5. TLS

Terminate TLS at your existing reverse proxy or load balancer and forward to
`HTTP_PORT`. A minimal nginx example:

```nginx
server {
  listen 443 ssl;
  server_name spims.seplat.com;

  ssl_certificate     /etc/ssl/certs/spims.crt;
  ssl_certificate_key /etc/ssl/private/spims.key;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Keep `SESSION_COOKIE_SECURE=true` whenever traffic reaches users over HTTPS.

---

## 6. Backup and restore

All state is in Postgres. There is no other persistent store — file uploads are not
yet implemented, so nothing lives on disk outside the database volume.

**Nightly backup:**

```bash
docker compose exec -T db pg_dump -U spims -Fc spims > spims-$(date +%F).dump
```

**Restore:**

```bash
docker compose exec -T db pg_restore -U spims -d spims --clean --if-exists < spims-2026-09-03.dump
```

Test the restore path on a non-production copy before you need it. A backup you have
never restored is not a backup.

Retain according to Seplat's data-retention policy; the dumps contain personal data
(names, emails, bcrypt password hashes) and should be encrypted at rest.

---

## 7. Common problems

**Login appears to succeed, then every page acts signed out.**
The session cookie is marked `Secure`, so the browser refuses to send it over plain
HTTP. Either put TLS in front (correct fix) or set `SESSION_COOKIE_SECURE=false` in
`.env` and restart. This is the single most likely first-install issue on an internal
HTTP deployment.

**`api` container restarts in a loop.**
Check `docker compose logs api`. Almost always `DATABASE_URL` or a failed migration.
The entrypoint runs `prisma migrate deploy` first and exits non-zero if it fails,
deliberately, rather than starting against a mismatched schema.

**Health endpoint returns 503.**
Postgres is unreachable. Check `docker compose ps` and `docker compose logs db`. The
API recovers on its own once the database returns — no restart needed.

**Nobody can sign in and the account was definitely created.**
Check the account is active: a deactivated account is refused at sign-in with a clear
message. If the last Executive was somehow deactivated directly in the database, create
a fresh one with `npm run create:user` — the interface deliberately refuses to
deactivate or demote the last active Executive, so this should not arise through
normal use.

---

## 8. Running with no internet access

SPIMS works air-gapped, with two caveats.

**Claude report generation** calls Anthropic's API. Leave `ANTHROPIC_API_KEY` empty
and the feature returns a clear "not configured" message; nothing else is affected.

**Fonts** are served by the application itself — the Poppins files are held in the
repository and bundled at build time. No browser contacts Google, and the interface
renders correctly with no outbound access. Nothing to do.

If the font ever needs refreshing (a new weight, or a Google Fonts revision), run
`node frontend/scripts/fetch-fonts.mjs` on a machine with internet access and commit
the result. That is a development task, never required at install time.

---

## 9. Upgrades

```bash
git pull
docker compose up -d --build
```

Migrations apply automatically on start. Take a backup first. Review release notes for
any migration that is not backwards-compatible.

---

## 10. Handover position

Once installed, this is Seplat's system:

- **The data is yours.** It lives in your Postgres volume, on your infrastructure.
  Teasoo has no access to it and no mechanism to obtain it.
- **The secrets are yours.** `JWT_SECRET`, database credentials and any API keys are
  generated by you and never shared.
- **No telemetry.** SPIMS sends nothing to Teasoo — no usage data, no error reports,
  no heartbeat.
- **The only outbound call** the application makes is to Anthropic, only when Claude
  report generation is used, and only if you supply a key. See the technical
  specification for exactly what is sent.
- **Support** is provided against the source, not against your running instance. For
  us to diagnose an issue you would need to share logs or a redacted extract
  deliberately; we cannot obtain them ourselves.
