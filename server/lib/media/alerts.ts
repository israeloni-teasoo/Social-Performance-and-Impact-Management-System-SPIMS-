/**
 * Alerting on collected mentions.
 *
 * Collection without notification only means the queue fills sooner. The point of a
 * watchlist is that somebody finds out about a spill or a protest when it is published
 * rather than when they next happen to open the screen.
 *
 * Two decisions shape everything here.
 *
 * **Alerting is narrow by default.** Rules are opt-in and named, and a mention that
 * matches none is collected silently. Alerting on every mention would train people to
 * ignore the alerts, which is worse than having none — the queue already exists for
 * everything else.
 *
 * **Delivery is at-most-once.** A mention is marked notified when the attempt is made,
 * not when delivery is confirmed. Retrying risks double-posting an alert that did
 * arrive (a timeout tells you nothing about what the far end did), and a webhook that
 * stays broken for a week would deliver a week of backlog in one burst the moment it is
 * fixed. The queue is the durable record; the alert is a prompt to go and look at it.
 * A failed delivery is recorded against the channel and shown on the screen instead.
 */

import type { AlertChannelKind } from './types';

const TIMEOUT_MS = Number(process.env.ALERT_WEBHOOK_TIMEOUT_MS) || 10_000;

/** How many mentions a single alert names before it summarises the rest. */
const MAX_LISTED = 8;

export interface AlertRuleRecord {
  id: string;
  name: string;
  terms: string;
}

export interface AlertChannelRecord {
  id: string;
  name: string;
  kind: string;
  url: string;
}

export interface FlaggableMention {
  id: string;
  title: string;
  snippet: string;
  publisher: string;
  url: string;
  publishedAt: Date | null;
}

/** A mention that matched at least one rule, with the rules it matched. */
export interface FlaggedMention extends FlaggableMention {
  rules: string[];
}

export interface DeliveryOutcome {
  channelId: string;
  channelName: string;
  ok: boolean;
  error?: string;
}

/* ------------------------------------------------------------------ matching */

/**
 * Splits a rule's term list. Commas and newlines both separate, because people type
 * both and neither reading is wrong.
 */
export function parseTerms(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Builds the matcher for one term.
 *
 * Anchored at the start of a word but deliberately **not** at the end, so "spill"
 * matches "spills" and "spillage", and "protest" matches "protesters". A watchlist
 * that misses the plural is a watchlist people stop trusting. The leading boundary is
 * what stops "oil" matching "boiling"; the cost of the open end is that it also
 * matches "oily", which is the right side to err on.
 *
 * Internal whitespace becomes flexible so a multi-word term survives a line break in
 * the source text, and regex metacharacters are escaped so a term like "C4" or "$" is
 * treated as text rather than as a pattern.
 */
function termPattern(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}`, 'iu');
}

/** The terms from this list that appear in the text. */
export function matchTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => termPattern(term).test(text));
}

/**
 * Applies every rule to every mention.
 *
 * The headline and the snippet are searched, not the URL: a slug is not prose, and
 * matching on it produces hits nobody can see a reason for when they read the article.
 */
export function flagMentions(mentions: FlaggableMention[], rules: AlertRuleRecord[]): FlaggedMention[] {
  const prepared = rules
    .map((rule) => ({ name: rule.name, terms: parseTerms(rule.terms) }))
    .filter((rule) => rule.terms.length > 0);
  if (prepared.length === 0) return [];

  const flagged: FlaggedMention[] = [];
  for (const mention of mentions) {
    const haystack = `${mention.title}\n${mention.snippet}`;
    const rulesHit = prepared.filter((rule) => matchTerms(haystack, rule.terms).length > 0).map((r) => r.name);
    if (rulesHit.length > 0) flagged.push({ ...mention, rules: rulesHit });
  }
  return flagged;
}

/* ------------------------------------------------------------------ payloads */

function summaryLine(flagged: FlaggedMention[], orgName: string): string {
  const count = flagged.length;
  return `${count} flagged mention${count === 1 ? '' : 's'} of ${orgName}`;
}

function listed(flagged: FlaggedMention[]): FlaggedMention[] {
  return flagged.slice(0, MAX_LISTED);
}

function overflowNote(flagged: FlaggedMention[]): string | null {
  const hidden = flagged.length - MAX_LISTED;
  return hidden > 0 ? `…and ${hidden} more in the review queue.` : null;
}

/**
 * Microsoft Teams, via a Workflows webhook.
 *
 * Not the old MessageCard shape: Office 365 connectors were switched off in May 2026,
 * so a Teams webhook today is a Power Automate workflow, and this is the Adaptive Card
 * envelope it expects.
 */
function teamsPayload(flagged: FlaggedMention[], orgName: string, queueUrl: string | null): unknown {
  const body: unknown[] = [
    { type: 'TextBlock', size: 'Medium', weight: 'Bolder', text: summaryLine(flagged, orgName), wrap: true },
    {
      type: 'TextBlock',
      size: 'Small',
      isSubtle: true,
      wrap: true,
      text: 'Collected by SPIMS. Nothing here has been reviewed yet.',
    },
  ];

  for (const m of listed(flagged)) {
    body.push({
      type: 'Container',
      separator: true,
      items: [
        { type: 'TextBlock', weight: 'Bolder', wrap: true, text: m.title },
        {
          type: 'TextBlock',
          size: 'Small',
          isSubtle: true,
          wrap: true,
          text: `${m.publisher} · flagged by ${m.rules.join(', ')}`,
        },
        { type: 'TextBlock', size: 'Small', wrap: true, text: `[Read the article](${m.url})` },
      ],
    });
  }

  const note = overflowNote(flagged);
  if (note) body.push({ type: 'TextBlock', size: 'Small', isSubtle: true, wrap: true, text: note });

  const content: Record<string, unknown> = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.4',
    body,
  };
  if (queueUrl) {
    content.actions = [{ type: 'Action.OpenUrl', title: 'Open the review queue', url: queueUrl }];
  }

  return {
    type: 'message',
    attachments: [{ contentType: 'application/vnd.microsoft.card.adaptive', contentUrl: null, content }],
  };
}

function slackPayload(flagged: FlaggedMention[], orgName: string, queueUrl: string | null): unknown {
  const blocks: unknown[] = [
    { type: 'section', text: { type: 'mrkdwn', text: `*${summaryLine(flagged, orgName)}*` } },
  ];

  for (const m of listed(flagged)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${m.url}|${m.title}>\n_${m.publisher} · flagged by ${m.rules.join(', ')}_`,
      },
    });
  }

  const note = overflowNote(flagged);
  if (note) blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: note }] });
  if (queueUrl) blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `<${queueUrl}|Open the review queue>` }] });

  // `text` is the notification preview and the fallback for clients that cannot render
  // blocks, so it carries the whole point of the message rather than a placeholder.
  return { text: summaryLine(flagged, orgName), blocks };
}

/**
 * Anything else: our own shape, documented and stable, so it can be pointed at an
 * internal endpoint without us having to know what that endpoint is.
 */
function genericPayload(flagged: FlaggedMention[], orgName: string, queueUrl: string | null): unknown {
  return {
    source: 'SPIMS',
    org: orgName,
    summary: summaryLine(flagged, orgName),
    queueUrl,
    flagged: flagged.map((m) => ({
      id: m.id,
      title: m.title,
      publisher: m.publisher,
      url: m.url,
      publishedAt: m.publishedAt ? m.publishedAt.toISOString() : null,
      rules: m.rules,
    })),
  };
}

export function buildPayload(
  kind: string,
  flagged: FlaggedMention[],
  orgName: string,
  queueUrl: string | null,
): unknown {
  switch (kind as AlertChannelKind) {
    case 'teams':
      return teamsPayload(flagged, orgName, queueUrl);
    case 'slack':
      return slackPayload(flagged, orgName, queueUrl);
    default:
      return genericPayload(flagged, orgName, queueUrl);
  }
}

/* ------------------------------------------------------------------ delivery */

/** Posts one payload. Converts a failure into a reported outcome rather than a throw. */
export async function deliver(channel: AlertChannelRecord, payload: unknown): Promise<DeliveryOutcome> {
  const base = { channelId: channel.id, channelName: channel.name };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(channel.url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      // Teams and Slack both explain a rejected payload in the body, and that text is
      // the difference between a fixable mistake and a channel that is simply silent.
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      return { ...base, ok: false, error: `HTTP ${response.status}${detail ? ` — ${detail}` : ''}` };
    }
    return { ...base, ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...base, ok: false, error: /abort/i.test(message) ? `No response within ${TIMEOUT_MS / 1000}s` : message };
  } finally {
    clearTimeout(timer);
  }
}

/** Delivers to every channel. One dead webhook must not cost the others their alert. */
export async function deliverAll(
  channels: AlertChannelRecord[],
  flagged: FlaggedMention[],
  orgName: string,
  queueUrl: string | null,
): Promise<DeliveryOutcome[]> {
  return Promise.all(channels.map((c) => deliver(c, buildPayload(c.kind, flagged, orgName, queueUrl))));
}

/**
 * The single example alert, used by the "Send a test" button.
 *
 * A test that posts a different shape from the real thing proves nothing, so this is
 * the real builder with one invented mention.
 */
export function testMention(): FlaggedMention {
  return {
    id: 'test',
    title: 'Test alert from SPIMS',
    snippet: '',
    publisher: 'SPIMS',
    url: 'https://example.org/spims-test-alert',
    publishedAt: new Date(),
    rules: ['Test'],
  };
}
