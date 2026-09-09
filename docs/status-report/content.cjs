/**
 * Single source of truth for the SPIMS project status report.
 *
 * `build.js` renders this into both docs/PROJECT-STATUS.md and
 * docs/SPIMS-Project-Status.docx, so the Word file and the repository copy can never
 * disagree. Update this file whenever the project moves, then run:
 *
 *   node docs/status-report/build.cjs
 *
 * Block types: p (paragraph), bullets, table {head, rows}, note (highlighted callout).
 */

module.exports = {
  meta: {
    title: 'SPIMS — Project Status Report',
    subtitle: 'Social Performance & Impact Management System',
    client: 'Prepared for Seplat Energy Plc',
    author: 'Teasoo Consulting',
    version: '1.5',
    date: '9 September 2026',
    commit: '8a49ca7',
  },

  sections: [
    {
      heading: 'Purpose of this report',
      blocks: [
        {
          type: 'p',
          text:
            'This report sets out the current state of the Social Performance & Impact Management System (SPIMS): what has been built and verified, what the system can do today, what remains outstanding, the realistic options for each outstanding item, and our recommendation on each. It is written to support a decision, not to market the work — sections on what is unfinished are given the same weight as those on what is complete.',
        },
        {
          type: 'p',
          text:
            'It reflects the position at the commit reference on the cover, and is regenerated whenever the system changes so that it never lags behind the build.',
        },
      ],
    },

    {
      heading: '1. Executive summary',
      blocks: [
        {
          type: 'p',
          text:
            'SPIMS has moved from a static visual prototype to a working system with a real database, authenticated users, role-based permissions, and a deployment path onto Seplat’s own infrastructure. Every point raised in the review of 26 August has been addressed, including the correction that mattered most: reach and impact are now separate figures in the data model, not a single conflated number.',
        },
        {
          type: 'p',
          text:
            'The system is ready to be demonstrated and to be installed on Seplat infrastructure. The three items we regarded as blocking a deployment holding real data — server-side permission enforcement, account administration, and the removal of third-party calls from the interface — are now closed. Several figures remain illustrative pending Seplat’s own data and methodology decisions, and those are listed plainly in sections 4 and 5.',
        },
        {
          type: 'p',
          text:
            'The critical dependency is no longer engineering. It is access to Seplat’s actual programme data, and four decisions only Seplat can make. These are set out in section 7.',
        },
      ],
    },

    {
      heading: '2. What has been built',
      blocks: [
        {
          type: 'p',
          text:
            'Work has proceeded in four stages: the original visual prototype; a revision responding to Seplat’s August feedback; the addition of a real backend; and a hardening and deployment stage. Each stage is in version control with a full history.',
        },
        {
          type: 'table',
          head: ['Area', 'Delivered'],
          rows: [
            ['Access and identity', 'Sign-in screen with four role-based accounts, replacing the earlier role-switcher. Passwords hashed with bcrypt. Sessions carried in a signed, HttpOnly cookie.'],
            ['Database', 'PostgreSQL with 17 tables covering programmes, impact chains, communities, stakeholders, tasks, approvals, targets, spend, reports and uploads. Schema changes are versioned migrations, applied automatically before the application starts.'],
            ['Application interface', '32 API endpoints, all authenticated. Written as hosting-agnostic handlers so the same logic runs self-hosted or serverless without a second implementation.'],
            ['Reach and impact', 'Reach recorded separately from impact for every programme, with the interaction channels, the conversion between them, and a written explanation of what separates the two for that specific programme.'],
            ['Programme custom fields', 'Recurring stakeholder questions answered on the programme’s own page, each with a source and a last-updated stamp, and carried into that programme’s export.'],
            ['Reporting', 'Report structure mirrors Seplat’s published 2025 Social Performance Report, and now its visual language too — the typeface, colours, chapter tabs and the way figures are set were taken from that document. Exports carry the compiled content, the selected programmes and the financial year, in PDF, PowerPoint, Excel and Word.'],
            ['PowerPoint export', 'A designed deck built from the same verified figures as the PDF, with native PowerPoint charts rather than pictures of charts — a recipient can edit a bar or correct a label without coming back to us, and the figures travel with the file.'],
            ['Programme reports', 'A report downloaded from a programme’s own page is now the same designed document as the portfolio report, in PDF and PowerPoint. It previously had an exporter of its own that produced a single page of plain text and rendered every naira figure as “NGN”.'],
            ['Media and web mentions', 'Coverage of Seplat found automatically in the press and on the web, de-duplicated across sources and held in a review queue until a person confirms what it is. Free sources only — GDELT, Nigerian news feeds and Google Alerts — with no subscription, no account and no API key.'],
            ['Bulk upload', 'Self-serve CSV upload with four downloadable templates, server-side validation and parsing, and an audit record of every upload.'],
            ['AI report generation', 'Claude generates a slide outline from the compiled report content. Runs server-side only; the API key never reaches the browser.'],
            ['Security', 'Every route requires a session except the health check and sign-in. Writes restricted by role from a single permission table. Writes to a route with no rule are refused by default.'],
            ['Account administration', 'Executives create accounts, assign roles, deactivate people who have left and reset passwords, all from the interface. Every user can change their own password. Accounts are deactivated rather than deleted so their contributions survive, and deactivation ends any live session immediately.'],
            ['Project setup and maintenance', 'Projects are created and kept up to date in the system, by Executives as well as Project Managers. Intake captures the timeline, budget, funding source, community and delivery partners; status, progress and utilisation are edited as the project runs.'],
            ['Settings', 'Organisation name, financial year, currency, target year and the data-status note are configurable rather than fixed in code, so an installation reflects its own organisation and states whether it holds live or sample data.'],
            ['No third-party calls in normal use', 'The interface typeface is served by the application rather than fetched from Google, so no user’s browser contacts an outside service on page load and the system works on a network with no outbound access.'],
            ['Deployment', 'Docker Compose stack — web, application and database — with the database unreachable from outside the application. Operator runbook and technical specification for Seplat IT.'],
          ],
        },
        {
          type: 'p',
          text:
            'Two defects were found and fixed during the hardening stage that would otherwise have surfaced during Seplat’s own installation. The session cookie was configured in a way that would have made sign-in fail silently on an internal HTTP deployment, presenting as an incorrect password. Separately, the API accepted read requests, and several write requests, with no authentication at all. Both are corrected and verified.',
        },
      ],
    },

    {
      heading: '3. What the system can do today',
      blocks: [
        {
          type: 'p',
          text:
            'Each role signs in to its own workspace. The interface shows only that role’s screens, and the API independently enforces the same boundary, so hiding a control is a convenience rather than the security measure.',
        },
        {
          type: 'table',
          head: ['Role', 'Can do'],
          rows: [
            ['Executive', 'View the portfolio dashboard with reach, impact, spend and compliance position; browse programmes and communities; analyse the portfolio-wide impact chain; set and track organisational targets; compile and export reports; upload bulk data; administer user accounts.'],
            ['Project Manager', 'Manage assigned programmes; submit new programmes for approval; review, approve or return field submissions with comments; assign tasks and invite team members; comment on reports and request corrections.'],
            ['Field Officer', 'See assigned tasks and update their status; log field activity with disaggregated beneficiary counts; view the evidence register.'],
            ['Community Relations', 'Maintain the stakeholder register; view communities and the programmes reaching them.'],
          ],
        },
        {
          type: 'p',
          text:
            'Across every role, the defining behaviour is data provenance. Each derived figure carries the metric, the calculation, the source and the caveat behind it. Where a number is a projection rather than a measurement, the system says so rather than presenting it as fact.',
        },
        {
          type: 'note',
          text:
            'The clearest example is the STEAM programme. 120,000 students applied for a scholarship and 48 received one. The system records 125,000 as reach and 5,048 as impact, and states that the 119,952 unsuccessful applicants were engaged but received nothing. Reported as a single number, that programme would have overstated its impact by a factor of roughly 2,500.',
        },
      ],
    },

    {
      heading: '4. What is verified, and what is still illustrative',
      blocks: [
        {
          type: 'p',
          text:
            'This distinction matters more than a feature list. The following has been tested end to end against a real database, in both the demonstration and the connected configuration.',
        },
        {
          type: 'bullets',
          items: [
            'Sign-in, session persistence across a page reload, and rejection of incorrect credentials.',
            'Role permissions: each role can perform its own actions and is refused the others.',
            'Unauthenticated requests are refused on every route.',
            'Records created, edited and deleted through the interface persist to the database and are attributed to the signed-in user.',
            'Exports contain the compiled report content, the reach and impact figures, and the programme custom fields.',
            'Bulk upload validates column structure against the published templates and rejects mismatches.',
            'The health check reports the database as unreachable when it is, and recovers on its own when it returns.',
            'Account administration: an account can be created, given a role, deactivated and reactivated. A deactivated account is refused at sign-in and its existing session stops working on the next request.',
            'The system refuses to deactivate your own account, to change your own role away from Executive, or to remove the last active Executive — the three changes that would lock everyone out.',
            'A signed-in session makes no requests to any external service.',
          ],
        },
        {
          type: 'p',
          text:
            'The following are present in the interface but are illustrative, and are labelled as such wherever they appear:',
        },
        {
          type: 'table',
          head: ['Figure', 'Status'],
          rows: [
            ['Social Return on Investment (SROI)', 'Methodology documented and shown in the interface, but the financial proxies have not been validated by Seplat’s M&E team. Not computed from live data.'],
            ['Compliance position', 'Panel structure and gap explanations are real; the underlying compliance percentages are placeholder values.'],
            ['Some reach figures', 'Programme reach for STEP, Eye Can See and the two entrepreneurship programmes is drawn from Seplat’s published report. Catchment and participation figures for the water, power, quiz and STEAM lab programmes are planning assumptions, each flagged in its own methodology note.'],
            ['Portfolio totals', 'Spend, project count and community count are drawn from the published 2025 report rather than a live financial system.'],
          ],
        },
      ],
    },

    {
      heading: '5. What is left to be done',
      blocks: [
        {
          type: 'p',
          text:
            'Grouped by whether the constraint is engineering effort or a decision and data dependency on Seplat.',
        },
        {
          type: 'table',
          head: ['Item', 'Constraint', 'Priority'],
          rows: [
            ['Production hosting', 'Accounts and credentials, then a short deployment', 'High'],
            ['Social media and hashtag tracking', 'Budget decision on a paid provider. Press and web monitoring is built and needs nothing', 'Medium'],
            ['Evidence file storage', 'Engineering. The register records descriptions, not documents', 'Medium'],
            ['Bulk upload writing to live records', 'Seplat decision on aggregation rules', 'Medium'],
            ['Live SROI and compliance calculation', 'Seplat M&E validation of financial proxies', 'Medium'],
            ['Single sign-on against Seplat identity', 'Seplat decision on whether it is required', 'Low, but cheaper to plan now'],
            ['Audit log', 'Only if assurance requires an immutable trail', 'Low'],
            ['Full worked example on real programme data', 'Seplat to supply the dataset and organisation chart', 'High'],
          ],
        },
      ],
    },

    {
      heading: '6. Options and recommendations',
      blocks: [
        {
          type: 'p',
          text:
            'For each substantive outstanding item, the realistic options and our recommendation.',
        },

        { type: 'h3', text: '6.1 Production hosting' },
        {
          type: 'table',
          head: ['Option', 'Assessment'],
          rows: [
            ['Vendor-hosted cloud only (Vercel and a managed database)', 'Fastest to stand up and convenient for demonstrations, but the vendor holds the data. This conflicts with the operating model Seplat has stated.'],
            ['Self-hosted on Seplat infrastructure only', 'Matches Seplat’s stated requirement exactly. Requires a Linux host and a short installation.'],
            ['Both, with different purposes', 'A cloud instance for demonstration containing only sample data, and a self-hosted instance holding real data.'],
          ],
        },
        {
          type: 'p',
          text:
            'Recommendation: the third option. Keep a cloud demonstration instance with sample data so the system can be shown without exposing anything real, and install the production instance on Seplat infrastructure. Both are already supported by the same codebase, so this costs nothing additional to maintain.',
        },

        { type: 'h3', text: '6.2 Database platform' },
        {
          type: 'p',
          text:
            'Supabase, Neon and a self-managed PostgreSQL instance are all viable, and all use the same database engine, so the choice is reversible. Recommendation: Supabase. It is standard PostgreSQL, so the schema and migrations apply unchanged, and unlike the alternatives it can also be self-hosted, which means the same platform serves both the demonstration and the production instance.',
        },

        { type: 'h3', text: '6.3 Media and social mention monitoring' },
        {
          type: 'p',
          text:
            'Seplat asked for automatic detection of mentions across press and social media, with a review step to filter false positives, source links, and hashtag tracking per programme. Free tools cover part of this; the rest requires a paid data source.',
        },
        {
          type: 'table',
          head: ['Option', 'Assessment'],
          rows: [
            ['Google Alerts alone', 'Free, but has no supported programming interface — only an undocumented feed — and covers no social media at all, so hashtag tracking is impossible. It also cannot retrieve past coverage. Not sufficient on its own.'],
            ['Free press sources (GDELT, direct Nigerian news feeds, Google Alerts)', 'Covers press and web well, including Nigerian outlets, at no data cost. No social media.'],
            ['Paid monitoring service (Brand24 or Determ)', 'Adds social media, hashtag tracking and sentiment. A few hundred US dollars per month.'],
            ['Enterprise service (Meltwater)', 'Adds Nigerian print and broadcast coverage. Five figures annually.'],
          ],
        },
        {
          type: 'p',
          text:
            'Phase one is now built and needs nothing from Seplat. It ingests from GDELT, from Nigerian news feeds and from a Google Alerts feed; de-duplicates the same story arriving from several sources; and holds everything in a review queue where a person accepts or rejects it, says whether it is social investment or corporate coverage, and tags it to a programme. Every item keeps its source link. It is labelled throughout as covering press and web only. There is no subscription, no account and no API key — the sources are public.',
        },
        {
          type: 'p',
          text:
            'Phase two adds a paid provider for social media and hashtag tracking, and is the only part still requiring a decision.',
        },
        {
          type: 'p',
          text:
            'This sequencing matters commercially as well as technically: it gives Seplat a working module to evaluate before committing to a subscription, and the monitoring provider connects through an adapter, so changing supplier later does not require rebuilding the module.',
        },
        {
          type: 'note',
          text:
            'Since mention data is only available from licensed partners for the major social platforms, no amount of engineering removes the need for a paid provider if social coverage is required. Subscription costs are recharged at cost and are not included in the platform fee.',
        },

        { type: 'h3', text: '6.4 PowerPoint export' },
        {
          type: 'p',
          text:
            'Delivered. The deck is a genuine PowerPoint file whose charts are native chart objects, not images — better than the graphics Seplat asked for, because a recipient can edit them. The figures behind each chart travel with the file in an embedded worksheet.',
        },
        {
          type: 'p',
          text:
            'One point worth stating plainly, because the August review tied this feature to it: the deck does not depend on the AI decision. It is built entirely from figures the system calculates, so it works whether or not Seplat IT approves any AI service. The AI question now affects only optional drafting of commentary.',
        },
        {
          type: 'p',
          text:
            'Every screen that offers a report now produces the same designed document — the reports screen and each programme’s own page alike — because all of them build the same specification and hand it to the same renderers. Word and Excel remain data formats rather than designed documents, and they stopped corrupting the naira sign at the same time.',
        },
        {
          type: 'p',
          text:
            'The remaining improvement is Seplat’s own deck template. Both exports are modelled on the published 2025 report, which is close, but a master template would let the deck adopt their layouts exactly. Fonts are the known gap: PowerPoint files cannot embed a typeface the way a PDF does, so the deck names Space Grotesk and Poppins and falls back to a standard sans-serif on a machine without them. Installing the two fonts on the machines that present from this deck removes the difference.',
        },
        {
          type: 'p',
          text:
            'Seplat stated that any AI used must be one their IT function recognises and approves. The system currently uses Anthropic’s Claude, called only from the server. This should be put to Seplat IT for a decision, and the feature can be disabled entirely without affecting anything else if they decline.',
        },

        { type: 'h3', text: '6.5 Evidence file storage' },
        {
          type: 'p',
          text:
            'The evidence register currently records descriptions rather than documents. Options are object storage run inside Seplat’s environment, cloud object storage, or a plain server volume. Recommendation: object storage running alongside the application, which keeps files on Seplat infrastructure and behaves identically in both configurations.',
        },

        { type: 'h3', text: '6.6 Single sign-on' },
        {
          type: 'p',
          text:
            'Account administration is now built, so the command-line script is only needed to create the very first account at installation. What remains is whether staff should sign in with their existing Seplat credentials instead of a separate password. Recommendation: decide this now rather than later. The authentication layer is isolated enough that adding single sign-on against Seplat’s identity provider is straightforward today and becomes progressively harder as more accounts exist.',
        },

        { type: 'h3', text: '6.7 Bulk upload and live calculation' },
        {
          type: 'p',
          text:
            'Financial spend uploads already write to live records. Beneficiary counts, activity logs and programme data are validated and held for review rather than written automatically, because doing so safely requires a rule Seplat must set: whether a new figure replaces a running total or adds to it. The same dependency applies to SROI, which cannot be computed until Seplat’s M&E function validates the financial proxies. Recommendation: leave both as they are, clearly labelled, until those decisions are made. Presenting a computed figure on an unvalidated basis would undermine the provenance principle the system is built on.',
        },
      ],
    },

    {
      heading: '7. Decisions and inputs needed from Seplat',
      blocks: [
        {
          type: 'p',
          text: 'Progress on several items is now blocked on Seplat rather than on development.',
        },
        {
          type: 'table',
          head: ['Needed', 'Unblocks'],
          rows: [
            ['Infrastructure for the production instance, or approval to host a demonstration instance in the cloud', 'Installation and evaluation on real infrastructure'],
            ['Complete data for one programme, plus the organisation chart', 'The full worked example requested in the August review'],
            ['Seplat’s own data templates or reporting scope', 'Aligning bulk upload to their actual records rather than our assumptions'],
            ['Aggregation rules for uploaded beneficiary and activity data', 'Bulk upload writing directly to live records'],
            ['M&E validation of SROI financial proxies', 'Live SROI calculation instead of an illustrative figure'],
            ['IT decision on the AI service used for drafting commentary', 'Optional AI-drafted narrative. No longer blocks any export — both PDF and PowerPoint are built from calculated figures alone'],
            ['Budget decision on paid media monitoring', 'Social media and hashtag tracking'],
            ['Whether single sign-on is required', 'Authentication scope'],
          ],
        },
        {
          type: 'p',
          text:
            'One outstanding clarification: the August review referred to a programme by a name that did not transcribe reliably. Confirming which programme was meant would let us build the worked example against the intended dataset.',
        },
      ],
    },

    {
      heading: '8. Recommended sequence',
      blocks: [
        {
          type: 'table',
          head: ['Stage', 'Work', 'Depends on'],
          rows: [
            ['1', 'Install on Seplat infrastructure, or stand up a cloud demonstration instance', 'Seplat infrastructure or hosting approval'],
            ['2', 'Worked example on one real programme, end to end', 'Seplat programme data and organisation chart'],
            ['3', 'Evidence file storage', 'Stage 1'],
            ['4', 'Bulk upload write-through and live SROI', 'Seplat aggregation rules and M&E validation'],
            ['5', 'Media monitoring, phase two (social and hashtags)', 'Budget approval for a monitoring subscription'],
          ],
        },
        {
          type: 'p',
          text:
            'Stage 3 requires nothing from Seplat and can run in parallel with the hosting conversation. Stage 1 is the highest-value single step, because it converts the system from something demonstrated into something in use, and unblocks three later stages.',
        },
      ],
    },

    {
      heading: '9. Commercial note',
      blocks: [
        {
          type: 'p',
          text:
            'The platform fee and annual maintenance are as set out in the proposal. Third-party subscription costs — media monitoring, and AI usage if approved — are recharged at cost and are not included in that fee. They are optional: the system functions fully without either, with the corresponding features disabled and labelled as such.',
        },
        {
          type: 'p',
          text:
            'Under the agreed operating model Seplat purchases usage rights and hosts the system on its own infrastructure. Once installed, Teasoo has no access to the data, the database or the running system. The application sends nothing back to Teasoo. Support is provided against the source code, which means diagnosing a production issue requires Seplat to share information deliberately.',
        },
      ],
    },
  ],
};
