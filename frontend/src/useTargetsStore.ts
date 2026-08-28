import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { TARGETS } from './data/seed';
import type { NewTargetInput, Target } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_targets_v3';

export function useTargetsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [targets, setTargets] = useState<Target[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) => (live ? api.get<Target[]>('/api/targets') : loadLocal<Target[]>(KEY, TARGETS)))
      .then(setTargets)
      .catch(() => setTargets(loadLocal<Target[]>(KEY, TARGETS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTarget = async (input: NewTargetInput) => {
    const draft: Target = {
      id: `tgt-${Date.now()}`,
      name: input.name.trim() || 'Unnamed target',
      metric: input.metric.trim() || '—',
      unit: input.unit,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      totalTarget: input.totalTarget,
      currentValue: input.currentValue,
      status: 'Active',
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    try {
      const created = (await isApiAvailable()) ? await api.post<Target>('/api/targets', input) : draft;
      setTargets((list) => {
        const next = [created, ...list];
        saveLocal(KEY, next);
        return next;
      });
      onNotify(`"${created.name}" target set.`, 'success');
    } catch {
      onNotify('Could not save that target — try again.', 'warning');
    }
  };

  const closeTarget = async (id: string) => {
    const t = targets.find((x) => x.id === id);
    try {
      if (await isApiAvailable()) await api.post('/api/targets/close', { id });
      setTargets((list) => {
        const next = list.map((x) => (x.id === id ? { ...x, status: 'Closed' as const } : x));
        saveLocal(KEY, next);
        return next;
      });
      if (t) onNotify(`"${t.name}" closed.`, 'info');
    } catch {
      onNotify('Could not close that target — try again.', 'warning');
    }
  };

  return { targets, addTarget, closeTarget };
}
