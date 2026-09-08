import { useEffect, useState } from 'react';
import { api } from './api';
import { isApiAvailable } from './apiMode';
import type { ManagedUser, NewUserInput, Role } from './types';
import type { ToastTone } from './useToastQueue';

/**
 * Account administration.
 *
 * Unlike the other stores this one has no demo-mode fallback. Accounts are not
 * portfolio content: pretending to create one in a browser that has no server would
 * suggest an account exists when it does not. Without an API the screen says so.
 */
export function useUsersStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isApiAvailable()
      .then(async (live) => {
        if (!live) return;
        const list = await api.get<ManagedUser[]>('/api/users');
        if (!cancelled) {
          setUsers(list);
          setAvailable(true);
        }
      })
      .catch(() => {
        // A 403 here means a non-executive opened the screen; treat it as unavailable
        // rather than an error, since the interface should not have offered it.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const failure = (err: unknown, fallback: string) =>
    onNotify(err instanceof Error && err.message ? err.message : fallback, 'warning');

  const addUser = async (input: NewUserInput) => {
    try {
      const created = await api.post<ManagedUser>('/api/users', input);
      setUsers((list) => [...list, created].sort((a, b) => a.name.localeCompare(b.name)));
      onNotify(`Account created for ${created.name}.`, 'success');
      return true;
    } catch (err) {
      failure(err, 'Could not create that account.');
      return false;
    }
  };

  const setRole = async (id: string, role: Role) => {
    try {
      const updated = await api.post<ManagedUser>('/api/users/role', { id, role });
      setUsers((list) => list.map((u) => (u.id === id ? updated : u)));
      onNotify(`${updated.name} is now ${updated.roleLabel}.`, 'success');
    } catch (err) {
      failure(err, 'Could not change that role.');
    }
  };

  const setActive = async (id: string, active: boolean) => {
    try {
      const updated = await api.post<ManagedUser>('/api/users/active', { id, active });
      setUsers((list) => list.map((u) => (u.id === id ? updated : u)));
      onNotify(active ? `${updated.name} reactivated.` : `${updated.name} deactivated — signed out immediately.`, 'info');
    } catch (err) {
      failure(err, 'Could not change that account.');
    }
  };

  const resetPassword = async (id: string, password: string) => {
    try {
      await api.post('/api/users/reset-password', { id, password });
      onNotify('Password reset. Share it securely and ask them to change it.', 'success');
      return true;
    } catch (err) {
      failure(err, 'Could not reset that password.');
      return false;
    }
  };

  return { users, loading, available, addUser, setRole, setActive, resetPassword };
}

/** Available to every role, so it lives outside the administrator store. */
export async function changeOwnPassword(
  currentPassword: string,
  newPassword: string,
  onNotify: (message: string, tone?: ToastTone) => void,
): Promise<boolean> {
  try {
    if (!(await isApiAvailable())) {
      onNotify('Changing your password needs the server, which this demo build has no connection to.', 'warning');
      return false;
    }
    await api.post('/api/users/change-password', { currentPassword, newPassword });
    onNotify('Password changed.', 'success');
    return true;
  } catch (err) {
    onNotify(err instanceof Error && err.message ? err.message : 'Could not change your password.', 'warning');
    return false;
  }
}
