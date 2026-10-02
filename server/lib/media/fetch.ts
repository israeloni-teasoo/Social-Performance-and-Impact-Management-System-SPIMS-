import { dedupe, parseFeed, parseGdelt } from './parse.js';
import { minimumGapMs } from './types.js';
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
  /** When this source was last contacted, so a rate-limited one can be left alone. */
  lastFetchedAt?: Date | null;
}

/** How long ago, in words a person reading the failure line would use. */
function agoLabel(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
}

/**
 * How long to wait before the one retry after a rate-limit response.
 *
 * Capped, and only once. A function that keeps retrying is both impolite to a free
 * service and liable to be killed by the platform's time limit mid-run, which writes no
 * record at all — the failure this module is otherwise built to avoid.
 */
const RETRY_CAP_MS = 6_000;

/**
 * How long to wait, or null when the service did not say.
 *
 * Only a stated wait is honoured. Guessing was worse than useless against GDELT, which
 * sends no Retry-After and keeps the gate shut for roughly a minute after a breach: a
 * two-second guess spends another request inside the block and extends it. A service
 * that does not say how long is one to leave alone until the next run.
 */
function retryAfterMs(response: Response): number | null {
  const seconds = Number(response.headers.get('retry-after'));
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds * 1000 <= RETRY_CAP_MS ? seconds * 1000 : null;
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

  // One polite retry, and only when the service named a wait we can afford. Retrying a
  // silent 429 spends a request inside a block we cannot see the end of.
  if (response.status === 429) {
    const wait = retryAfterMs(response);
    if (wait !== null) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      response = await attempt();
    }
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
/**
 * Checks a GDELT query for the one mistake its API punishes silently.
 *
 * GDELT requires OR'd terms to sit inside parentheses. A bare `A OR B` is not an error
 * it reports as one: it answers 200 with an HTML notice, so the failure arrives as
 * "non-JSON response" and reads like rate limiting. Our own recommended query had this
 * bug, which is how it was found.
 *
 * Returns the problem in words, or null when the query is usable.
 */
export function gdeltQueryProblem(query: string): string | null {
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < query.length; i++) {
    const c = query[i];
    if (c === '"') inQuotes = !inQuotes;
    if (inQuotes) continue;
    if (c === '(') depth += 1;
    else if (c === ')') depth -= 1;
    else if (depth === 0 && query.startsWith('OR', i) && /\s/.test(query[i - 1] ?? '') && /\s/.test(query[i + 2] ?? '')) {
      return `GDELT needs OR'd terms inside brackets. Write ( ${query.trim()} ) — or just search one word, since a search for Seplat already finds "Seplat Energy".`;
    }
  }

  if (depth !== 0) return 'The brackets in this query are not balanced.';
  if (inQuotes) return 'There is an unclosed quotation mark in this query.';
  return null;
}

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
    // GDELT answers 200 with an HTML notice when a query is malformed or it is
    // rate-limiting. Reported as a source error rather than as an empty result, so an
    // empty queue is never mistaken for "no coverage this week" — and the query is
    // checked here, because "non-JSON response" otherwise reads as rate limiting when it
    // is a query that will never work however long you wait.
    const problem = gdeltQueryProblem(target);
    throw new Error(
      problem
        ? `GDELT rejected this query. ${problem}`
        : 'GDELT returned a non-JSON response. Usually rate limiting — it typically clears within a few minutes.',
    );
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

  // Left alone rather than asked again. Pressing the button after a rate-limited run is
  // the natural thing to do and the one thing that keeps the block alive.
  const gap = minimumGapMs(source.kind);
  const since = source.lastFetchedAt ? Date.now() - new Date(source.lastFetchedAt).getTime() : Infinity;
  if (gap > 0 && since < gap) {
    return {
      ...base,
      ok: true,
      skipped: true,
      items: [],
      error: `Checked ${agoLabel(since)}. Left alone so it does not start rate-limiting; the next run will pick it up.`,
    };
  }

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
