/**
 * The fixed vocabularies the system asks people to choose from.
 *
 * Here rather than inside the screens that use them because an upload template has to
 * tell someone which values are accepted, and a list copied into a template drifts from
 * the list on the form. When they drift, a file that looks correct is rejected for a
 * reason nobody can see.
 *
 * Wording rule for anything in this file: no acronyms, and no term that means something
 * different outside the development sector. These labels are read by people entering
 * data in a spreadsheet, not only by people who already know the jargon.
 */

/**
 * What kind of thing happened, on the Log Activity form and in the activity upload.
 *
 * "Monitoring visit" was "M&E monitoring visit". Dropping the acronym loses nothing —
 * it also said "monitoring" twice — and M&E is exactly the kind of shorthand that
 * reads as obvious to the team who chose it and as noise to everyone else.
 */
export const ACTIVITY_TYPES = [
  'Training / workshop',
  'Community meeting',
  'Site visit',
  'Public consultation',
  'Awareness campaign',
  'Monitoring visit',
  'Distribution / handover',
] as const;

/** The programme areas a project and its spend are grouped under. */
export const PILLARS = ['Education', 'Health', 'Infrastructure', 'Economic Emp.'] as const;

/** Written into a template so the column can name the values it accepts. */
export function listForTemplate(values: readonly string[]): string {
  return values.join(', ');
}
