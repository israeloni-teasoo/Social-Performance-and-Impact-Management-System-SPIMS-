import type { RawMention } from './types';

/**
 * Parsers for the free sources.
 *
 * Kept apart from the fetching so they can be tested against recorded fixtures rather
 * than against the live internet. That is not only convenient: these feeds are written
 * by dozens of different publishing systems, and the way this module fails in practice
 * is a feed that omits a field the parser assumed, on a Tuesday, months after anyone
 * looked at it. Every field below is therefore optional in the parser's eyes, and an
 * item missing the two that actually matter — a link and a title — is dropped rather
 * than stored as a blank row in a review queue.
 */

/* --------------------------------------------------------------- XML helpers */

/** Unescapes the entities a feed may carry, including CDATA and numeric references. */
export function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Ampersand last, so a doubly-escaped entity does not decode twice.
    .replace(/&amp;/g, '&');
}

/** Strips markup a feed put inside a description, and collapses the whitespace. */
export function stripTags(value: string): string {
  return decodeXml(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** First matching child element's text, or ''. */
function tag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decodeXml(match[1]!).trim() : '';
}

/** An attribute off the first matching element, or ''. */
function attr(xml: string, element: string, name: string): string {
  const match = xml.match(new RegExp(`<${element}\\b[^>]*\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return match ? decodeXml(match[1]!).trim() : '';
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** A date, or null. Never an Invalid Date, which would reach the database as one. */
export function parseDate(value: string): Date | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* ------------------------------------------------------------------- GDELT */

interface GdeltArticle {
  url?: unknown;
  title?: unknown;
  domain?: unknown;
  sourcecountry?: unknown;
  language?: unknown;
  seendate?: unknown;
}

/**
 * GDELT stamps its dates as `20260909T143000Z`, which `new Date()` does not parse.
 * Returned as null rather than as an invalid date if the shape is not what we expect.
 */
export function parseGdeltDate(value: string): Date | null {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return parseDate(value);
  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * GDELT's DOC 2.0 article list.
 *
 * The endpoint answers with HTML rather than JSON when a query is malformed or the
 * service is rate-limiting, so the caller's JSON.parse failing is a normal outcome and
 * is reported as a source error, not a crash.
 */
export function parseGdelt(payload: unknown): RawMention[] {
  const articles = (payload as { articles?: unknown })?.articles;
  if (!Array.isArray(articles)) return [];

  const out: RawMention[] = [];
  for (const entry of articles as GdeltArticle[]) {
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    if (!url || !title) continue;

    out.push({
      url,
      title,
      publisher: (typeof entry.domain === 'string' && entry.domain.trim()) || hostOf(url),
      snippet: '',
      language: typeof entry.language === 'string' ? entry.language : '',
      country: typeof entry.sourcecountry === 'string' ? entry.sourcecountry : '',
      publishedAt: typeof entry.seendate === 'string' ? parseGdeltDate(entry.seendate) : null,
    });
  }
  return out;
}

/* ------------------------------------------------------------- RSS and Atom */

/**
 * RSS 2.0 and Atom, including the feed Google Alerts serves.
 *
 * Google Alerts is Atom, and its entries carry the target URL inside a Google redirect
 * (`google.com/url?...&url=<real>`), so the real link is recovered — otherwise every
 * mention in the queue would point at Google rather than at the article, and
 * de-duplication against the same story from another source would never match.
 */
export function parseFeed(xml: string, sourceCountry = ''): RawMention[] {
  const blocks = [
    ...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);

  const out: RawMention[] = [];
  for (const block of blocks) {
    // RSS puts the link in an element; Atom puts it in an href attribute.
    const rawLink = tag(block, 'link') || attr(block, 'link', 'href');
    const url = unwrapRedirect(rawLink);
    const title = stripTags(tag(block, 'title'));
    if (!url || !title) continue;

    const description = tag(block, 'description') || tag(block, 'summary') || tag(block, 'content');
    const published =
      tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date');

    out.push({
      url,
      title,
      publisher: stripTags(tag(block, 'source')) || hostOf(url),
      snippet: stripTags(description).slice(0, 400),
      language: '',
      country: sourceCountry,
      publishedAt: parseDate(published),
    });
  }
  return out;
}

/** Recovers the real article URL from a Google Alerts redirect wrapper. */
export function unwrapRedirect(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (/(^|\.)google\.[a-z.]+$/i.test(parsed.hostname)) {
      const target = parsed.searchParams.get('url') ?? parsed.searchParams.get('q');
      if (target && /^https?:\/\//i.test(target)) return target;
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

/* ------------------------------------------------------------ normalisation */

/**
 * The key two mentions of the same story share.
 *
 * The same article reaches us from GDELT, from the outlet's own feed and from a Google
 * Alert, each with its own tracking parameters. Without this the review queue shows one
 * story three times and a reviewer stops trusting it. Query strings are dropped
 * entirely rather than filtered for known trackers: publishers invent new ones
 * constantly, and an article URL whose identity depends on its query string is rare
 * enough to be worth losing.
 */
export function normaliseUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    parsed.search = '';
    parsed.hash = '';
    if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/** De-duplicates a run's items by normalised URL, keeping the first seen. */
export function dedupe(items: RawMention[]): RawMention[] {
  const seen = new Set<string>();
  const out: RawMention[] = [];
  for (const item of items) {
    const key = normaliseUrl(item.url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...item, url: key });
  }
  return out;
}
