export interface HandlerResult<T = unknown> {
  status: number;
  body: T;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleLabel: string;
  initials: string;
}
