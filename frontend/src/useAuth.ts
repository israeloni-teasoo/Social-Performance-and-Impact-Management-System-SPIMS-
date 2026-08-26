import { useEffect, useState } from 'react';
import { DEMO_ACCOUNTS } from './data/accounts';
import type { Role } from './types';

const STORAGE_KEY = 'spims_auth_v1';

function load(): Role | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'exec' || raw === 'manager' || raw === 'field' || raw === 'relations') return raw;
  } catch {
    // ignore corrupt storage
  }
  return null;
}

export function useAuth() {
  const [role, setRole] = useState<Role | null>(() => load());

  useEffect(() => {
    try {
      if (role) localStorage.setItem(STORAGE_KEY, role);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable — proceed without persistence
    }
  }, [role]);

  const login = (email: string, password: string): boolean => {
    const account = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (!account) return false;
    setRole(account.role);
    return true;
  };

  const logout = () => setRole(null);

  return { role, login, logout };
}
