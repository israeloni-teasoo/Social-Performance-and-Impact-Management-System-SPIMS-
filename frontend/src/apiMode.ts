/**
 * SPIMS runs in two environments:
 *
 *   1. Full stack (Vercel + Postgres) — a real API is present at /api/*.
 *   2. Static host (GitHub Pages) — no server exists, so /api/* cannot answer.
 *
 * A static host answers an unknown path with HTML (its 404 page), never JSON,
 * so probing the content type distinguishes the two reliably. Note that a real
 * API returns 401 JSON here when nobody is signed in — so we must inspect the
 * content type rather than res.ok.
 *
 * The probe runs once per page load and every caller shares the result.
 */
let probe: Promise<boolean> | null = null;

export function isApiAvailable(): Promise<boolean> {
  if (!probe) {
    probe = fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.headers.get('content-type') ?? '').includes('application/json'))
      .catch(() => false);
  }
  return probe;
}

/** Demo-mode persistence. Mirrors the pre-backend behaviour: state survives a
 *  reload but is local to the browser. Guarded because storage can be unavailable. */
export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // corrupt or unavailable storage — fall through to the seed value
  }
  return fallback;
}

export function saveLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — proceed without persistence
  }
}

export function stamp(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
