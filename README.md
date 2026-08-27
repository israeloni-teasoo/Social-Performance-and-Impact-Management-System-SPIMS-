# SPIMS — Social Performance & Impact Management System

An implementation of the SPIMS platform designed for Teasoo Consulting / Seplat Energy, built from the Claude Design handoff in `project/SPIMS.dc.html` (see `chats/` for the design conversation that shaped it).

SPIMS moves social-investment reporting from a spend register to an output → outcome → impact chain, with one dataset that produces both a Nigerian local-compliance report (NCDMB/PIA/NUPRC) and a global ESG report (GRI/IFRS/SDG). It has four personas — **Executive**, **Project Manager**, **Field Officer**, and **Community Relations** — each with their own workspace. The sign-in screen lists a demo account for each persona.

**Live demo**: once GitHub Pages finishes deploying from `main`, this runs at `https://<owner>.github.io/<repo>/` (check the repo's **Settings → Pages** or the **Actions** tab for the exact URL and deploy status).

## Stack

This is a **standalone front-end** — React + TypeScript + Vite, no backend or database. All data (projects, communities, indicators, reports, stakeholders, tasks, approvals, evidence) is seeded mock data drawn from Seplat's real programmes (STEP, PEARLs, Eye Can See, YEP, etc.), matching the original design's scope of a front-end-complete interactive prototype.

Approvals, targets, team members, tasks, stakeholders, report comments, and the signed-in session all run client-side and persist to the browser's `localStorage`, so they survive a page reload but are local to your browser (not shared across devices/users). Styling matches the original design system (navy `#111C55` / crimson `#E31A38` / Poppins).

## Project layout

```
frontend/   React app — views/, components/, data/seed.ts, useAuth.ts
chats/      Original design conversation transcripts (provenance)
project/    Original Claude Design HTML/CSS/JS handoff bundle (reference only, not built/served)
.github/    GitHub Actions workflow that builds and deploys frontend/ to GitHub Pages on push to main
```

## Running it locally

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

No environment variables, no database, no backend process required.

## What's implemented

- **Executive**: Dashboard, Project Portfolio, Impact Chain, Communities, Reports & Exports, Targets, Bulk Upload.
- **Manager**: My Projects, New Project (intake form), Approvals Queue, My Team.
- **Field Officer**: My Tasks, Log Activity, Evidence Repository.
- **Community Relations**: Stakeholder Register, Communities.
- Shared: Help & Standards (indicator/standards library and FAQ).

## Versions

- **`main`** — the current, actively developed build (v2 onward).
- **`v1-archive`** branch — a frozen snapshot of v1 (the state reviewed with Seplat before the 26 Aug 2026 feedback round), preserved for reference/rollback. It is not deployed; `main` is what's live on GitHub Pages.

## Roadmap

- **PowerPoint export with real charts** (not flattened text) — planned for Phase 2, generated using Claude.
- **ESG-Horizon "Social" module integration** — Teasoo's existing ESG-Horizon reporting/sustainability platform will eventually absorb this Social pillar; noted here for continuity, not yet started.
- Report structure for the flagship "Social Performance Report" is aligned to Seplat's actual published annual report (Overview → Our Impact → Our Communities → Our People); the "Our People" section is intentionally a stub pending HR/HSE/environmental data sources SPIMS doesn't yet track.

## Known gaps

- Sign-in is a hardcoded demo-account allow-list checked client-side (`data/accounts.ts`); there's no server-side access control since there's no server. A production deployment needs real authentication and server-enforced role permissions.
- Bulk Upload (Executive role) validates a CSV client-side and queues it for review, but doesn't yet parse rows into live SPIMS records — that requires a backend import pipeline.
- Evidence "Upload" is presentational (no real file upload/storage).
- SROI and the "Are we compliant?" panel are illustrative placeholders, not computed from live data — see the ⓘ tooltips on the Executive Dashboard for the intended methodology and what's still missing.
- Data other than approvals, targets, team members, tasks, stakeholders, and report comments (projects, spend, communities, indicators, etc.) is static seed data — editing it elsewhere doesn't persist, though everything editable in the UI persists to the browser's `localStorage`.
- PowerPoint export is a stub (see Roadmap above); PDF/Excel/Word exports are fully functional, hand-generated client-side with zero dependencies.

## A note on architecture

An earlier version of this build included a real Express + PostgreSQL + Prisma backend with server-enforced role-based access control, so mutations were validated server-side rather than just gated by the UI. That version isn't in this repo (by request, to keep this deployable as a static site with no infrastructure) — if you want a backend brought back for a real multi-user deployment, that's a straightforward re-addition since the frontend's data layer (`data/seed.ts` and the `use*Store.ts` hooks) is a thin, swappable layer designed to be replaced by API calls.
