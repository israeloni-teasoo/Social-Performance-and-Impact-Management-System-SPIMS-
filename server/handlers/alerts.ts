import { prisma } from '../lib/db';
import { buildPayload, deliver, testMention } from '../lib/media/alerts';
import { isAlertChannelKind } from '../lib/media/types';
import { appUrl, orgName } from '../lib/appIdentity';
import type { HandlerResult } from '../lib/types';

/**
 * Alert rules and delivery channels.
 *
 * Executive-only throughout, for the same reason the source list is: a rule decides
 * when people are interrupted, and a channel URL decides where Seplat's coverage is
 * posted. Both are administrative rather than editorial.
 */

/**
 * A webhook URL is a bearer credential — anyone holding it can post into that Teams or
 * Slack channel. It is therefore never returned to the browser. The host is enough to
 * tell two channels apart and to confirm the right workspace was configured, which is
 * all the screen needs it for.
 */
function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/…`;
  } catch {
    return '…';
  }
}

function serialiseRule(rule: { id: string; name: string; terms: string; active: boolean }) {
  return { id: rule.id, name: rule.name, terms: rule.terms, active: rule.active };
}

function serialiseChannel(channel: {
  id: string;
  name: string;
  kind: string;
  url: string;
  active: boolean;
  lastStatus: string | null;
  lastError: string | null;
  lastSentAt: Date | null;
}) {
  return {
    id: channel.id,
    name: channel.name,
    kind: channel.kind,
    urlMasked: maskUrl(channel.url),
    active: channel.active,
    lastStatus: channel.lastStatus,
    lastError: channel.lastError,
    lastSentAt: channel.lastSentAt ? channel.lastSentAt.toISOString() : null,
  };
}

/* -------------------------------------------------------------------- reads */

export async function listAlertConfigHandler(): Promise<HandlerResult> {
  const [rules, channels] = await Promise.all([
    prisma.alertRule.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.alertChannel.findMany({ orderBy: { createdAt: 'asc' } }),
  ]);
  return {
    status: 200,
    body: {
      rules: rules.map(serialiseRule),
      channels: channels.map(serialiseChannel),
      // Without this the alert can only say "go and look", which is markedly less
      // useful, so the screen tells the operator it is unset rather than leaving them
      // to wonder why the button is missing from the message.
      appUrlConfigured: appUrl() !== null,
    },
  };
}

/* ------------------------------------------------------------------- rules */

export async function createAlertRuleHandler(input: { name?: unknown; terms?: unknown }): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const terms = typeof input.terms === 'string' ? input.terms.trim() : '';

  if (!name) return { status: 400, body: { error: 'A name is required — it is what the alert says it matched.' } };
  if (!terms) return { status: 400, body: { error: 'At least one term is required.' } };

  const existing = await prisma.alertRule.findFirst({ where: { name } });
  if (existing) return { status: 409, body: { error: 'A rule with that name already exists.' } };

  const rule = await prisma.alertRule.create({ data: { name, terms } });
  return { status: 201, body: serialiseRule(rule) };
}

export async function setAlertRuleActiveHandler(input: { id?: unknown; active?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule) return { status: 404, body: { error: 'No such rule.' } };

  const updated = await prisma.alertRule.update({ where: { id }, data: { active: Boolean(input.active) } });
  return { status: 200, body: serialiseRule(updated) };
}

export async function deleteAlertRuleHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule) return { status: 404, body: { error: 'No such rule.' } };

  await prisma.alertRule.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}

/* ---------------------------------------------------------------- channels */

export async function createAlertChannelHandler(input: {
  name?: unknown;
  kind?: unknown;
  url?: unknown;
}): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const url = typeof input.url === 'string' ? input.url.trim() : '';
  const kind = input.kind;

  if (!name) return { status: 400, body: { error: 'A name is required.' } };
  if (!isAlertChannelKind(kind)) return { status: 400, body: { error: 'kind must be teams, slack or webhook.' } };
  if (!url) return { status: 400, body: { error: 'A webhook URL is required.' } };

  // https only. The payload names the coverage Seplat is watching for and the URL is
  // itself a credential, and neither belongs on an unencrypted request.
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return { status: 400, body: { error: 'The webhook URL must be https.' } };
    }
  } catch {
    return { status: 400, body: { error: 'That is not a valid URL.' } };
  }

  const existing = await prisma.alertChannel.findFirst({ where: { url } });
  if (existing) return { status: 409, body: { error: 'That webhook is already configured.' } };

  const channel = await prisma.alertChannel.create({ data: { name, kind, url } });
  return { status: 201, body: serialiseChannel(channel) };
}

export async function deleteAlertChannelHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const channel = await prisma.alertChannel.findUnique({ where: { id } });
  if (!channel) return { status: 404, body: { error: 'No such channel.' } };

  await prisma.alertChannel.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}

/**
 * Sends one example alert.
 *
 * It goes through the same builder as a real alert, because a test that posts a
 * different shape proves only that the URL exists. The outcome is recorded against the
 * channel exactly as a real delivery would be, so a test and a live failure look the
 * same on the screen.
 */
export async function testAlertChannelHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const channel = await prisma.alertChannel.findUnique({ where: { id } });
  if (!channel) return { status: 404, body: { error: 'No such channel.' } };

  const outcome = await deliver(
    { id: channel.id, name: channel.name, kind: channel.kind, url: channel.url },
    buildPayload(channel.kind, [testMention()], await orgName(), appUrl()),
  );

  const updated = await prisma.alertChannel.update({
    where: { id },
    data: {
      lastStatus: outcome.ok ? 'ok' : 'failed',
      lastError: outcome.ok ? null : outcome.error ?? 'Unknown error',
      lastSentAt: new Date(),
    },
  });

  return {
    // A webhook that rejected the message has not been tested successfully, and must
    // not answer 200 to a caller that only checks the status code.
    status: outcome.ok ? 200 : 502,
    body: { ok: outcome.ok, error: outcome.error ?? null, channel: serialiseChannel(updated) },
  };
}
