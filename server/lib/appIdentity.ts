import { prisma } from './db';

/**
 * Who this installation is, and where it can be reached.
 *
 * Both are needed by anything that sends a message off the server — at present the
 * media alerts. They live here rather than in the alerting module because neither is
 * about alerting: the organisation name is configured in Settings, and the public URL
 * is a deployment fact.
 */

/**
 * The public address of this deployment, or null when it does not know one.
 *
 * There is no reliable way to derive it: a request-derived host can be spoofed by a
 * Host header, and this is used to build a link sent to people who will click it.
 * `PUBLIC_APP_URL` is therefore explicit, with Vercel's own production-domain variable
 * as the fallback so a managed deployment usually needs no configuration at all.
 *
 * Vercel's `VERCEL_URL` is deliberately not used: it names the individual deployment,
 * so a link built from it would point at a preview build rather than at production.
 */
export function appUrl(): string | null {
  const explicit = process.env.PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return production ? `https://${production.replace(/\/+$/, '')}` : null;
}

/** The organisation's name as configured in Settings, falling back to the default. */
export async function orgName(): Promise<string> {
  try {
    const settings = await prisma.orgSettings.findUnique({ where: { id: 'org' } });
    return settings?.orgName?.trim() || 'Seplat Energy Plc';
  } catch {
    // An alert is worth sending with a generic name; it is not worth failing over one.
    return 'Seplat Energy Plc';
  }
}
