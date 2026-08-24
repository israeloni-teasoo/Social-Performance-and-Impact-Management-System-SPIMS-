import { useEffect, useState } from 'react';
import { APPROVALS } from './data/seed';
import type { Approval } from './types';

const STORAGE_KEY = 'spims_approvals_v2';

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

let idCounter = 0;

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

  const addComment = (id: string, author: string, text: string) => {
    idCounter += 1;
    setApprovals((list) =>
      list.map((a) =>
        a.id === id
          ? {
              ...a,
              comments: [
                ...a.comments,
                {
                  id: `ac-${Date.now()}-${idCounter}`,
                  author,
                  text: text.trim(),
                  createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                },
              ],
            }
          : a,
      ),
    );
    onNotify('Comment added.', 'success');
  };

  return { approvals, approve, returnItem, addComment };
}
