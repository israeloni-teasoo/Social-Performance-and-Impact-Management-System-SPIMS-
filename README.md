# SPIMS — Social Performance & Impact Management System

An implementation of the SPIMS platform designed for Teasoo Consulting / Seplat Energy, built from the Claude Design handoff in `project/SPIMS.dc.html` (see `chats/` for the design conversation that shaped it).

SPIMS moves social-investment reporting from a spend register to an output → outcome → impact chain, with one dataset that produces both a Nigerian local-compliance report (NCDMB/PIA/NUPRC) and a global ESG report (GRI/IFRS/SDG). It has four personas — **Executive**, **Project Manager**, **Field Officer**, and **Community Relations** — each with their own workspace, switchable live via the "Viewing as" control in the top bar.

**Live demo**: once GitHub Pages finishes deploying from `main`, this runs at `https://<owner>.github.io/<repo>/` (check the repo's **Settings → Pages** or the **Actions** tab for the exact URL and deploy status).

## Stack

This is a **standalone front-end** — React + TypeScript + Vite, no backend or database. All data (projects, communities, indicators, reports, stakeholders, tasks, approvals, evidence) is seeded mock data drawn from Seplat's real programmes (STEP, PEARLs, Eye Can See, YEP, etc.), matching the original design's scope of a front-end-complete interactive prototype.

The one genuinely stateful workflow — grievance case management (**log → assign → investigate → resolve → close/escalate**, with a full case-history timeline) — runs entirely client-side and persists to the browser's `localStorage`, so it survives a page reload but is local to your browser (not shared across devices/users). Styling matches the original design system (navy `#111C55` / crimson `#E31A38` / Poppins).

## Project layout

```
frontend/   React app — views/, components/, data/seed.ts, useGrievanceStore.ts
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

All 16 views from the design, matching it pixel-for-pixel:

- **Executive**: Dashboard, Project Portfolio, Impact Chain, Communities, Indicator Library, Grievances, Reports & Exports.
- **Manager**: My Projects, New Project (intake form), Approvals Queue.
- **Field Officer**: My Tasks, Log Activity, Evidence Repository.
- **Community Relations**: Grievance Cases, Log Grievance, Stakeholder Register.

## Known gaps (match the original design's stated scope)

- Approvals "Approve"/"Return" buttons are presentational, as in the original — not wired to move items off the queue.
- Auth is the same "Viewing as" persona switch as the design (no login/session); there's no server-side access control since there's no server.
- Reports "Generate report →" and Evidence "Upload" are presentational (no PDF/Excel/PPT export or file upload).
- Data other than grievances (projects, spend, communities, etc.) is static seed data — editing it in the UI (e.g. "New Project", "Log Activity") doesn't persist, matching the original prototype's scope.

## A note on architecture

An earlier version of this build included a real Express + PostgreSQL + Prisma backend with server-enforced role-based access control on the grievance workflow, so mutations were validated server-side rather than just gated by the UI. That version isn't in this repo (by request, to keep this deployable as a static site with no infrastructure) — if you want the backend brought back for a real multi-user deployment, that's a straightforward re-addition since the frontend's data layer (`data/seed.ts` + `useGrievanceStore.ts`) is a thin, swappable layer designed to be replaced by API calls.
