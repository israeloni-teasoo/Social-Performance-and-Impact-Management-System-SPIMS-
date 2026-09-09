import type { ChapterTone } from './spec';

/**
 * The report palette, taken from Seplat's own 2025 Social Performance Report.
 *
 * These are not approximations. The report was rendered to bitmaps and its dominant
 * colours sampled, so a figure exported from SPIMS sits beside a page of their
 * published report without a visible shift in brand.
 *
 * Shared by every renderer. A PDF and a slide deck of the same report must not be
 * different shades of the same idea, so neither owns the palette.
 */

/** Headings, dark numerals on light ground. The colour their section titles are set in. */
export const GREEN_DEEP = '#006B42';
/** The workhorse fill: KPI tiles, bars, rules. */
export const GREEN = '#67B432';
export const GREEN_MID = '#82C341';
export const GREEN_WASH = '#D5E9C4';
export const GREEN_WASH_SOFT = '#E0F0D5';

/** Operational figures on their performance spread. */
export const AMBER = '#F8B006';
export const AMBER_LIGHT = '#FAC11A';

/** Their "Our impact" chapter. */
export const TEAL_DEEP = '#1A8980';
export const TEAL = '#52BBB4';
export const TEAL_WASH = '#DDF1F0';

/** Their "Our communities" chapter, and the banner rule above a sub-heading. */
export const ORANGE = '#EA5B1A';

/** Their strategy spread. Used here for the governance chapter. */
export const PURPLE = '#7C6AA0';
export const PURPLE_WASH = '#E2D9EA';

export const INK = '#2B2B2B';
export const MUTED = '#7A7A7A';
export const LINE = '#DCDCDC';
export const WHITE = '#FFFFFF';

export interface Tone {
  /** The saturated colour: rules, active tabs, chart bars. */
  base: string;
  /** Darker, for text on a light ground. */
  deep: string;
  /** Tint, for panel fills. */
  wash: string;
}

export const TONES: Record<ChapterTone, Tone> = {
  overview: { base: GREEN, deep: GREEN_DEEP, wash: GREEN_WASH_SOFT },
  impact: { base: TEAL, deep: TEAL_DEEP, wash: TEAL_WASH },
  communities: { base: ORANGE, deep: '#B7400E', wash: '#FBE4D7' },
  governance: { base: PURPLE, deep: '#4E4070', wash: PURPLE_WASH },
};

/**
 * Tile fills, in the order Seplat uses them on a performance spread: saturated green
 * first, then amber, then the chapter's own colour.
 */
export const TILE_FILLS = [GREEN, AMBER, TEAL, GREEN_DEEP];

/**
 * Ink for text sitting on a tile.
 *
 * Their amber tiles carry deep green text and their green tiles carry white. That is a
 * contrast decision, not a stylistic one — white on amber is unreadable in print.
 */
export function inkOn(fill: string): string {
  return fill === AMBER || fill === AMBER_LIGHT || fill === GREEN_WASH ? GREEN_DEEP : WHITE;
}
