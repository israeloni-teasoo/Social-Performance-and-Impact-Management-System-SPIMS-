import { comparePassword, signSession } from '../lib/auth';
import { prisma } from '../lib/db';
import type { HandlerResult, PublicUser } from '../lib/types';
import type { User } from '@prisma/client';

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role, roleLabel: user.roleLabel, initials: user.initials };
}

export async function loginHandler(input: { email?: unknown; password?: unknown }): Promise<HandlerResult<{ token?: string; user?: PublicUser; error?: string }>> {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || !password) return { status: 400, body: { error: 'Email and password are required.' } };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: 401, body: { error: 'Email or password not recognised.' } };

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return { status: 401, body: { error: 'Email or password not recognised.' } };

  // Checked after the password so the response cannot be used to discover which
  // addresses hold accounts.
  if (!user.active) return { status: 403, body: { error: 'This account has been deactivated. Contact your administrator.' } };

  const token = signSession({ userId: user.id, role: user.role });
  return { status: 200, body: { token, user: toPublicUser(user) } };
}

export async function meHandler(userId: string | null): Promise<HandlerResult<{ user?: PublicUser; error?: string }>> {
  if (!userId) return { status: 401, body: { error: 'Not signed in.' } };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) return { status: 401, body: { error: 'Not signed in.' } };
  return { status: 200, body: { user: toPublicUser(user) } };
}
