import { dedupe, parseFeed, parseGdelt } from './parse';
import type { FetchOutcome, RawMention, SourceKind } from './types';

/**
 * Fetching from the free sources.
 *
 * Every call here leaves Seplat's network, which is the one thing in SPIMS that does.
 * Three properties follow from that and are not negotiable:
 *
 *   - It runs on the server, never in a browser. No user's machine contacts these
 *     hosts, and the outbound traffic comes from one address their firewall can see.
 *   - It sends a search term and nothing else. No Seplat data is transmitted — not
 *     programme names, not figures, not who is signed in.
 *   - It is opt-in. With no sources configured, nothing is called at all.
 *
 * All three are stated in the technical specification, and this comment is here so
 * that anyone changing this file knows they are changing that undertaking.
 */

/** Long enough for a slow Nigerian outlet, short enough not to hang an ingestion run. */
const TIMEOUT_MS = 20_000;

/**
 * Identifies us to the outlets we read.
 *
 * Anonymous scraping is what gets an address blocked. A feed reader that says who it
 * is and reads a public feed is what these feeds are published for.
 */
const USER_AGENT = 'SPIMS-MediaMonitor/1.0 (Seplat Energy social performance monitoring)';

export interface SourceRecord {
  id: string;
  name: string;
  kind: string;
  target: string;
}

async function get(url: string, accept: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept, 'user-agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Builds the GDELT query URL.
 *
 * `timespan` rather than an explicit range: a run should pick up whatever has appeared
 * since the last one, and the de-duplication downstream makes an overlap harmless
 * while a gap would silently lose coverage.
 */
export function gdeltUrl(query: string, timespan = '7d', maxRecords = 75): string {
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    format: 'json',
    timespan,
    maxrecords: String(maxRecords),
    sort: 'datedesc',
  });
  return `https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`;
}

async function fetchGdelt(target: string): Promise<RawMention[]> {
  const body = await get(gdeltUrl(target), 'application/json');
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    // GDELT answers with an HTML notice when a query is malformed or it is
    // rate-limiting. Reported as a source error rather than as an empty result, so an
    // empty queue is never mistaken for "no coverage this week".
    throw new Error('GDELT returned a non-JSON response (usually a malformed query or rate limiting)');
  }
  return parseGdelt(payload);
}

async function fetchFeed(target: string, country: string): Promise<RawMention[]> {
  const body = await get(target, 'application/rss+xml, application/atom+xml, application/xml, text/xml');
  return parseFeed(body, country);
}

/** Fetches one source, converting a failure into a reported outcome rather than a throw. */
export async function fetchSource(source: SourceRecord): Promise<FetchOutcome> {
  const base = { sourceId: source.id, sourceName: source.name };
  try {
    let items: RawMention[];
    switch (source.kind as SourceKind) {
      case 'gdelt':
        items = await fetchGdelt(source.target);
        break;
      case 'rss':
        items = await fetchFeed(source.target, 'Nigeria');
        break;
      case 'googleAlerts':
        items = await fetchFeed(source.target, '');
        break;
      default:
        throw new Error(`Unknown source kind "${source.kind}"`);
    }
    return { ...base, ok: true, items: dedupe(items) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...base,
      ok: false,
      items: [],
      // An aborted request is a timeout; saying so is more use than "AbortError".
      error: /abort/i.test(message) ? `No response within ${TIMEOUT_MS / 1000}s` : message,
    };
  }
}

/**
 * Fetches every source, in parallel, never rejecting.
 *
 * One dead outlet must not cost a run its other sources — an ingestion that fails
 * wholesale because one feed is down is an ingestion nobody trusts.
 */
export async function fetchAll(sources: SourceRecord[]): Promise<FetchOutcome[]> {
  return Promise.all(sources.map(fetchSource));
}
