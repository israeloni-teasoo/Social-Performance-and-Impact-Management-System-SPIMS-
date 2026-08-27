import { useEffect, useState } from 'react';
import { api } from './api';
import type { ReportComment } from './types';
import type { ToastTone } from './useToastQueue';

export function useReportCommentsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [comments, setComments] = useState<ReportComment[]>([]);

  useEffect(() => {
    api
      .get<ReportComment[]>('/api/report-comments')
      .then(setComments)
      .catch(() => onNotify('Could not load report comments.', 'warning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addComment = async (reportId: string, _author: string, text: string, requestsCorrection: boolean) => {
    try {
      const created = await api.post<ReportComment>('/api/report-comments', { reportId, text, requestsCorrection });
      setComments((list) => [...list, created]);
      onNotify(requestsCorrection ? 'Correction requested — the report is flagged for review.' : 'Comment added.', 'success');
    } catch {
      onNotify('Could not add that comment — try again.', 'warning');
    }
  };

  return { comments, addComment };
}
