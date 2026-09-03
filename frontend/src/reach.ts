import type { Project, ProjectImpact, ReachProfile } from './types';

export interface ReachTotals {
  /** Everyone the programmes interacted with. */
  reach: number;
  /** The subset who actually received the intervention. */
  impact: number;
  /** Share of interactions that converted into a delivered intervention, 0–100. */
  conversionPct: number;
  /** Programmes whose reach hasn't been separated from impact yet. */
  unmapped: string[];
}

export interface PillarReach extends ReachTotals {
  pillar: string;
  projectCount: number;
}

/** Thousands separators — figures are compared against published reports, so no compact "K" rounding. */
export function formatCount(n: number): string {
  return n.toLocaleString('en-NG');
}

/** Compact form for headline tiles where space is tight. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return formatCount(n);
}

function conversion(reach: number, impact: number): number {
  return reach === 0 ? 0 : Math.round((impact / reach) * 1000) / 10;
}

export function totalsFor(projects: Project[], impacts: Record<string, ProjectImpact>): ReachTotals {
  let reach = 0;
  let impact = 0;
  const unmapped: string[] = [];

  for (const project of projects) {
    const profile: ReachProfile | undefined = impacts[project.code]?.reach;
    if (!profile) {
      unmapped.push(project.code);
      continue;
    }
    reach += profile.total;
    impact += profile.directBeneficiaries;
  }

  return { reach, impact, conversionPct: conversion(reach, impact), unmapped };
}

/** Reach and impact split by pillar, so scale is visible without inflating the impact claim. */
export function byPillar(projects: Project[], impacts: Record<string, ProjectImpact>): PillarReach[] {
  const pillars = new Map<string, Project[]>();
  for (const project of projects) {
    const group = pillars.get(project.pillar);
    if (group) group.push(project);
    else pillars.set(project.pillar, [project]);
  }

  return [...pillars.entries()]
    .map(([pillar, group]) => ({ pillar, projectCount: group.length, ...totalsFor(group, impacts) }))
    .sort((a, b) => b.reach - a.reach);
}
