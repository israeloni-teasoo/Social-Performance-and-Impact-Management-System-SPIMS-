import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal, stamp } from './apiMode';
import type { ReportComment } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_report_comments_v2';

export function useReportCommentsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [comments, setComments] = useState<ReportComment[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) =>
        live ? api.get<ReportComment[]>('/api/report-comments') : loadLocal<ReportComment[]>(KEY, []),
      )
      .then(setComments)
      .catch(() => setComments(loadLocal<ReportComment[]>(KEY, [])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addComment = async (reportId: string, author: string, text: string, requestsCorrection: boolean) => {
    try {
      const created: ReportComment = (await isApiAvailable())
        ? await api.post<ReportComment>('/api/report-comments', { reportId, text, requestsCorrection })
        : { id: `rc-${Date.now()}`, reportId, author, text: text.trim(), requestsCorrection, createdAt: stamp() };
      setComments((list) => {
        const next = [...list, created];
        saveLocal(KEY, next);
        return next;
      });
      onNotify(requestsCorrection ? 'Correction requested — the report is flagged for review.' : 'Comment added.', 'success');
    } catch {
      onNotify('Could not add that comment — try again.', 'warning');
    }
  };

  return { comments, addComment };
}
