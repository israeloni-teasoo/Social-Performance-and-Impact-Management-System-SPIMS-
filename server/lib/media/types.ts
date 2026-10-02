/**
 * The shape every monitoring source produces, whatever it actually returns.
 *
 * Phase one carries three free sources. Phase two adds a paid provider for social
 * media, which the client has not commissioned. Putting them all behind this one type
 * is what makes that a new adapter rather than a new module — and it is also why the
 * fields here are the intersection of what sources reliably give, not the union of
 * everything any one of them might.
 */
export interface RawMention {
  /** The article URL, as the source gave it. Normalised later. */
  url: string;
  title: string;
  /** The outlet. Falls back to the URL's host when a source does not name it. */
  publisher: string;
  snippet: string;
  language: string;
  country: string;
  /** Null when the source does not date its items, which several feeds do not. */
  publishedAt: Date | null;
}

/** What one source returned, or why it did not. */
export interface FetchOutcome {
  sourceId: string;
  sourceName: string;
  ok: boolean;
  items: RawMention[];
  /** Present when ok is false. Shown to the operator rather than swallowed. */
  error?: string;
  /**
   * Set when the source was deliberately left alone because it was contacted moments
   * ago. Distinct from a failure: nothing went wrong, and reporting it as a failed
   * source would train people to ignore the failure line.
   */
  skipped?: boolean;
}

/**
 * The shortest gap between two requests to the same source.
 *
 * Only GDELT needs one. It allows roughly one request every five seconds per address and
 * answers a breach with a block of about a minute, so a person pressing the button after
 * a failed run keeps the block alive. A newspaper serving a static feed file does not
 * care.
 */
export function minimumGapMs(kind: string): number {
  return kind === 'gdelt' ? 60_000 : 0;
}

export type SourceKind = 'gdelt' | 'rss' | 'googleAlerts';

export const SOURCE_KINDS: SourceKind[] = ['gdelt', 'rss', 'googleAlerts'];

export function isSourceKind(value: unknown): value is SourceKind {
  return typeof value === 'string' && (SOURCE_KINDS as string[]).includes(value);
}

/**
 * Where an alert can be delivered.
 *
 * `webhook` is the escape hatch: it posts a documented JSON shape, so an internal
 * endpoint can receive alerts without SPIMS needing to know anything about it.
 */
export type AlertChannelKind = 'teams' | 'slack' | 'webhook';

export const ALERT_CHANNEL_KINDS: AlertChannelKind[] = ['teams', 'slack', 'webhook'];

export function isAlertChannelKind(value: unknown): value is AlertChannelKind {
  return typeof value === 'string' && (ALERT_CHANNEL_KINDS as string[]).includes(value);
}
