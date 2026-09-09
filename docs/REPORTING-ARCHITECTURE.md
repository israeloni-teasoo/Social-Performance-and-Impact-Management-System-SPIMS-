# SPIMS — Reporting Architecture

Decision record. What SPIMS adopts from the proposed reporting architecture, what it
does not, and why.

Version 1.0 · 9 September 2026

---

## The decision in one line

**The report specification is the product; PDF, PowerPoint and Word are renderers of
it.** Everything else in this record follows from that.

---

## What we adopted, and what it looks like now

The proposal's core insight is right and is now implemented:

```
  data  →  analytics layer  →  report spec  →  renderer  →  PDF / PPTX / Word
                  ▲                  ▲
                  │                  │
          deterministic        AI may write prose here,
          figures only         never numbers
```

| Layer | Where it lives | What it does |
|---|---|---|
| Analytics | `frontend/src/analytics/metrics.ts` | The only place a reported figure is calculated. Every metric carries its provenance — what is counted, how, and any caveat. |
| Specification | `frontend/src/report/spec.ts` | A closed set of typed blocks describing a report, independent of output format. |
| Assembly | `frontend/src/report/buildSpec.ts` | Decides what a report contains and in what order. The only place that decides. |
| Validation | `frontend/src/report/validate.ts` | Reconciles figures quoted in narrative against the analytics layer. |
| Rendering | `frontend/src/reportPdf.ts` | Turns a spec into a PDF. PowerPoint will be a sibling, not a parallel implementation. |

Four ideas from the proposal we took without reservation:

**1. Deterministic analytics, separate from AI.** No language model computes a figure
SPIMS reports. It may describe figures the analytics layer produced. This was already
the project's principle; it is now enforced by structure rather than by discipline.

**2. The specification as the primary object.** Adding PowerPoint is now a renderer —
roughly a day's work against a defined contract — rather than a second report engine
that will drift from the first.

**3. A closed block vocabulary.** `cover`, `metricGrid`, `reachComparison`, `progress`,
`spend`, `section`, `callout`, `break`. A renderer must handle every one; the compiler
enforces it, so adding a block without teaching a renderer about it fails the build
instead of shipping a blank page in a client report.

**4. Report validation.** Implemented and already earning its place — see below.

---

## What the validator found immediately

Reconciling the flagship report against the analytics layer flagged a figure on the
very first clean run. It turned out to be a fault in the validator, not the report: the
verified set contained portfolio and pillar totals but not per-programme figures, so a
section legitimately quoting one programme was flagged. One other programme passed only
by coincidence, because its pillar contains a single programme.

That is worth recording because it is the failure mode this kind of check has: a
validator that cries wolf gets ignored, and then it is worse than none. It now
reconciles portfolio, pillar and programme figures, and a deliberately planted
contradictory number is still caught.

---

## What we did not adopt, and why

The proposal is sound for a multi-tenant SaaS product. SPIMS is a single-tenant
internal system, self-hosted on Seplat's infrastructure, with a small user base. Several
recommendations would add operational cost without buying anything here.

| Proposed | Decision | Reason |
|---|---|---|
| Microservices split across seven services | **No** — modular monolith | The whole codebase is around 10,000 lines. Seven services means seven deployments for an install that must be simple enough for Seplat's IT to run themselves. The module boundaries exist in the code; they do not need network boundaries. |
| BullMQ + Redis job queue | **Not yet** | Report generation is currently a few hundred milliseconds in the browser. A queue would add Redis to a self-hosted stack that is deliberately three containers. Revisit if generation moves server-side and exceeds a few seconds. |
| S3 / Cloudflare R2 for storage | **No** — object storage inside their estate | Vendor cloud storage contradicts the data-sovereignty model Seplat asked for. When evidence files arrive, they go to storage running alongside the application. |
| Mapbox for maps | **No** | A third-party call from every user's browser, which is the dependency we just removed for fonts. If maps are needed, render them from data we hold. |
| Sentry for monitoring | **No** | Sends application data off Seplat's network. The handover position is that nothing calls home. Logs stay on their infrastructure. |
| OpenAI | **No** — Claude, and only for prose | Provider choice is Seplat IT's to make, and it is pending. The architecture makes the AI layer optional either way. |
| Next.js migration | **No** | Vite plus React works, builds in under two seconds, and the API is already framework-agnostic. Migrating buys nothing and costs a rewrite. |
| Assessment framework with questions and responses | **No** | SPIMS is not a survey tool. Its unit of measurement is the impact chain — inputs, activities, outputs, outcomes, reach, impact — with provenance on each figure. Bolting on a question/response model would duplicate that with a weaker one. |
| A composite "Impact Score" | **Not now** | A single weighted score is attractive and dangerous. Its weights are a judgement Seplat's M&E function must own, and SROI is already awaiting exactly that validation. Introducing a second unvalidated composite would compound the problem. |
| Report modes and audience variants | **Deferred, but designed for** | The specification makes this cheap later: a different assembly, same renderers. Not worth building before anyone has asked for a second audience. |

---

## What this changes about the PowerPoint work

Before this refactor, PowerPoint export meant writing a second report generator. It now
means writing a renderer against a defined contract:

```ts
function renderSlide(block: ReportBlock, meta: ReportMeta): Slide
```

Eight block types, each with an obvious slide form. PptxGenJS produces native editable
charts, verified by inspecting a generated file. Estimated at 3–4 days, and it no
longer depends on Seplat's AI decision — the deck is built from verified data, with AI
only optionally drafting commentary.

---

## Scale

Honest sizing rather than aspiration. SPIMS holds 8 programmes, tens of users and
around 20,000 beneficiary records. Present query patterns are unpaginated reads of small
tables, which is correct at this size and would not be at a hundred times it.

The points that would need attention first, in order:

1. **Pagination and indexes** on the list endpoints, once any table passes a few
   thousand rows. Trivial to add; premature now.
2. **Move report generation server-side** if a single report ever takes more than a
   second or two, at which point the job queue argument becomes real.
3. **Cache the analytics layer** per financial year. It is pure, so caching it is safe;
   it is also fast enough that caching would currently be measuring nothing.

None of these is blocking. Recording them means the trigger is known in advance rather
than discovered under load.
