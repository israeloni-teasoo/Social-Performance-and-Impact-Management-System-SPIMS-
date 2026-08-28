import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal, stamp } from './apiMode';
import { APPROVALS } from './data/seed';
import type { Approval, ApprovalComment } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_approvals_v3';

export function useApprovalsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) => (live ? api.get<Approval[]>('/api/approvals') : loadLocal<Approval[]>(KEY, APPROVALS)))
      .then(setApprovals)
      .catch(() => setApprovals(loadLocal<Approval[]>(KEY, APPROVALS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = (id: string) =>
    setApprovals((list) => {
      const next = list.filter((a) => a.id !== id);
      saveLocal(KEY, next);
      return next;
    });

  const approve = async (id: string) => {
    const item = approvals.find((a) => a.id === id);
    try {
      if (await isApiAvailable()) await api.post('/api/approvals/approve', { id });
      remove(id);
      if (item) onNotify(`Approved — "${item.item}" now feeds indicators and the executive dashboard.`, 'success');
    } catch {
      onNotify('Could not approve that item — try again.', 'warning');
    }
  };

  const returnItem = async (id: string) => {
    const item = approvals.find((a) => a.id === id);
    try {
      if (await isApiAvailable()) await api.post('/api/approvals/return', { id });
      remove(id);
      if (item) onNotify(`Returned "${item.item}" to ${item.who} for revision.`, 'warning');
    } catch {
      onNotify('Could not return that item — try again.', 'warning');
    }
  };

  const addComment = async (id: string, author: string, text: string) => {
    try {
      const comment: ApprovalComment = (await isApiAvailable())
        ? await api.post<ApprovalComment>('/api/approvals/comment', { id, text })
        : { id: `ac-${Date.now()}`, author, text: text.trim(), createdAt: stamp() };
      setApprovals((list) => {
        const next = list.map((a) => (a.id === id ? { ...a, comments: [...a.comments, comment] } : a));
        saveLocal(KEY, next);
        return next;
      });
      onNotify('Comment added.', 'success');
    } catch {
      onNotify('Could not add that comment — try again.', 'warning');
    }
  };

  return { approvals, approve, returnItem, addComment };
}
