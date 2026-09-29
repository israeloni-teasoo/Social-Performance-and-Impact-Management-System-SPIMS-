/**
 * An API call that was refused, carrying the status alongside the message.
 *
 * The status used to be discarded, which made every failure look alike to a caller. The
 * mention run showed it: "no sources are configured" (400) and "every source failed"
 * (502) arrived as indistinguishable errors, so an install with nothing configured was
 * told its network was broken and sent looking for a firewall problem that did not exist.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { error?: string }).error || `Request to ${path} failed (${res.status}).`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
