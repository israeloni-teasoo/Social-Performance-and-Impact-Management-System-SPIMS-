import { useEffect, useState } from 'react';
import { api } from './api';
import type { Stakeholder } from './types';

export interface NewStakeholderInput {
  name: string;
  type: string;
  community: string;
}

export function useStakeholdersStore(onNotify: (message: string) => void) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);

  useEffect(() => {
    api
      .get<Stakeholder[]>('/api/stakeholders')
      .then(setStakeholders)
      .catch(() => onNotify('Could not load the stakeholder register.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addStakeholder = async (input: NewStakeholderInput) => {
    try {
      const created = await api.post<Stakeholder>('/api/stakeholders', input);
      setStakeholders((list) => [created, ...list]);
      onNotify(`${created.name} added to the stakeholder register.`);
    } catch {
      onNotify('Could not add that stakeholder — try again.');
    }
  };

  return { stakeholders, addStakeholder };
}
