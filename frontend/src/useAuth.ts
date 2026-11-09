import { useEffect, useState } from 'react';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { DEMO_ACCOUNTS } from './data/accounts';
import type { Role } from './types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  initials: string;
}

const DEMO_KEY = 'spims_auth_v2';

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase();
}

/** Signs in against the bundled demo accounts when no API is present. */
function demoLogin(email: string, password: string): AuthUser | null {
  const a = DEMO_ACCOUNTS.find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password,
  );
  if (!a) return null;
  return { id: a.role, email: a.email, name: a.name, role: a.role, roleLabel: a.roleLabel, initials: initials(a.name) };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isApiAvailable()
      .then(async (live) => {
        if (cancelled) return;
        setDemoMode(!live);
        if (!live) {
          setUser(loadLocal<AuthUser | null>(DEMO_KEY, null));
          return;
        }
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = res.ok ? await res.json() : null;
        if (!cancelled) setUser(data?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setDemoMode(true);
          setUser(loadLocal<AuthUser | null>(DEMO_KEY, null));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Returns the server's own message on a failure rather than a bare false.
   *
   * Being locked out after too many attempts is a different problem from a wrong
   * password, and a person told the wrong one of the two keeps typing — which, with a
   * lockout in place, is exactly what keeps them locked out.
   */
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (await isApiAvailable()) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: data?.error };
      }
      const data = await res.json();
      setUser(data.user);
      return { ok: true };
    }
    const u = demoLogin(email, password);
    if (!u) return { ok: false };
    saveLocal(DEMO_KEY, u);
    setUser(u);
    return { ok: true };
  };

  const logout = async () => {
    if (await isApiAvailable()) {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } else {
      saveLocal(DEMO_KEY, null);
    }
    setUser(null);
  };

  return { user, loading, demoMode, login, logout };
}
