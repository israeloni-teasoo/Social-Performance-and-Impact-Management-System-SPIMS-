# Build Prompt: Social Performance and Impact Management System (SPIMS)

Use this prompt as-is with an AI coding tool (e.g. Claude Code) or hand it to a developer/dev team as a build spec.

---

## 1. Project Context

Build a web application called **SPIMS (Social Performance and Impact Management System)** for an oil & gas / energy company operating in Nigeria (initial client: Heritage / Seplat Energy, via Teasoo Consulting).

The company currently tracks its community/social investment spending the way most companies do — as a CSR expenditure register (a list of what was spent, where). That is not enough. The system must show the **chain from output → outcome → impact**: e.g. "we trained 1,000 teachers" is an output; "50,000 children now have better-trained teachers" is the outcome; "measurable improvement in literacy / reduced youth restiveness in that community" is the impact. Every project in the system must be traceable along that chain.

The company is listed on the London Stock Exchange and needs to satisfy **two audiences with one dataset**:
- **Nigerian/local requirements**: NCDMB local content rules, Host Community Development Agreements, National Gender & Youth policies, State/LGA development priorities.
- **Global/international requirements**: IFRS S1 & S2 sustainability disclosures, GRI Standards, UN SDGs, IFC Performance Standards, general ESG reporting.

A project should be tagged once against both indicator sets, so the system can generate a local compliance report and a global ESG report from the same data, without double entry.

---

## 2. Objective

Build a strategic management platform — not just a spend tracker — that lets the company:
1. **Plan** social investment (budgets, projects, community needs).
2. **Track** spend and delivery against plan.
3. **Measure** outcomes and long-term impact, not just outputs.
4. **Report** to boards, regulators, and investors from one shared dataset.

---

## 3. Target Users / Roles

- **Field / Project Officers** — enter project data, activities, beneficiary numbers, site visit notes, evidence (photos, sign-off sheets).
- **Social Performance / Digital Team** (e.g. the Teasoo team) — configure indicators, review data quality, build reports, manage the framework mapping.
- **Community Relations / Stakeholder Managers** — manage community and stakeholder records, log grievances, track engagement.
- **Executives / Board** — view dashboards, KPIs, and board-ready reports; no data entry.
- **External Auditors / Investors** (read-only, report-only access) — view compliance and ESG reports only.
- **System Admin** — manage users, roles, approval workflows.

Build role-based access control (RBAC) so each role only sees/edits what it should.

---

## 4. Core Modules (build in this order, aligned to the four pillars below)

### Pillar 1 — Plan & Invest
- **Social Investment Planning**: annual budget, approved projects, community development plans, ESG objectives, SDGs addressed, project priorities, geographic coverage, beneficiary communities, timelines, implementing partners, risk assessment, approval workflow.
- **Community Profiles**: host community, cluster, LGA, state, population, Community Development Committee (CDC), traditional/youth/women's leadership, registered community contractors/cooperatives/SMEs, local skills inventory, community needs assessment.

### Pillar 2 — Track Spend & Delivery
- **Social Spend Tracking**: annual/approved budget, actual expenditure, budget utilization %, variance analysis, cost by project/community/thematic area, funding source, purchase orders, vendor payments, grant disbursements, community contributions, in-kind donations.
- **Project Portfolio Management**: project ID, title, category, owner, sponsor, community, LGA, state, GPS coordinates, description, start/end dates, status, contractor, implementing NGO, progress %, completion date.
- **Activity Tracking**: planned/completed/delayed activities, milestones, site visits, community meetings, trainings, workshops, stakeholder engagement sessions, public consultations, awareness campaigns, monitoring/evaluation visits.
- **Community Employment Tracker** (NCDMB compliance): total workforce, community vs non-community workforce, female/youth employees, persons with disabilities employed.

### Pillar 3 — Measure Outcomes & Impact
- **Beneficiary Management**: beneficiary counts disaggregated by gender, age, disability, occupation, vulnerable group, household, employment status, income bracket, community, location.
- **Outcome & Impact Measurement**: outputs (schools built, boreholes installed, farmers trained, trees planted, scholarships awarded) → outcomes (enrolment increase, water access improved, household income increase, reduced unemployment, better maternal health, increased yield) → long-term impact (poverty reduction, improved quality of life, climate resilience, social cohesion, economic growth, sustainable livelihoods).
- **Impact Assessment Module**: baseline/midline/endline surveys, Social Return on Investment (SROI), cost-benefit analysis, impact scoring, community perception surveys, independent evaluation records.
- **Grievance Management**: complaint intake, source, category, severity, investigation, resolution, closure time, escalation, post-resolution satisfaction; dashboard of open/closed grievances, average resolution time, repeat complaints.
- **Stakeholder Management**: stakeholder register (government agencies, NGOs, community leaders, women's/youth groups, persons with disabilities, traditional/religious institutions, development partners); meetings held, attendance, issues raised, agreements, commitments, action items.

### Pillar 4 — Report & Comply
- **ESG & SDG Mapping**: auto-map every project to relevant ESG pillars, SDGs, national development priorities, and corporate sustainability goals. Must be able to answer questions like "how much was invested in SDG 4?" or "which communities benefited most?"
- **KPI Dashboard**: financial KPIs (budget utilization %, cost per beneficiary/project, spend efficiency), operational KPIs (completion rate, on-time delivery), social KPIs (beneficiaries reached, female/youth participation, jobs created, SMEs supported), environmental KPIs (trees planted, CO₂ removed, hectares restored, waste recycled), ESG KPIs (community satisfaction, grievances resolved, local employment, supplier diversity).
- **Analytics & Dashboards**: interactive visualizations — spend by year/state/community/business unit, impact by project, beneficiaries reached, gender distribution, project status, heat maps, trend analysis, forecasts.
- **Reporting Module**: generate reports for Board, Executive Management, ESG/Sustainability/Annual reports, donor reports, regulatory submissions, community reports. Export to PDF, Excel, PowerPoint, Word.
- **Compliance Tracking**: alignment with company social investment policy, ESG commitments, ESIA commitments, Host Community Development Agreements, regulatory obligations, internal audit requirements.
- **Evidence Repository**: photos, videos, signed attendance sheets, contracts, MOUs, invoices, receipts, monitoring/evaluation reports, community testimonials, GIS maps, drone images.
- **Workflow & Governance**: role-based access, approval workflows, task assignment, notifications, escalations, audit trails, version control, e-sign-off.

### Advanced (build later, after Phase 1–2 pilot)
- **Predictive / AI-enabled features**: predict budget overruns, forecast delays, identify at-risk communities, detect duplicate interventions, recommend investment priorities, estimate SROI, sentiment analysis on stakeholder feedback, auto-generate ESG narratives.

---

## 5. Executive Dashboard Requirements (CEO View)

Must answer, at a glance:
| Question | Metric to show |
|---|---|
| How much have we invested? | Total social investment spend |
| Where has the money gone? | Spend by region / community / theme |
| What have we delivered? | Projects completed vs planned |
| Who benefited? | Beneficiaries by gender, age, vulnerable group |
| What changed? | Outcome and impact indicators |
| Are we compliant? | Commitments met vs outstanding |
| What risks exist? | High-risk projects, unresolved grievances |
| What value was created? | SROI, community satisfaction, ESG score |

Design principle: dashboards should be **mostly visual** (charts, not tables), with drill-down from company-wide → state → community → project.

---

## 6. Data Model (starting entities)

Design a relational schema (or document store, if preferred) with at least these entities and their relationships:
- `Community` (profile, location, leadership, needs assessment)
- `Project` (portfolio fields, status, budget link, community link, indicator tags)
- `Budget` / `Expenditure` (linked to project, community, thematic area, funding source)
- `Activity` (linked to project, type, date, status)
- `Beneficiary` (disaggregated demographic fields, linked to project/community)
- `Indicator` (name, type: local/global/both, category: ESG pillar / SDG / NCDMB clause, unit)
- `ProjectIndicatorMapping` (many-to-many: project ↔ indicator, with value/target/actual)
- `Stakeholder` (type, community link, engagement history)
- `Grievance` (linked to community/project, status, severity, resolution)
- `EvidenceFile` (linked to project/activity, file type, metadata)
- `User` / `Role` / `Permission` (RBAC)
- `ApprovalWorkflow` (linked to project/budget, status, approver, timestamp)

Every `Project` must be able to carry **two parallel indicator tags** — one local (NCDMB/State/LGA) and one global (SDG/GRI/ESG) — so a single data entry event feeds both report types.

---

## 7. Technical Requirements

- **Frontend**: responsive web app (desktop-first, tablet-usable for field officers). Suggested stack: React (or Next.js) + Tailwind, with a charting library (Recharts, Chart.js, or similar) for dashboards.
- **Backend**: REST or GraphQL API. Suggested stack: Node.js/Express or Python/FastAPI, with PostgreSQL as the primary database (relational data + reporting joins).
- **Auth**: role-based access control, with at minimum: Admin, Data Entry (Field Officer), Reviewer, Executive (read-only), External/Auditor (report-only).
- **File storage**: for the Evidence Repository (photos, videos, documents, GIS files) — use object storage (e.g. S3-compatible).
- **Exports**: PDF, Excel, PowerPoint, Word generation for the Reporting Module.
- **Offline consideration**: field officers may work in areas with poor connectivity — consider offline-capable data entry (local cache + sync) for the Activity Tracking and Beneficiary Management modules, if feasible in this phase.
- **Audit trail**: every create/update/delete on Project, Budget, and Indicator data must be logged with user, timestamp, and previous value.

---

## 8. Design/Brand Requirements

- Match Teasoo Consulting's brand: navy (`#111C55`) as primary, red/crimson (`#E31A38`) as accent, white/off-white (`#F7F7F7`) backgrounds, Poppins as the typeface.
- Dashboard visual style: card-based layout, big number callouts for KPIs, horizontal bar charts for spend-by-category breakdowns, avoid clutter — one primary visual per screen section.
- Mobile/tablet-friendly data entry forms for field officers.

---

## 9. Phased Delivery Plan

**Phase 1 — Define**
- Finalize the indicator framework: map NCDMB/local requirements against GRI/IFRS/SDG/ESG requirements; agree scope with the client.
- Design the data model (entities above) and confirm with stakeholders.

**Phase 2 — Build core**
- Build Plan & Invest and Track Spend & Delivery modules first (planning, budgeting, project portfolio, activity tracking).
- Build basic role-based access and data entry forms.

**Phase 3 — Build measurement & reporting**
- Build Beneficiary Management, Outcome & Impact Measurement, Grievance Management.
- Build the KPI Dashboard and core Analytics visualizations.
- Build the Reporting Module (PDF/Excel/PPT/Word export) and ESG/SDG auto-mapping.

**Phase 4 — Pilot & scale**
- Pilot with the client's current live programs; validate data quality with their team.
- Agree costing/support model.
- Roll out, train report owners, and layer in Evidence Repository, Compliance Tracking, and (later) predictive/AI features.

---

## 10. Success Criteria

- A project can be entered once and produce both a local-compliance report and a global ESG report without duplicate data entry.
- Executives can answer all 8 questions in the CEO Dashboard table (Section 5) in under one minute, without exporting to Excel first.
- Field officers can log an activity, beneficiary count, and evidence file for a project in under 5 minutes on a tablet.
- Reports can be exported in PDF, Excel, PowerPoint, and Word with one click.
- Every number in a report can be traced back to its source project/activity (audit trail).

---

## 11. Constraints & Assumptions

- Initial client (Heritage/Seplat) will provide real project/spend data after Phase 1 sign-off; until then, use realistic mock/sample data for demos.
- System must be Nigeria-context-aware (Naira currency formatting, States/LGAs as location hierarchy, NCDMB terminology).
- Build for eventual multi-client/multi-tenant use (Teasoo Consulting may deploy this for other clients), even if the first version is single-tenant.
