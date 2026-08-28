import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { TEAM_MEMBERS } from './data/seed';
import type { NewTeamMemberInput, TeamMember } from './types';
import type { ToastTone } from './useToastQueue';

const KEY = 'spims_team_v2';

export function useTeamStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    isApiAvailable()
      .then((live) => (live ? api.get<TeamMember[]>('/api/team') : loadLocal<TeamMember[]>(KEY, TEAM_MEMBERS)))
      .then(setMembers)
      .catch(() => setMembers(loadLocal<TeamMember[]>(KEY, TEAM_MEMBERS)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inviteMember = async (input: NewTeamMemberInput) => {
    const draft: TeamMember = {
      id: `tm-${Date.now()}`,
      name: input.name.trim() || 'Unnamed member',
      email: input.email.trim() || '—',
      roleTitle: input.roleTitle.trim() || 'Field Officer',
      status: 'Invited',
      joinedAt: 'Invited just now',
    };
    try {
      const created = (await isApiAvailable()) ? await api.post<TeamMember>('/api/team', input) : draft;
      setMembers((list) => {
        const next = [created, ...list];
        saveLocal(KEY, next);
        return next;
      });
      onNotify(`Invitation sent to ${created.name}.`, 'success');
    } catch {
      onNotify('Could not send that invitation — try again.', 'warning');
    }
  };

  return { members, inviteMember };
}
