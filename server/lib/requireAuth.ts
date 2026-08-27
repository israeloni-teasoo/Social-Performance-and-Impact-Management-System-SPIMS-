import { prisma } from './db';
import type { User } from '@prisma/client';

/** Loads the authenticated user for handlers that need to attribute a mutation
 * (a comment, an invite) to a real person rather than trusting a client-supplied name. */
export async function requireUser(userId: string | null): Promise<User | null> {
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
