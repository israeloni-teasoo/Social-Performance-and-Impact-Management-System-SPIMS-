/**
 * Parser checks for the free monitoring sources.
 *
 *   npx tsx server/lib/media/parse.test.ts
 *
 * Deliberately dependency-free: the project has no test runner, and adding one to
 * carry a single file would be a larger decision than this change deserves. Exits
 * non-zero on failure, so it can go into a pipeline as it stands.
 */

import assert from 'node:assert/strict';
import { GDELT_SAMPLE, GOOGLE_ALERTS_SAMPLE, RSS_SAMPLE } from './fixtures.js';
import { dedupe, normaliseUrl, parseFeed, parseGdelt, parseGdeltDate, unwrapRedirect } from './parse.js';
import { gdeltQueryProblem } from './fetch.js';

let failures = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${(error as Error).message.split('\n')[0]}`);
  }
}

console.log('\nGDELT');

test('reads articles and their outlets', () => {
  const items = parseGdelt(JSON.parse(GDELT_SAMPLE));
  assert.equal(items.length, 2, 'two complete articles');
  assert.equal(items[0]!.publisher, 'punchng.com');
  assert.equal(items[0]!.country, 'Nigeria');
});

test('drops an article missing a title or a link rather than storing a blank row', () => {
  const items = parseGdelt(JSON.parse(GDELT_SAMPLE));
  assert.ok(!items.some((i) => i.title === ''));
  assert.ok(!items.some((i) => i.url === ''));
});

test('parses GDELT’s own date stamp, which new Date() cannot', () => {
  const date = parseGdeltDate('20260904T081500Z');
  assert.ok(date, 'parsed');
  assert.equal(date!.toISOString(), '2026-09-04T08:15:00.000Z');
  // A shape we do not recognise must give null, never an Invalid Date, which would
  // otherwise reach the database.
  assert.equal(parseGdeltDate('not a date'), null);
});

test('survives a non-article payload instead of throwing', () => {
  // GDELT answers with HTML when rate-limiting, so this is a normal Tuesday.
  assert.deepEqual(parseGdelt({ error: 'rate limited' }), []);
  assert.deepEqual(parseGdelt(null), []);
  assert.deepEqual(parseGdelt('<html>go away</html>'), []);
});

console.log('\nRSS');

test('reads items, unwraps CDATA and strips HTML from the summary', () => {
  const items = parseFeed(RSS_SAMPLE, 'Nigeria');
  assert.equal(items.length, 3);
  assert.equal(items[0]!.title, 'Seplat Energy commissions classroom block in Edo');
  assert.equal(items[0]!.snippet, 'The company said the block will serve 400 pupils.');
  assert.equal(items[0]!.country, 'Nigeria');
});

test('decodes entities in a plain description', () => {
  const items = parseFeed(RSS_SAMPLE);
  assert.equal(items[1]!.snippet, 'Teachers across Edo & Delta completed the programme.');
});

test('accepts an item with no date rather than dropping it', () => {
  const items = parseFeed(RSS_SAMPLE);
  assert.equal(items[2]!.title, 'Undated item');
  assert.equal(items[2]!.publishedAt, null);
});

test('dates the items that are dated', () => {
  const items = parseFeed(RSS_SAMPLE);
  assert.equal(items[0]!.publishedAt?.toISOString(), '2026-09-04T07:15:00.000Z');
});

console.log('\nGoogle Alerts');

test('reads Atom entries', () => {
  const items = parseFeed(GOOGLE_ALERTS_SAMPLE);
  assert.equal(items.length, 2);
});

test('recovers the article URL from the Google redirect', () => {
  const items = parseFeed(GOOGLE_ALERTS_SAMPLE);
  // Without this every mention would point at google.com and would never match the
  // same story arriving from another source.
  assert.equal(
    items[0]!.url,
    'https://punchng.com/seplat-energy-commissions-classroom-block-in-edo/',
  );
  assert.ok(!items.some((i) => i.url.includes('google.com')));
});

test('strips the bold tags Google wraps the search term in', () => {
  const items = parseFeed(GOOGLE_ALERTS_SAMPLE);
  assert.equal(items[0]!.title, 'Seplat Energy commissions classroom block in Edo');
});

test('leaves a URL that is not a redirect alone', () => {
  assert.equal(unwrapRedirect('https://punchng.com/story/'), 'https://punchng.com/story/');
  assert.equal(unwrapRedirect(''), '');
});

console.log('\nDe-duplication');

test('normalises away tracking parameters, www and a trailing slash', () => {
  const a = normaliseUrl('https://www.punchng.com/story/?utm_source=rss&utm_medium=feed');
  const b = normaliseUrl('http://punchng.com/story');
  assert.equal(a, b, 'the same story from two sources must give one key');
});

test('collapses the same story arriving from three sources', () => {
  const items = dedupe([
    ...parseGdelt(JSON.parse(GDELT_SAMPLE)),
    ...parseFeed(RSS_SAMPLE, 'Nigeria'),
    ...parseFeed(GOOGLE_ALERTS_SAMPLE),
  ]);
  const classroom = items.filter((i) => i.url.includes('classroom-block-in-edo'));
  assert.equal(classroom.length, 1, 'the classroom story appears once, not three times');
});

test('keeps genuinely different stories', () => {
  const items = dedupe(parseFeed(RSS_SAMPLE));
  assert.equal(items.length, 3);
});

test('leaves an unparseable URL as itself rather than throwing', () => {
  assert.equal(normaliseUrl('not a url'), 'not a url');
});

console.log('\nGDELT query syntax');

test('refuses a bare OR, which GDELT answers with an HTML notice rather than an error', () => {
  // The recommended query shipped with exactly this fault, so every run reported a
  // "non-JSON response" that read like rate limiting and would never have cleared.
  assert.ok(gdeltQueryProblem('"Seplat" OR "Seplat Energy"'));
  assert.ok(gdeltQueryProblem('Seplat OR SEPLAT'));
});

test('accepts the bracketed form GDELT actually wants', () => {
  assert.equal(gdeltQueryProblem('("Seplat" OR "Seplat Energy")'), null);
  assert.equal(gdeltQueryProblem('(Seplat OR SEPLAT) (Nigeria OR Delta)'), null);
});

test('accepts a plain search, which needs no brackets at all', () => {
  assert.equal(gdeltQueryProblem('Seplat'), null);
  assert.equal(gdeltQueryProblem('"Seplat Energy"'), null);
});

test('does not mistake OR inside a word or inside quotes for the operator', () => {
  assert.equal(gdeltQueryProblem('Seplat ORCHARD'), null);
  assert.equal(gdeltQueryProblem('"A OR B"'), null);
});

test('catches an unbalanced bracket or an unclosed quote', () => {
  assert.ok(gdeltQueryProblem('(Seplat'));
  assert.ok(gdeltQueryProblem('"Seplat'));
});

console.log(failures === 0 ? '\nAll parser checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
