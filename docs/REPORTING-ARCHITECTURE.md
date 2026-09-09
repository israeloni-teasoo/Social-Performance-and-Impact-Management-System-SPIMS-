# SPIMS — Reporting Architecture

Decision record. What SPIMS adopts from the proposed reporting architecture, what it
does not, and why.

Version 1.1 · 9 September 2026

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
| Rendering | `frontend/src/reportPdf.ts`, `frontend/src/reportPptx.ts` | Turn a spec into a PDF and into a deck. Siblings, not parallel implementations. |
| Palette | `frontend/src/report/theme.ts` | The colours and tones both renderers draw from, so the two formats cannot drift apart. |

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

## PowerPoint, as built

The estimate above was 3–4 days for a renderer against a defined contract. That is
what it turned out to be, and the contract held: `reportPptx.ts` contains no report
structure at all. It decides how a block looks on a slide. What blocks exist, in what
order, and carrying which numbers was settled upstream, which is why a figure cannot
differ between the document and the deck — neither of them works it out.

**The charts are native chart objects, not images.** Seplat asked that PowerPoint
preserve charts "as graphics rather than flattened text". What is delivered is better
than that: `ppt/charts/chart1.xml` with an embedded worksheet, and `ppt/media/` empty.
Someone can restyle a bar or correct a label in PowerPoint without coming back to us,
and the underlying figures travel with the file.

**It no longer depends on the AI decision.** The August review tied this feature to
Seplat IT approving an AI service. It does not need one — the deck is built entirely
from calculated figures. The AI question now affects only optional drafting of prose.

Two honest limitations:

- **Fonts are named, not embedded.** A `.pptx` cannot carry a typeface the way a PDF
  does. The deck asks for Space Grotesk and Poppins and degrades to a standard
  sans-serif without them. Installing both on the machines that present from the deck
  removes the difference; there is no way to solve it inside the file.
- **A long section splits across slides rather than shrinking to fit.** Silently
  dropping the tail of a paragraph is the failure the original PDF writer had, and
  auto-shrinking type is the same failure with better manners.

---

## Modelling the output on Seplat's own report

Both exports are now set in the visual language of Seplat's published 2025 Social
Performance Report. That was not done by eye. The report was rendered to bitmaps, its
dominant colours sampled, and its font table read directly:

| Taken from their report | What we do with it |
|---|---|
| Deep green `#006B42`, mid green `#67B432`, amber `#F8B006`, teal `#1A8980`, orange `#EA5B1A` | The palette in `theme.ts`. Sampled, not guessed. |
| Space Grotesk for display type | Embedded in the PDF, named in the deck. Headings and every headline figure. |
| Aeonik for body copy | **Not used** — it is a commercial licence we do not hold. Poppins stands in. |
| Chapters colour-coded, with a tab strip showing which one you are in | The `chapter` block, and the strip both renderers draw. |
| A figure set very large, its label small above, its unit small below | The metric tiles. |
| Footer: organisation left, page number centred in green, report title right | Both formats, verbatim. |

The chapter block was added to the specification for this. A renderer cannot work out
which chapter a page belongs to after the fact — layout decides where pages fall — so
the structure had to be declared rather than inferred.

**Neither export carries Seplat's logo or claims to be their document.** They are
SPIMS output set in a matching house style, which is the point: a page from the system
can sit beside a page of their report without announcing itself as coming from
somewhere else.

---

## How the exports are verified

`frontend/scripts/verify-exports.mjs`. Two passes, because each catches what the other
cannot:

- **End-to-end** signs into the built application and clicks the export buttons. This
  is the pass that proves the renderers are reached. A renderer that works when called
  directly and is never wired to a button is this project's characteristic failure.
- **Block coverage** pushes a synthetic specification containing every block type
  through both renderers. The flagship report contains no callout — every programme
  currently has a reach profile, so there is no caveat to state — which left the block
  carrying the report's honesty qualification as the one block the end-to-end pass
  never exercises.

It asserts that the PDF embeds its faces and renders the naira sign, that the deck
contains native chart XML and no chart images, and that the callout renders. It does
not assert that the output looks right; that needs eyes.

Two false results were found while writing it, both worth recording because both are
the failure mode a check like this has:

1. Reading the PDF's inflated content streams reported every string as missing. The
   fonts are embedded with Identity-H encoding, so a stream holds glyph indices, not
   characters. The check was accusing a working renderer. It now shells out to poppler,
   and skips with a clear message where poppler is absent.
2. The callout's label is letter-spaced, so poppler extracts it as
   `B A S I S O F P R EP ARAT ION`. Whitespace is stripped before matching.

Playwright is deliberately **not** a dependency — a large install to serve one script.
The script says how to get it.

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
