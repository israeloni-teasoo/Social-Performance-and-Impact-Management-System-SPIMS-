import { useEffect, useState } from 'react';
import type { ReportComment } from './types';
import type { ToastTone } from './useToastQueue';

const STORAGE_KEY = 'spims_report_comments_v1';

function load(): ReportComment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ReportComment[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return [];
}

function save(list: ReportComment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export function useReportCommentsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [comments, setComments] = useState<ReportComment[]>(() => load());

  useEffect(() => {
    save(comments);
  }, [comments]);

  const addComment = (reportId: string, author: string, text: string, requestsCorrection: boolean) => {
    idCounter += 1;
    const created: ReportComment = {
      id: `rc-${Date.now()}-${idCounter}`,
      reportId,
      author,
      text: text.trim(),
      requestsCorrection,
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
    };
    setComments((list) => [...list, created]);
    onNotify(requestsCorrection ? 'Correction requested — the report is flagged for review.' : 'Comment added.', 'success');
  };

  return { comments, addComment };
}
