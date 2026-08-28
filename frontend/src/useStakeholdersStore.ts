import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { STAKEHOLDERS } from './data/seed';
import type { Stakeholder } from './types';

const KEY = 'spims_stakeholders_v2';

export interface NewStakeholderInput {
  name: string;
  type: string;
  community: string;
}

export function useStakeholdersStore(onNotify: (message: string) => void) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) =>
        live ? api.get<Stakeholder[]>('/api/stakeholders') : loadLocal<Stakeholder[]>(KEY, STAKEHOLDERS),
      )
      .then(setStakeholders)
      .catch(() => setStakeholders(loadLocal<Stakeholder[]>(KEY, STAKEHOLDERS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addStakeholder = async (input: NewStakeholderInput) => {
    const draft: Stakeholder = {
      id: `sh-${Date.now()}`,
      name: input.name.trim() || 'Unnamed stakeholder',
      type: input.type.trim() || 'Other',
      community: input.community.trim() || '—',
      engagements: 0,
      commitments: 'None yet',
      status: 'Active',
    };
    try {
      const created = (await isApiAvailable())
        ? await api.post<Stakeholder>('/api/stakeholders', input)
        : draft;
      setStakeholders((list) => {
        const next = [created, ...list];
        saveLocal(KEY, next);
        return next;
      });
      onNotify(`${created.name} added to the stakeholder register.`);
    } catch {
      onNotify('Could not add that stakeholder — try again.');
    }
  };

  return { stakeholders, addStakeholder };
}
