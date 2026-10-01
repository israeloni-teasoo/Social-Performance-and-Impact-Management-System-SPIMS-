import type { MentionSourceKind } from '../types';

/**
 * A starting set of free sources, for an installation that has none.
 *
 * A fresh install opens on an empty Sources panel with two free-text boxes and no way to
 * know that GDELT wants a search query while the others want a feed address, let alone
 * what Punch's feed address is. That is a poor place to leave someone who has just got
 * the system running.
 *
 * **They are created paused.** Configuring a source and switching it on are deliberately
 * two steps: a source decides what leaves Seplat's network, and the specification
 * undertakes that nothing is contacted until somebody turns it on. A convenience button
 * that quietly started four outbound feeds would break that undertaking, so each one
 * still has to be switched on by hand.
 */
export interface RecommendedSource {
  name: string;
  kind: MentionSourceKind;
  target: string;
  /** Why this one, in the words of someone deciding whether to switch it on. */
  note: string;
}

export const RECOMMENDED_SOURCES: RecommendedSource[] = [
  {
    name: 'GDELT — Seplat coverage',
    kind: 'gdelt',
    // One word, deliberately. It was `"Seplat" OR "Seplat Energy"`, which GDELT rejects:
    // its query language requires OR'd terms inside parentheses, and a malformed query
    // comes back as an HTML notice rather than an error status. The OR was redundant
    // anyway — every article containing "Seplat Energy" contains "Seplat".
    target: 'Seplat',
    note: 'A worldwide news index. Widest reach of the four, and the only one that finds outlets you have not listed.',
  },
  {
    name: 'Punch Newspapers',
    kind: 'rss',
    target: 'https://punchng.com/feed/',
    note: 'National daily. Its own feed, so coverage arrives without going through an intermediary.',
  },
  {
    name: 'Vanguard',
    kind: 'rss',
    target: 'https://www.vanguardngr.com/feed/',
    note: 'National daily with strong Niger Delta coverage.',
  },
  {
    name: 'BusinessDay',
    kind: 'rss',
    target: 'https://businessday.ng/feed/',
    note: 'Business and energy reporting, where corporate coverage tends to appear first.',
  },
];
