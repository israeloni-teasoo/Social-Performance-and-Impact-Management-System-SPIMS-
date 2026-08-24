import { useEffect, useState } from 'react';
import { TEAM_MEMBERS } from './data/seed';
import type { NewTeamMemberInput, TeamMember } from './types';
import type { ToastTone } from './useToastQueue';

const STORAGE_KEY = 'spims_team_v1';

function load(): TeamMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TeamMember[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore corrupt storage
  }
  return TEAM_MEMBERS;
}

function save(list: TeamMember[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

let idCounter = 0;

export function useTeamStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [members, setMembers] = useState<TeamMember[]>(() => load());

  useEffect(() => {
    save(members);
  }, [members]);

  const inviteMember = (input: NewTeamMemberInput) => {
    idCounter += 1;
    const created: TeamMember = {
      id: `tm-new-${Date.now()}-${idCounter}`,
      name: input.name.trim() || 'Unnamed member',
      email: input.email.trim() || '—',
      roleTitle: input.roleTitle.trim() || 'Field Officer',
      status: 'Invited',
      joinedAt: 'Invited just now',
    };
    setMembers((list) => [created, ...list]);
    onNotify(`Invitation sent to ${created.name}.`, 'success');
  };

  return { members, inviteMember };
}
