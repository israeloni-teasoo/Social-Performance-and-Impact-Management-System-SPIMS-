import { useEffect, useState } from 'react';
import { TARGETS } from './data/seed';
import type { NewTargetInput, Target } from './types';
import type { ToastTone } from './useToastQueue';

const STORAGE_KEY = 'spims_targets_v1';

function load(): Target[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Target[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return TARGETS;
}

function save(list: Target[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export function useTargetsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [targets, setTargets] = useState<Target[]>(() => load());

  useEffect(() => {
    save(targets);
  }, [targets]);

  const addTarget = (input: NewTargetInput) => {
    idCounter += 1;
    const created: Target = {
      id: `tgt-new-${Date.now()}-${idCounter}`,
      name: input.name.trim() || 'Unnamed target',
      metric: input.metric.trim() || '—',
      unit: input.unit,
      periodLabel: input.periodLabel.trim() || 'Undated',
      totalTarget: input.totalTarget,
      currentValue: input.currentValue,
      allocations: input.allocations.filter((a) => a.allocated > 0),
      status: 'Active',
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setTargets((list) => [created, ...list]);
    onNotify(`"${created.name}" target set for ${created.periodLabel} and allocated across ${created.allocations.length} department(s).`, 'success');
  };

  const closeTarget = (id: string) => {
    const t = targets.find((x) => x.id === id);
    setTargets((list) => list.map((x) => (x.id === id ? { ...x, status: 'Closed' } : x)));
    if (t) onNotify(`"${t.name}" closed for ${t.periodLabel}.`, 'info');
  };

  return { targets, addTarget, closeTarget };
}
