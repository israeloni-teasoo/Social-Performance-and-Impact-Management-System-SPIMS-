import { dedupe, parseFeed, parseGdelt } from './parse.js';
import type { FetchOutcome, RawMention, SourceKind } from './types.js';

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

/**
 * Long enough for a slow Nigerian outlet, short enough not to hang an ingestion run.
 *
 * Configurable because a serverless platform caps how long a function may run, and a
 * run killed by that cap writes no record at all — the operator sees an empty queue
 * with nothing to say why, which is the failure this module is otherwise built to
 * avoid. Sources are fetched in parallel, so a run costs roughly the slowest source,
 * not the sum.
 */
const TIMEOUT_MS = Number(process.env.MEDIA_FETCH_TIMEOUT_MS) || 20_000;

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

/**
 * How long to wait before the one retry after a rate-limit response.
 *
 * Capped, and only once. A function that keeps retrying is both impolite to a free
 * service and liable to be killed by the platform's time limit mid-run, which writes no
 * record at all — the failure this module is otherwise built to avoid.
 */
const RETRY_CAP_MS = 6_000;

function retryAfterMs(response: Response): number {
  const header = response.headers.get('retry-after');
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, RETRY_CAP_MS);
  return 2_000;
}

/**
 * Turns an HTTP status into something worth reading on the screen.
 *
 * "HTTP 429" is accurate and useless: it sends an operator looking at their own
 * configuration for a problem that is the far end asking them to slow down, and that will
 * very likely have cleared by the next scheduled run.
 */
function describe(status: number, host: string): string {
  if (status === 429) {
    return `${host} is rate-limiting requests (HTTP 429). Nothing is wrong with the configuration — wait a few minutes, or leave it to the scheduled run.`;
  }
  if (status === 403) return `${host} refused the request (HTTP 403). It may be blocking automated readers.`;
  if (status === 404) return `${host} has no feed at that address (HTTP 404). Check the source's address.`;
  if (status >= 500) return `${host} is having trouble of its own (HTTP ${status}). Usually worth retrying later.`;
  return `HTTP ${status}`;
}

async function get(url: string, accept: string): Promise<string> {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'The source';
    }
  })();

  const attempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, {
        signal: controller.signal,
        headers: { accept, 'user-agent': USER_AGENT },
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timer);
    }
  };

  let response = await attempt();

  // One polite retry, honouring Retry-After when the service sends one. GDELT is free
  // and shared — on a serverless host the outbound address is shared with other tenants
  // too — so being asked to wait is ordinary rather than exceptional.
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs(response)));
    response = await attempt();
  }

  if (!response.ok) throw new Error(describe(response.status, host));
  return await response.text();
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
