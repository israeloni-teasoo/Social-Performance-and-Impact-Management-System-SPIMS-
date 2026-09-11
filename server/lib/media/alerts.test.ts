/**
 * Checks for the alert matcher and the payload builders.
 *
 *   npx tsx server/lib/media/alerts.test.ts
 *
 * Dependency-free, in the same style as parse.test.ts. Nothing here touches the
 * network: delivery is one small function around fetch, while the parts worth testing
 * are which mentions match and what the outgoing JSON looks like. A payload that a
 * webhook silently rejects is the failure mode these checks exist for — Teams and
 * Slack both answer a malformed body with a 400 that nobody is watching for.
 */

import assert from 'node:assert/strict';
import { buildPayload, flagMentions, matchTerms, parseTerms, testMention } from './alerts';
import type { FlaggableMention } from './alerts';

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

function mention(title: string, snippet = ''): FlaggableMention {
  return { id: 'm1', title, snippet, publisher: 'The Punch', url: 'https://example.org/a', publishedAt: null };
}

console.log('\nTerm lists');

test('splits on commas and on newlines, because people type both', () => {
  assert.deepEqual(parseTerms('spill, protest\nshutdown'), ['spill', 'protest', 'shutdown']);
});

test('ignores empty entries and stray whitespace', () => {
  assert.deepEqual(parseTerms(' spill ,, \n  protest \n'), ['spill', 'protest']);
});

console.log('\nMatching');

test('matches regardless of case', () => {
  assert.deepEqual(matchTerms('Oil SPILL reported', ['spill']), ['spill']);
});

test('matches a plural or a suffix, which is the whole point of a watchlist', () => {
  assert.deepEqual(matchTerms('Protesters gathered', ['protest']), ['protest']);
  assert.deepEqual(matchTerms('Two spills recorded', ['spill']), ['spill']);
});

test('does not match a term buried inside another word', () => {
  assert.deepEqual(matchTerms('The water was boiling', ['oil']), []);
  assert.deepEqual(matchTerms('A despill process', ['spill']), []);
});

test('matches a multi-word term across a line break', () => {
  assert.deepEqual(matchTerms('community\nunrest in Edo', ['community unrest']), ['community unrest']);
});

test('treats punctuation in a term as text, not as a pattern', () => {
  assert.deepEqual(matchTerms('Report on C4.5 rollout', ['C4.5']), ['C4.5']);
  // Were the dot left as a wildcard, "C4x5" would match too.
  assert.deepEqual(matchTerms('Report on C4x5 rollout', ['C4.5']), []);
});

test('reports every term that hit, not just the first', () => {
  assert.deepEqual(matchTerms('Spill and protest', ['spill', 'protest', 'fire']), ['spill', 'protest']);
});

console.log('\nFlagging');

const rules = [
  { id: 'r1', name: 'Environmental incident', terms: 'spill, leak' },
  { id: 'r2', name: 'Community unrest', terms: 'protest\nblockade' },
];

test('names every rule a mention matched', () => {
  const flagged = flagMentions([mention('Spill sparks protest in Delta')], rules);
  assert.equal(flagged.length, 1);
  assert.deepEqual(flagged[0]!.rules, ['Environmental incident', 'Community unrest']);
});

test('searches the snippet as well as the headline', () => {
  const flagged = flagMentions([mention('Seplat in the news', 'Residents staged a blockade')], rules);
  assert.deepEqual(flagged[0]!.rules, ['Community unrest']);
});

test('leaves an ordinary mention unflagged rather than alerting on everything', () => {
  assert.deepEqual(flagMentions([mention('Seplat announces scholarship awards')], rules), []);
});

test('flags nothing when no rule has any terms, instead of flagging everything', () => {
  assert.deepEqual(flagMentions([mention('Spill in Delta')], [{ id: 'r', name: 'Empty', terms: '  ' }]), []);
});

console.log('\nPayloads');

const flagged = flagMentions([mention('Spill sparks protest in Delta')], rules);

test('Teams uses the Adaptive Card envelope a Workflows webhook expects', () => {
  const payload = buildPayload('teams', flagged, 'Seplat Energy Plc', null) as {
    type: string;
    attachments: { contentType: string; content: { type: string; version: string } }[];
  };
  assert.equal(payload.type, 'message');
  assert.equal(payload.attachments[0]!.contentType, 'application/vnd.microsoft.card.adaptive');
  assert.equal(payload.attachments[0]!.content.type, 'AdaptiveCard');
});

test('Teams adds the queue action only when there is a link to point at', () => {
  const without = buildPayload('teams', flagged, 'Seplat', null) as { attachments: { content: Record<string, unknown> }[] };
  assert.ok(!('actions' in without.attachments[0]!.content));
  const with_ = buildPayload('teams', flagged, 'Seplat', 'https://spims.example/mentions') as {
    attachments: { content: { actions: { url: string }[] } }[];
  };
  assert.equal(with_.attachments[0]!.content.actions[0]!.url, 'https://spims.example/mentions');
});

test('Slack carries the summary in text as well as in blocks, for the notification preview', () => {
  const payload = buildPayload('slack', flagged, 'Seplat Energy Plc', null) as { text: string; blocks: unknown[] };
  assert.match(payload.text, /1 flagged mention of Seplat Energy Plc/);
  assert.ok(payload.blocks.length >= 2);
});

test('the generic shape names the rules, so a receiver can route on them', () => {
  const payload = buildPayload('webhook', flagged, 'Seplat', null) as {
    source: string;
    flagged: { rules: string[]; url: string }[];
  };
  assert.equal(payload.source, 'SPIMS');
  assert.deepEqual(payload.flagged[0]!.rules, ['Environmental incident', 'Community unrest']);
});

test('an unknown kind falls back to the generic shape rather than throwing', () => {
  const payload = buildPayload('carrier-pigeon', flagged, 'Seplat', null) as { source: string };
  assert.equal(payload.source, 'SPIMS');
});

test('summarises the remainder once past the listing cap', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...mention(`Spill number ${i}`), id: `m${i}` }));
  const payload = buildPayload('slack', flagMentions(many, rules), 'Seplat', null) as { blocks: { type: string }[] };
  // One summary section, eight listed, one context line for the overflow.
  assert.equal(payload.blocks.filter((b) => b.type === 'section').length, 9);
  assert.equal(payload.blocks.filter((b) => b.type === 'context').length, 1);
});

test('the test alert goes through the same builder as a real one', () => {
  const payload = buildPayload('slack', [testMention()], 'Seplat', null) as { text: string };
  assert.match(payload.text, /1 flagged mention of Seplat/);
});

console.log(failures === 0 ? '\nAll alert checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
