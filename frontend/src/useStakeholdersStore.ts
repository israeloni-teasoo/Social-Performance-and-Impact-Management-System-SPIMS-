import { useEffect, useState } from 'react';
import { STAKEHOLDERS } from './data/seed';
import type { Stakeholder } from './types';

const STORAGE_KEY = 'spims_stakeholders_v1';

function load(): Stakeholder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stakeholder[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return STAKEHOLDERS;
}

function save(list: Stakeholder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export interface NewStakeholderInput {
  name: string;
  type: string;
  community: string;
}

export function useStakeholdersStore(onNotify: (message: string) => void) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(() => load());

  useEffect(() => {
    save(stakeholders);
  }, [stakeholders]);

  const addStakeholder = (input: NewStakeholderInput) => {
    idCounter += 1;
    const created: Stakeholder = {
      id: `sh-new-${Date.now()}-${idCounter}`,
      name: input.name.trim() || 'Unnamed stakeholder',
      type: input.type.trim() || 'Other',
      community: input.community.trim() || '—',
      engagements: 0,
      commitments: 'None yet',
      status: 'Active',
    };
    setStakeholders((list) => [created, ...list]);
    onNotify(`${created.name} added to the stakeholder register.`);
  };

  return { stakeholders, addStakeholder };
}
