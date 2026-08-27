import { useEffect, useState } from 'react';
import { api } from './api';
import type { Approval, ApprovalComment } from './types';
import type { ToastTone } from './useToastQueue';

export function useApprovalsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [approvals, setApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    api
      .get<Approval[]>('/api/approvals')
      .then(setApprovals)
      .catch(() => onNotify('Could not load the approvals queue.', 'warning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string) => {
    const item = approvals.find((a) => a.id === id);
    try {
      await api.post('/api/approvals/approve', { id });
      setApprovals((list) => list.filter((a) => a.id !== id));
      if (item) onNotify(`Approved — "${item.item}" now feeds indicators and the executive dashboard.`, 'success');
    } catch {
      onNotify('Could not approve that item — try again.', 'warning');
    }
  };

  const returnItem = async (id: string) => {
    const item = approvals.find((a) => a.id === id);
    try {
      await api.post('/api/approvals/return', { id });
      setApprovals((list) => list.filter((a) => a.id !== id));
      if (item) onNotify(`Returned "${item.item}" to ${item.who} for revision.`, 'warning');
    } catch {
      onNotify('Could not return that item — try again.', 'warning');
    }
  };

  const addComment = async (id: string, _author: string, text: string) => {
    try {
      const comment = await api.post<ApprovalComment>('/api/approvals/comment', { id, text });
      setApprovals((list) => list.map((a) => (a.id === id ? { ...a, comments: [...a.comments, comment] } : a)));
      onNotify('Comment added.', 'success');
    } catch {
      onNotify('Could not add that comment — try again.', 'warning');
    }
  };

  return { approvals, approve, returnItem, addComment };
}
