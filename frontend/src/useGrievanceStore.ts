import { useEffect, useState } from 'react';
import { INITIAL_GRIEVANCES } from './data/seed';
import { nowStamp, plusDaysStamp, todayStamp } from './dates';
import { currentUserLabel } from './roles';
import type { Grievance, NewGrievanceInput, Role } from './types';

const STORAGE_KEY = 'spims_grievances_v1';
const STARTING_SEQ = 119;

interface StoredState {
  list: Grievance[];
  seq: number;
}

function load(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed && Array.isArray(parsed.list)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return { list: INITIAL_GRIEVANCES, seq: STARTING_SEQ };
}

function save(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable (e.g. private browsing) — proceed without persistence
  }
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function useGrievanceStore(role: Role) {
  const [state, setState] = useState<StoredState>(() => load());

  useEffect(() => {
    save(state);
  }, [state]);

  const addTimeline = (g: Grievance, action: string): Grievance => ({
    ...g,
    timeline: [...g.timeline, { id: nextId('t'), ts: nowStamp(), actor: currentUserLabel(role), action }],
  });

  const update = (id: string, patch: Partial<Grievance>, timelineAction?: string) => {
    setState((s) => ({
      ...s,
      list: s.list.map((g) => {
        if (g.id !== id) return g;
        const patched = { ...g, ...patch };
        return timelineAction ? addTimeline(patched, timelineAction) : patched;
      }),
    }));
  };

  const logGrievance = (input: NewGrievanceInput): Grievance => {
    const channel = input.channel.trim() || 'Walk-in desk';
    const ref = `GRV-${state.seq}`;
    const actor = currentUserLabel(role);
    const created: Grievance = {
      id: nextId('g'),
      ref,
      title: input.title.trim() || 'Untitled grievance',
      category: input.category.trim() || 'General',
      severity: (input.severity.trim() || 'Medium') as Grievance['severity'],
      status: 'Open',
      channel,
      raisedByName: input.raisedByName.trim() || 'Anonymous',
      raisedByRole: 'Community member',
      raisedByCommunity: input.raisedByCommunity.trim() || '—',
      raisedByContact: input.raisedByContact.trim() || '—',
      loggedBy: actor,
      assignee: null,
      description: input.description.trim(),
      dateRaised: todayStamp(),
      dueDate: plusDaysStamp(14),
      overdue: false,
      resolution: null,
      resolvedDate: null,
      satisfaction: null,
      timeline: [{ id: nextId('t'), ts: nowStamp(), actor, action: 'Grievance logged via ' + channel }],
    };
    setState((s) => ({ list: [created, ...s.list], seq: s.seq + 1 }));
    return created;
  };

  const assign = (id: string, assignee: string) => {
    const who = assignee.trim() || 'Blessing Aganbi · Community Relations';
    update(id, { assignee: who, status: 'Investigating' }, `Assigned to ${who} · investigation started`);
  };

  const addNote = (id: string, note: string) => {
    if (!note.trim()) return;
    update(id, {}, `Note: ${note.trim()}`);
  };

  const resolve = (id: string, resolution: string) => {
    const r = resolution.trim() || 'Resolved with the community.';
    update(id, { status: 'Resolved', resolution: r, resolvedDate: todayStamp() }, `Resolved · ${r}`);
  };

  const closeCase = (id: string, satisfaction: string) => {
    const s = satisfaction.trim() || 'Satisfied';
    update(id, { status: 'Closed', satisfaction: s }, `Case closed · satisfaction: ${s}`);
  };

  const escalate = (id: string) => {
    update(id, { severity: 'High' }, 'Escalated to senior management');
  };

  return { grievances: state.list, logGrievance, assign, addNote, resolve, closeCase, escalate };
}
