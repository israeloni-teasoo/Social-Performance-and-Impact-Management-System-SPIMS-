import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable } from './apiMode';
import { COMMUNITIES, EVIDENCE_ITEMS, INDICATORS, PROJECT_IMPACTS, PROJECTS, REPORTS } from './data/seed';
import type { Community, EvidenceItem, Indicator, Project, ProjectImpact, Report } from './types';

export interface AppData {
  projects: Project[];
  projectImpacts: Record<string, ProjectImpact>;
  communities: Community[];
  indicators: Indicator[];
  reports: Report[];
  evidence: EvidenceItem[];
}

const SEED: AppData = {
  projects: PROJECTS,
  projectImpacts: PROJECT_IMPACTS,
  communities: COMMUNITIES,
  indicators: INDICATORS,
  reports: REPORTS,
  evidence: EVIDENCE_ITEMS,
};

const EMPTY: AppData = { projects: [], projectImpacts: {}, communities: [], indicators: [], reports: [], evidence: [] };

/** Portfolio content: served from Postgres when an API is present, otherwise
 *  read from the bundled seed data so the app is fully browsable on a static host. */
export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /** Re-fetches the portfolio — used after a project is created or edited. */
  const refresh = () => setReloadToken((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    isApiAvailable()
      .then(async (live) => {
        if (!live) {
          if (!cancelled) setData(SEED);
          return;
        }
        const [projects, projectImpacts, communities, indicators, reports, evidence] = await Promise.all([
          api.get<Project[]>('/api/projects'),
          api.get<Record<string, ProjectImpact>>('/api/project-impacts'),
          api.get<Community[]>('/api/communities'),
          api.get<Indicator[]>('/api/indicators'),
          api.get<Report[]>('/api/reports'),
          api.get<EvidenceItem[]>('/api/evidence'),
        ]);
        if (!cancelled) setData({ projects, projectImpacts, communities, indicators, reports, evidence });
      })
      .catch(() => {
        // An API was detected but a request failed — fall back rather than showing an empty app.
        if (!cancelled) {
          setData(SEED);
          setError(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { ...data, loading, error, refresh };
}
