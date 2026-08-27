import { useEffect, useState } from 'react';
import { api } from './api';
import type { NewTargetInput, Target } from './types';
import type { ToastTone } from './useToastQueue';

export function useTargetsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    api
      .get<Target[]>('/api/targets')
      .then(setTargets)
      .catch(() => onNotify('Could not load targets.', 'warning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTarget = async (input: NewTargetInput) => {
    try {
      const created = await api.post<Target>('/api/targets', input);
      setTargets((list) => [created, ...list]);
      onNotify(`"${created.name}" target set.`, 'success');
    } catch {
      onNotify('Could not save that target — try again.', 'warning');
    }
  };

  const closeTarget = async (id: string) => {
    const t = targets.find((x) => x.id === id);
    try {
      await api.post('/api/targets/close', { id });
      setTargets((list) => list.map((x) => (x.id === id ? { ...x, status: 'Closed' } : x)));
      if (t) onNotify(`"${t.name}" closed.`, 'info');
    } catch {
      onNotify('Could not close that target — try again.', 'warning');
    }
  };

  return { targets, addTarget, closeTarget };
}
