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

export const CHANNEL_KIND_LABELS: Record<string, string> = {
  teams: 'Microsoft Teams',
  slack: 'Slack',
  webhook: 'Other webhook',
};

/**
 * What to paste in, per channel type.
 *
 * Teams is the one people get wrong: the old Office 365 connector webhooks were
 * switched off in May 2026, so a URL from that flow will not work however valid it
 * looks. The address must come from a Workflows template.
 */
export const CHANNEL_KIND_HINTS: Record<string, string> = {
  teams: 'In Teams: channel → Workflows → "Post to a channel when a webhook request is received". Connector URLs from the old flow no longer work.',
  slack: 'In Slack: create an Incoming Webhook for the channel and paste its URL.',
  webhook: 'Any https endpoint. It receives a JSON body naming the flagged mentions and the rules they matched.',
};
