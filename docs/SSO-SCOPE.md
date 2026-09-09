# SPIMS — Single Sign-On Scope

Prepared by Teasoo Consulting for Seplat Energy Plc IT.
Version 1.0 · 9 September 2026

---

## 1. The question

Should SPIMS users sign in with their existing Seplat credentials rather than a
separate SPIMS password?

This is worth deciding now rather than later. The authentication layer is currently
small and isolated, so adding SSO is straightforward. It becomes progressively harder
once real accounts and passwords exist, because those accounts then have to be
reconciled with directory identities.

---

## 2. How sign-in works today

| | |
|---|---|
| Credentials | Email and password held by SPIMS, hashed with bcrypt |
| Session | Signed JWT in an `HttpOnly`, `SameSite=Lax` cookie, 7-day expiry |
| Roles | Held in the SPIMS database, read on every request |
| Account creation | An Executive creates accounts in Settings |
| Deactivation | Immediate — a deactivated account's live session stops on its next request |

Everything authentication-related lives in three files: `server/lib/auth.ts` (hashing
and token signing), `server/lib/session.ts` (the cookie) and
`server/handlers/auth.ts` (the login endpoint). Authorisation is entirely separate,
in `server/lib/guard.ts` and `server/lib/permissions.ts`, and **does not change under
any option below**. That separation is why this is a contained piece of work.

---

## 3. Options

### Option A — Keep SPIMS passwords (no change)

Nothing to build. Seplat carries the cost of a separate credential: joiners and leavers
must be managed twice, password policy is SPIMS's own, and there is no central place to
revoke access when someone leaves the company.

Reasonable if SPIMS will have very few users — which, if the Executive is the primary
user, may genuinely be the case.

### Option B — OpenID Connect against Microsoft Entra ID *(recommended)*

The standard approach for a Microsoft-based corporate estate. Seplat registers SPIMS as
an application in Entra ID; users click "Sign in with Seplat" and authenticate against
Seplat's own login, including whatever multi-factor policy already applies. SPIMS never
sees a password.

- Access is revoked centrally: disabling the directory account stops SPIMS access.
- Multi-factor, conditional access and password policy are inherited, not reimplemented.
- Works with the existing session cookie — SPIMS still issues its own session after the
  identity provider confirms who the user is.

### Option C — SAML 2.0

Equivalent outcome, older protocol. Choose only if Seplat's identity team specifically
requires SAML. It is more configuration for the same result, and the libraries are
heavier.

### Option D — OIDC with directory group mapping

Option B, plus SPIMS roles derived from Entra ID group membership rather than set in
SPIMS. Attractive in principle, but it means every role change becomes a directory
change, and Seplat's IT would need to create and maintain four groups. We would not
recommend it initially — start with Option B and add group mapping later if managing
roles in SPIMS proves annoying.

---

## 4. What changes in the system (Option B)

| Area | Change |
|---|---|
| Database | `User` gains a nullable external identifier and issuer; `passwordHash` becomes nullable, since an SSO user has no SPIMS password |
| Sign-in screen | A "Sign in with Seplat" button. Password fields remain for break-glass local accounts |
| New endpoints | Two: one to start the login redirect, one to receive the callback |
| Session | Unchanged — SPIMS still issues its own cookie after the provider confirms identity |
| Authorisation | Unchanged. Roles stay in the SPIMS database |
| Settings | Account rows show whether each account is directory-linked or local |

**Break-glass account.** At least one local password account must be retained for an
Executive. If the identity provider is unreachable — an outage, a misconfiguration, an
expired secret — an SSO-only system locks everyone out, including the person who would
fix it. We would not deploy SSO without this.

**Existing accounts.** Any account already created keeps working. Linking an existing
account to a directory identity is a matching step on first SSO login, by email address.

---

## 5. What Seplat must supply

Nothing can start without these:

1. **An app registration in Entra ID**, giving us the tenant ID, client ID and a client
   secret (or certificate).
2. **The redirect URI approved** — the SPIMS callback URL, which depends on where the
   system is hosted, so hosting must be settled first.
3. **A decision on scope**: which staff or groups may sign in.
4. **A decision on role assignment**: roles managed in SPIMS (recommended) or derived
   from directory groups (Option D).
5. **A named contact in the identity team** for the registration and for testing.

---

## 6. Effort and risk

| Item | Estimate |
|---|---|
| Implementation (Option B) | 3–5 working days |
| Testing against Seplat's tenant | 1–2 days, dependent on their availability |
| Documentation and handover update | Half a day |

The estimate assumes a standard Entra ID tenant and one redirect URI. Conditional-access
policies, guest accounts or an unusual tenant configuration can extend the testing phase
— that risk sits with the identity provider configuration, not with the code.

There is **no third-party cost**. The libraries are open source and Entra ID is part of
Seplat's existing Microsoft licensing.

**Main risk:** SSO cannot be tested without access to Seplat's tenant. We can build and
test against a separate test tenant, but final verification requires theirs, so their
identity team's availability determines the finish date more than the development work
does.

---

## 7. Recommendation

**Adopt Option B — OIDC against Entra ID — and decide now, but schedule it after
hosting is settled.** The redirect URI depends on the final hostname, so building it
before hosting is decided would mean doing the configuration twice.

Retain at least one local Executive account as break-glass, permanently.

Keep roles in SPIMS for now. Revisit directory-group mapping only if role management
becomes a burden, which with a small user base it will not.

If Seplat prefers to defer, the cost of deferring is low **provided the decision is
taken before many accounts exist** — reconciling a handful of accounts is trivial;
reconciling fifty is not.
