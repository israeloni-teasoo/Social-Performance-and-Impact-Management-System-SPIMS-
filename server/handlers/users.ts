import { comparePassword, hashPassword } from '../lib/auth';
import { prisma } from '../lib/db';
import type { HandlerResult } from '../lib/types';
import type { Role, User } from '@prisma/client';

const ROLE_LABELS: Record<Role, string> = {
  exec: 'Executive',
  manager: 'Project Manager',
  field: 'Field Officer',
  relations: 'Community Relations',
};

const ROLES = Object.keys(ROLE_LABELS) as Role[];

/** Long enough to resist guessing, short enough that people will not write it down. */
const MIN_PASSWORD_LENGTH = 12;

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  roleLabel: string;
  initials: string;
  active: boolean;
  createdAt: string;
}

function shape(user: User): ManagedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleLabel: user.roleLabel,
    initials: user.initials,
    active: user.active,
    createdAt: user.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Refuses any change that would leave the system with no way in.
 *
 * Deactivating or demoting the last active executive would lock every remaining user
 * out of account administration, recoverable only by running the command-line script
 * on the server. Cheaper to prevent than to explain.
 */
async function wouldRemoveLastExecutive(targetId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target || target.role !== 'exec' || !target.active) return false;
  const activeExecutives = await prisma.user.count({ where: { role: 'exec', active: true } });
  return activeExecutives <= 1;
}

export async function listUsersHandler(): Promise<HandlerResult> {
  const users = await prisma.user.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] });
  return { status: 200, body: users.map(shape) };
}

export async function createUserHandler(input: {
  email?: unknown;
  name?: unknown;
  role?: unknown;
  password?: unknown;
}): Promise<HandlerResult> {
  const email = str(input.email).toLowerCase();
  const name = str(input.name);
  const role = str(input.role) as Role;
  const password = typeof input.password === 'string' ? input.password : '';

  if (!email.includes('@')) return { status: 400, body: { error: 'A valid email address is required.' } };
  if (!name) return { status: 400, body: { error: 'A name is required.' } };
  if (!ROLES.includes(role)) return { status: 400, body: { error: 'Choose a valid role.' } };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: 400, body: { error: `The password must be at least ${MIN_PASSWORD_LENGTH} characters.` } };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { status: 409, body: { error: 'An account with that email already exists.' } };

  const created = await prisma.user.create({
    data: {
      email,
      name,
      role,
      roleLabel: ROLE_LABELS[role],
      initials: initialsFrom(name),
      passwordHash: await hashPassword(password),
    },
  });
  return { status: 201, body: shape(created) };
}

export async function setUserRoleHandler(input: { id?: unknown; role?: unknown }, actor: User): Promise<HandlerResult> {
  const id = str(input.id);
  const role = str(input.role) as Role;
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  if (!ROLES.includes(role)) return { status: 400, body: { error: 'Choose a valid role.' } };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { status: 404, body: { error: 'Account not found.' } };

  if (target.id === actor.id && role !== 'exec') {
    return { status: 400, body: { error: 'You cannot change your own role away from Executive.' } };
  }
  if (role !== 'exec' && (await wouldRemoveLastExecutive(id))) {
    return { status: 400, body: { error: 'This is the last active Executive. Promote another account first.' } };
  }

  const updated = await prisma.user.update({ where: { id }, data: { role, roleLabel: ROLE_LABELS[role] } });
  return { status: 200, body: shape(updated) };
}

export async function setUserActiveHandler(input: { id?: unknown; active?: unknown }, actor: User): Promise<HandlerResult> {
  const id = str(input.id);
  const active = Boolean(input.active);
  if (!id) return { status: 400, body: { error: 'id is required.' } };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { status: 404, body: { error: 'Account not found.' } };

  if (target.id === actor.id && !active) {
    return { status: 400, body: { error: 'You cannot deactivate your own account.' } };
  }
  if (!active && (await wouldRemoveLastExecutive(id))) {
    return { status: 400, body: { error: 'This is the last active Executive. Promote another account first.' } };
  }

  const updated = await prisma.user.update({ where: { id }, data: { active } });
  return { status: 200, body: shape(updated) };
}

export async function resetUserPasswordHandler(input: { id?: unknown; password?: unknown }): Promise<HandlerResult> {
  const id = str(input.id);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { status: 400, body: { error: `The password must be at least ${MIN_PASSWORD_LENGTH} characters.` } };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { status: 404, body: { error: 'Account not found.' } };

  await prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(password) } });
  return { status: 200, body: { id, ok: true } };
}

/**
 * Changing your own password. Available to every role, and the reason an
 * administrator-set password is acceptable: the holder can replace it immediately.
 * The current password is required so a borrowed, unlocked session cannot be used to
 * take the account over.
 */
export async function changeOwnPasswordHandler(
  input: { currentPassword?: unknown; newPassword?: unknown },
  actor: User,
): Promise<HandlerResult> {
  const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : '';
  const newPassword = typeof input.newPassword === 'string' ? input.newPassword : '';

  if (!(await comparePassword(currentPassword, actor.passwordHash))) {
    return { status: 400, body: { error: 'Your current password is not correct.' } };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { status: 400, body: { error: `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.` } };
  }
  if (newPassword === currentPassword) {
    return { status: 400, body: { error: 'The new password must be different from the current one.' } };
  }

  await prisma.user.update({ where: { id: actor.id }, data: { passwordHash: await hashPassword(newPassword) } });
  return { status: 200, body: { ok: true } };
}
