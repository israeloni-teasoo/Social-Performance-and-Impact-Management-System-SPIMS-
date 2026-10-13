import { isPercentRecorded } from './metrics';
import type { Project, ProjectImpact } from '../types';

/**
 * What a project is still missing before its impact can be reported honestly.
 *
 * The reason this exists: a completion file can be accepted, stored and displayed while
 * carrying almost nothing — no spend, no source for its figures, no before-and-after, no
 * named owner — and the page looked the same as one backed by a full record. Shallow was
 * indistinguishable from thorough, on the screen whose whole purpose is to show impact.
 *
 * The answer is not to write longer prose around thin facts. It is to say, on the page,
 * exactly which facts are missing and which column supplies each — so the gap is a task
 * somebody can close rather than an impression a reader is left with.
 *
 * Nothing here invents or infers. Each check reads a field and reports whether it is
 * there.
 */

export interface Gap {
  /** What is missing, in the words a reader would use. */
  what: string;
  /** Where it comes from, named precisely enough to act on. */
  from: string;
  /** Why the report is weaker without it. */
  why: string;
  weight: 'essential' | 'important';
}

export interface Completeness {
  /** 0–100. Essentials count double, because a report can survive a missing lesson. */
  score: number;
  gaps: Gap[];
  /** How many checks were made, so a perfect score is distinguishable from no checks. */
  checked: number;
}

const has = (value: string | undefined | null) => (value ?? '').trim() !== '';

export function assessProject(project: Project, impact: ProjectImpact | undefined): Completeness {
  const gaps: Gap[] = [];
  let checked = 0;
  let earned = 0;
  let possible = 0;

  const check = (ok: boolean, gap: Gap) => {
    checked += 1;
    const weight = gap.weight === 'essential' ? 2 : 1;
    possible += weight;
    if (ok) earned += weight;
    else gaps.push(gap);
  };

  check(Boolean(project.budgetNgn && project.budgetNgn > 0), {
    what: 'The budget as a figure',
    from: 'budget_naira, in the project master data file',
    why: 'Without it, utilisation cannot be calculated from recorded spend.',
    weight: 'important',
  });

  check(isPercentRecorded(project.progress), {
    what: 'Progress',
    from: 'date_completed in the completion file, which sets it to 100% — or Edit project',
    why: 'A project with no progress figure cannot be placed against the rest of the portfolio.',
    weight: 'important',
  });

  if (!impact) {
    gaps.unshift({
      what: 'The whole impact record',
      from: 'the project completion file',
      why: 'Nothing about what this project achieved has been recorded, so it appears in the portfolio and in no impact reporting.',
      weight: 'essential',
    });
    return { score: 0, gaps, checked: checked + 1 };
  }

  check(Boolean(impact.spentNgn && impact.spentNgn > 0), {
    what: 'What was actually spent',
    from: 'total_spent_naira, in the completion file',
    why: 'Cost per outcome and social return both divide by it, so neither can be calculated.',
    weight: 'essential',
  });

  check(Boolean(impact.reach && impact.reach.directBeneficiaries > 0), {
    what: 'How many people received the intervention',
    from: 'people_who_benefited, in the completion file',
    why: 'This is the impact figure. Without it there is nothing to report but activity.',
    weight: 'essential',
  });

  check(has(impact.outcome), {
    what: 'What changed as a result',
    from: 'what_changed_as_a_result, in the completion file',
    why: 'Delivering training is not the same as people finding work. Without this the project reports outputs only.',
    weight: 'essential',
  });

  check(has(impact.methodology.source), {
    what: 'Where the figures come from',
    from: 'where_the_figures_come_from, in the completion file',
    why: 'A figure with no source is not reportable externally, however confident the person who entered it.',
    weight: 'essential',
  });

  check(has(impact.baseline[0]?.value) && has(impact.baseline[1]?.value), {
    what: 'A before-and-after measure',
    from: 'measure_before and measure_after, in the completion file',
    why: 'Without a comparison, the change claimed cannot be checked by anyone outside the project.',
    weight: 'important',
  });

  check(has(impact.reach?.note), {
    what: 'Why reach and impact differ',
    from: 'why_the_two_numbers_differ, in the completion file',
    why: 'A reader seeing two figures will otherwise assume the larger one is the achievement.',
    weight: 'important',
  });

  check(has(impact.contactPerson), {
    what: 'The project manager',
    from: 'person_responsible, in the project master data file',
    why: 'A report nobody is named on is a report nobody can be asked about.',
    weight: 'important',
  });

  check(has(impact.lessons), {
    what: 'What the team learned',
    from: 'what_we_learned, in the completion file',
    why: 'It is usually the most useful thing a finished project produces, and it is lost if nobody writes it down.',
    weight: 'important',
  });

  check(impact.communitiesImpacted.length > 0, {
    what: 'The communities',
    from: 'communities, in the completion file',
    why: 'Without them the project cannot appear in any community view or host-community report.',
    weight: 'important',
  });

  check(has(impact.sroi), {
    what: 'A confirmed social return figure',
    from: 'Seplat M&E validating the financial proxy in data/valueProxies.ts',
    why: 'Until then the system publishes its own estimate, which is marked illustrative and should not be quoted externally.',
    weight: 'important',
  });

  return { score: possible === 0 ? 0 : Math.round((earned / possible) * 100), gaps, checked };
}
