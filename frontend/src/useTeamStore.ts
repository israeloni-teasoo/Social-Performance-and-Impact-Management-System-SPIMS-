import { useEffect, useState } from 'react';
import { api } from './api';
import type { NewTeamMemberInput, TeamMember } from './types';
import type { ToastTone } from './useToastQueue';

export function useTeamStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    api
      .get<TeamMember[]>('/api/team')
      .then(setMembers)
      .catch(() => onNotify('Could not load the team list.', 'warning'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inviteMember = async (input: NewTeamMemberInput) => {
    try {
      const created = await api.post<TeamMember>('/api/team', input);
      setMembers((list) => [created, ...list]);
      onNotify(`Invitation sent to ${created.name}.`, 'success');
    } catch {
      onNotify('Could not send that invitation — try again.', 'warning');
    }
  };

  return { members, inviteMember };
}
