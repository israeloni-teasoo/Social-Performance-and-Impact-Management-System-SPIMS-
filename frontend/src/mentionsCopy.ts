/**
 * Wording shared by the mentions screen and the demo seed.
 *
 * The coverage note is the honest statement of what this module does and does not
 * see. It is duplicated on the server (`server/handlers/mentions.ts`) so a live
 * response carries it too — a queue labelled "mentions" that silently omits every
 * social platform would misrepresent Seplat's coverage, and the caveat has to travel
 * with the data rather than live only in documentation.
 */
export const COVERAGE_NOTE =
  'Press and web sources only. Social media and hashtag tracking need a paid data provider and are not included.';

export const CATEGORY_LABELS: Record<string, string> = {
  socialInvestment: 'Social investment',
  corporate: 'Corporate / financial',
  unrelated: 'Not about Seplat',
};

export const SOURCE_KIND_LABELS: Record<string, string> = {
  gdelt: 'GDELT',
  rss: 'News feed',
  googleAlerts: 'Google Alerts',
};
