import { ACTIVITY_TYPES, PILLARS, listForTemplate } from './vocabulary';

/**
 * The bulk upload templates.
 *
 * Every column is defined here alongside what to put in it, because the column heading
 * and its explanation drifting apart is how a template stops being usable. The
 * explanation is not documentation — it is written into the downloaded file, so it is in
 * front of the person filling it in rather than in a document they were sent once.
 *
 * Three wording rules, applied to every heading:
 *
 *   1. **No acronyms.** `pwd` meant "persons with disability" and reads as "password".
 *      `lga` is spelled out. `endline` was monitoring-and-evaluation shorthand.
 *   2. **The same idea has the same name everywhere.** People reached was `total_reached`
 *      in one template and `reach_total` in another; a project was `project_code` in
 *      three templates and `project_id` in a fourth, with a different example format, so
 *      rows uploaded from the two would not have linked to the same project.
 *   3. **Headings say what to type, not what the field is called internally.** Output,
 *      outcome and impact are the three words this sector confuses most often, so they
 *      are asked as questions: what was delivered, what changed, who received it.
 */

export type BulkUploadDataType =
  | 'Beneficiary counts'
  | 'Activity logs'
  | 'Financial spend'
  | 'Project master data'
  | 'Project completion';

export const BULK_UPLOAD_DATA_TYPES: BulkUploadDataType[] = [
  'Beneficiary counts',
  'Activity logs',
  'Financial spend',
  'Project master data',
  'Project completion',
];

export interface TemplateField {
  /** The column heading, exactly as it appears in the file. */
  name: string;
  /** What to put in the column, in plain words. Travels with the file. */
  meaning: string;
  /** A filled-in example for this column. */
  example: string;
}

export interface UploadTemplate {
  filename: string;
  fields: TemplateField[];
  note: string;
}

/** Marks the explanation lines in a downloaded template. The upload ignores them. */
export const TEMPLATE_COMMENT = '#';

export function columnsOf(template: UploadTemplate): string[] {
  return template.fields.map((f) => f.name);
}

export function exampleOf(template: UploadTemplate): string[] {
  return template.fields.map((f) => f.example);
}

/* ------------------------------------------------------- shared column wording */

const PROJECT_CODE: TemplateField = {
  name: 'project_code',
  meaning: 'The short code for the programme, exactly as SPIMS shows it — for example STEP. Not a contract or purchase order number.',
  example: 'STEP',
};

/**
 * The four breakdown columns.
 *
 * Named `of_whom_…` rather than plain `female`, `male`, `pwd` so the relationship to the
 * total is visible in the heading. It used to be a sentence in the notes that the
 * breakdown adds up to the total; a heading that says it cannot be skipped.
 */
function breakdown(total: string): TemplateField[] {
  return [
    {
      name: 'of_whom_female',
      meaning: `How many of the ${total} were women or girls.`,
      example: '24',
    },
    {
      name: 'of_whom_male',
      meaning: `How many of the ${total} were men or boys.`,
      example: '18',
    },
    {
      name: 'of_whom_aged_under_35',
      meaning: `How many of the ${total} were younger than 35. Overlaps with the columns above — the same person is counted in both.`,
      example: '31',
    },
    {
      name: 'of_whom_living_with_disability',
      meaning: `How many of the ${total} were living with a disability. Also overlaps with the columns above.`,
      example: '1',
    },
  ];
}

const BREAKDOWN_NOTE =
  'of_whom_female and of_whom_male should add up to the total. of_whom_aged_under_35 and of_whom_living_with_disability are counted again from the same people, so they do not add up — leave a column blank rather than guessing.';

/* ---------------------------------------------------------------- the templates */

export const UPLOAD_TEMPLATES: Record<BulkUploadDataType, UploadTemplate> = {
  /**
   * What a finished project must supply for the system to produce its report.
   *
   * One row per completed project. Every column maps to something the report prints:
   * people reached and people who benefited are separate on purpose, and the headline
   * figures have a paired source column, because a number without a source is not
   * reportable.
   */
  'Project completion': {
    filename: 'spims-template-project-completion.csv',
    fields: [
      PROJECT_CODE,
      {
        name: 'date_completed',
        meaning: 'The day the project finished, written as year-month-day.',
        example: '2027-06-30',
      },
      {
        name: 'total_spent_naira',
        meaning: 'Everything spent on the project, in naira. Digits only — no ₦ sign, no commas, no "million".',
        example: '180000000',
      },
      {
        name: 'what_was_delivered',
        meaning: 'The thing the project produced, counted. One line. For example "120 youth certified in solar installation".',
        example: '120 youth certified in solar installation',
      },
      {
        name: 'what_changed_as_a_result',
        meaning: 'What is different now that it has been delivered. Not the same as the line above: delivering training is not the same as people finding work.',
        example: 'Certified youth entering paid solar installation work across Delta host communities',
      },
      {
        name: 'people_reached',
        meaning: 'Everyone the project interacted with in any way — applicants, attendees, people screened, residents of the area served. Usually much larger than the number who received anything.',
        example: '1640',
      },
      {
        name: 'who_was_reached',
        meaning: 'Who those people were, in a few words, so the number can be understood.',
        example: 'young people who applied for a training place',
      },
      {
        name: 'how_they_were_reached',
        meaning: 'The way the project came into contact with them. Separate several with a semicolon.',
        example: 'Applications received: 1640',
      },
      {
        name: 'people_who_benefited',
        meaning: 'Only those who actually received what the project provided — attended the training, had the surgery, got the connection. Never the same number as people_reached.',
        example: '120',
      },
      {
        name: 'what_they_received',
        meaning: 'What those people got.',
        example: '120 young people trained and certified',
      },
      {
        name: 'why_the_two_numbers_differ',
        meaning: 'Explain the gap between people_reached and people_who_benefited in one sentence. This is printed in the report, so a reader is never left to assume the larger number is the achievement.',
        example: '1,520 applicants were not selected — they were reached, not impacted',
      },
      ...breakdown('people who benefited'),
      {
        name: 'communities',
        meaning: 'Where the work happened, as community and state. Separate several with a semicolon.',
        example: 'Sapele, Delta; Amukpe, Delta',
      },
      {
        name: 'measure_before',
        meaning: 'The figure you are comparing against, as it stood before the project. Include the unit.',
        example: '12% employed in the sector at intake',
      },
      {
        name: 'measure_after',
        meaning: 'The same figure after the project, measured the same way.',
        example: '61% employed six months after certification',
      },
      {
        name: 'what_was_measured',
        meaning: 'What the two figures above actually count, and when each was taken. Without this the comparison cannot be checked.',
        example: 'Share of cohort in paid solar work, measured at intake and six months post-certification',
      },
      {
        name: 'where_the_figures_come_from',
        meaning: 'The survey, register or report the numbers were taken from, with a date and how many people it covered. Required.',
        example: 'Cohort tracking survey, June 2027, n=112 of 120',
      },
      {
        name: 'what_we_learned',
        meaning: 'What you would tell the next team running this. Worth writing even when it is uncomfortable.',
        example: 'Tool kits on graduation mattered more than course length — cohorts without kits had far lower conversion',
      },
    ],
    note:
      `One row per completed project. people_reached counts everyone the project interacted with; people_who_benefited counts only those who received what it provided — never put the same number in both. Separate multiple entries in one cell with a semicolon. ${BREAKDOWN_NOTE} where_the_figures_come_from is required: any figure without it is reported as unverified.`,
  },

  'Beneficiary counts': {
    filename: 'spims-template-beneficiary-counts.csv',
    fields: [
      PROJECT_CODE,
      {
        name: 'date',
        meaning: 'The day this happened, written as year-month-day.',
        example: '2026-07-06',
      },
      {
        name: 'community',
        meaning: 'Where it happened, as community and state.',
        example: 'Sapele, Delta',
      },
      {
        name: 'people_reached',
        meaning: 'How many people took part on this date, in this community.',
        example: '42',
      },
      ...breakdown('people reached'),
    ],
    note: `One row for each date and community — not one row per project. ${BREAKDOWN_NOTE}`,
  },

  'Activity logs': {
    filename: 'spims-template-activity-logs.csv',
    fields: [
      PROJECT_CODE,
      {
        name: 'date',
        meaning: 'The day the activity happened, written as year-month-day.',
        example: '2026-07-06',
      },
      {
        name: 'activity_type',
        meaning: `What kind of activity it was. Use one of exactly these: ${listForTemplate(ACTIVITY_TYPES)}.`,
        example: 'Training / workshop',
      },
      {
        name: 'location',
        meaning: 'Where it happened. A place name is enough; add coordinates after a dash if you have them.',
        example: 'Sapele — 5.8904, 5.6767',
      },
      {
        name: 'people_reached',
        meaning: 'How many people took part in this activity.',
        example: '42',
      },
      ...breakdown('people reached'),
      {
        name: 'notes',
        meaning: 'Anything a reader would need to understand the row. Optional.',
        example: 'Full-day literacy methods training delivered.',
      },
    ],
    note: `The same fields as the Log Activity form, so either route produces the same record. ${BREAKDOWN_NOTE}`,
  },

  'Financial spend': {
    filename: 'spims-template-financial-spend.csv',
    fields: [
      PROJECT_CODE,
      {
        name: 'month',
        meaning: 'The month the money was spent, written as year-month — for example 2026-07 for July 2026. No day.',
        example: '2026-07',
      },
      {
        name: 'programme_pillar',
        meaning: `Which programme area this spend belongs to. Use one of exactly these: ${listForTemplate(PILLARS)}.`,
        example: 'Infrastructure',
      },
      {
        name: 'amount_naira',
        meaning: 'How much was spent, in naira. Digits only — no ₦ sign, no commas, no "million".',
        example: '43000000',
      },
      {
        name: 'funding_source',
        meaning: 'Where the money came from.',
        example: 'PIA HCDT — 3% OpEx',
      },
      {
        name: 'notes',
        meaning: 'What it was spent on. Optional but useful when the figure is queried later.',
        example: 'Q3 borehole works',
      },
    ],
    note:
      'This is the one template that writes straight into live spend records, so a row with an unrecognised project_code or a non-numeric amount_naira is skipped and reported rather than guessed at.',
  },

  'Project master data': {
    filename: 'spims-template-project-master-data.csv',
    fields: [
      {
        ...PROJECT_CODE,
        meaning:
          'The short code this programme will be known by throughout SPIMS — for example SOLAR. Keep it short and use the same code in every other upload, because this is what links rows to the project.',
        example: 'SOLAR',
      },
      {
        name: 'project_name',
        meaning: 'The full name, as it should appear in reports.',
        example: 'Solar Skills Academy — Cohort 3',
      },
      {
        name: 'programme_pillar',
        meaning: `Which programme area it belongs to. Use one of exactly these: ${listForTemplate(PILLARS)}.`,
        example: 'Economic Emp.',
      },
      {
        name: 'person_responsible',
        meaning: 'Who owns delivery of this project.',
        example: 'Tunde Bello',
      },
      {
        name: 'community',
        meaning: 'The main community it serves.',
        example: 'Sapele',
      },
      {
        name: 'local_government_area',
        meaning: 'The local government area the community sits in.',
        example: 'Sapele LGA',
      },
      {
        name: 'state',
        meaning: 'The Nigerian state the community is in. Write the name on its own, without the word "State" — Delta, not Delta State.',
        example: 'Delta',
      },
      {
        name: 'gps_coordinates',
        meaning: 'Latitude and longitude, separated by a comma. Optional.',
        example: '5.8904, 5.6767',
      },
      {
        name: 'start_date',
        meaning: 'When work starts, written as year-month-day.',
        example: '2026-09-01',
      },
      {
        name: 'end_date',
        meaning: 'When work is due to finish, written as year-month-day.',
        example: '2027-06-30',
      },
      {
        name: 'budget_naira',
        meaning: 'The approved budget, in naira. Digits only — no ₦ sign, no commas, no "million".',
        example: '180000000',
      },
      {
        name: 'funding_source',
        meaning: 'Where the money comes from.',
        example: 'PIA HCDT — 3% OpEx',
      },
      {
        name: 'contractor',
        meaning: 'The company carrying out the work, if there is one.',
        example: 'Bright Energy Ltd',
      },
      {
        name: 'implementing_partner',
        meaning: 'The organisation delivering the programme with you — a foundation, non-profit or company. Leave blank if delivery is in-house.',
        example: 'C4C Foundation',
      },
    ],
    note:
      'The same fields as the New Project form. The project_code you set here is what every other upload must use to refer to this project.',
  },
};

/**
 * The lines written under the example row of a downloaded template.
 *
 * They start with `#` and the upload skips them, so the person filling the file in can
 * read what each column wants without having to keep another document open, and can
 * leave them in place or delete them as they prefer.
 */
export function guidanceRows(template: UploadTemplate): string[][] {
  return [
    [`${TEMPLATE_COMMENT} How to fill this in. These lines starting with ${TEMPLATE_COMMENT} are ignored when you upload, so you can leave them here.`],
    [`${TEMPLATE_COMMENT} Replace the example row above with your own data.`],
    [TEMPLATE_COMMENT],
    ...template.fields.map((f) => [`${TEMPLATE_COMMENT} ${f.name} — ${f.meaning}`]),
    [TEMPLATE_COMMENT],
    [`${TEMPLATE_COMMENT} ${template.note}`],
  ];
}
