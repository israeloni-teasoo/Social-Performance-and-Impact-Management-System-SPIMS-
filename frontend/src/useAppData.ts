import { useEffect, useState } from 'react';
import { api } from './api';
import type { Community, EvidenceItem, Indicator, Project, ProjectImpact, Report } from './types';

export interface AppData {
  projects: Project[];
  projectImpacts: Record<string, ProjectImpact>;
  communities: Community[];
  indicators: Indicator[];
  reports: Report[];
  evidence: EvidenceItem[];
}

const EMPTY: AppData = { projects: [], projectImpacts: {}, communities: [], indicators: [], reports: [], evidence: [] };

/** Loads the read-mostly portfolio content that used to be static seed data, now served
 * from Postgres via the API. Fetched once per session since none of this changes live yet. */
export function useAppData() {
  const [data, setData] = useState<AppData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Project[]>('/api/projects'),
      api.get<Record<string, ProjectImpact>>('/api/project-impacts'),
      api.get<Community[]>('/api/communities'),
      api.get<Indicator[]>('/api/indicators'),
      api.get<Report[]>('/api/reports'),
      api.get<EvidenceItem[]>('/api/evidence'),
    ])
      .then(([projects, projectImpacts, communities, indicators, reports, evidence]) => {
        setData({ projects, projectImpacts, communities, indicators, reports, evidence });
      })
      .catch(() => setError('Could not load SPIMS data. Check that the API server is running and try reloading.'))
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading, error };
}
