import { useEffect, useState } from 'react';
import { APPROVALS } from './data/seed';
import type { Approval } from './types';

const STORAGE_KEY = 'spims_approvals_v1';

function load(): Approval[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Approval[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return APPROVALS;
}

function save(list: Approval[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

export function useApprovalsStore(onNotify: (message: string, tone?: 'success' | 'info' | 'warning') => void) {
  const [approvals, setApprovals] = useState<Approval[]>(() => load());

  useEffect(() => {
    save(approvals);
  }, [approvals]);

  const approve = (id: string) => {
    const item = approvals.find((a) => a.id === id);
    setApprovals((list) => list.filter((a) => a.id !== id));
    if (item) onNotify(`Approved — "${item.item}" now feeds indicators and the executive dashboard.`, 'success');
  };

  const returnItem = (id: string) => {
    const item = approvals.find((a) => a.id === id);
    setApprovals((list) => list.filter((a) => a.id !== id));
    if (item) onNotify(`Returned "${item.item}" to ${item.who} for revision.`, 'warning');
  };

  return { approvals, approve, returnItem };
}
