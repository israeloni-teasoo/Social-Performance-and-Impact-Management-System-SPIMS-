import { prisma } from '../lib/db';
import { appUrl, orgName } from '../lib/appIdentity';
import { deliverAll, flagMentions } from '../lib/media/alerts';
import { fetchAll } from '../lib/media/fetch';
import { normaliseUrl } from '../lib/media/parse';
import { isSourceKind } from '../lib/media/types';
import type { DeliveryOutcome, FlaggableMention } from '../lib/media/alerts';
import type { HandlerResult } from '../lib/types';
import type { User } from '@prisma/client';

/**
 * Media and web mention monitoring — phase one.
 *
 * Covers press and web only. The major social platforms release mention data solely
 * through licensed partners, so hashtag and social tracking needs a paid provider and
 * is not built. That limitation is carried in the API response and shown in the
 * interface, not left in a document nobody reads: a queue labelled "mentions" that
 * silently omits every tweet would misrepresent Seplat's coverage.
 *
 * A mention is never a reported figure. It is evidence that somebody published
 * something, which is a different kind of claim from the counted figures in the
 * analytics layer, and the two are deliberately not mixed.
 */

const STATUSES = ['pending', 'accepted', 'rejected'];
const CATEGORIES = ['socialInvestment', 'corporate', 'unrelated'];

/** Stated wherever mentions are served, so the gap travels with the data. */
export const COVERAGE_NOTE =
  'Press and web sources only. Social media and hashtag tracking need a paid data provider and are not included.';

function serialise(mention: {
  id: string;
  url: string;
  title: string;
  publisher: string;
  snippet: string;
  language: string;
  country: string;
  publishedAt: Date | null;
  status: string;
  category: string | null;
  projectCode: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  flags: string | null;
  createdAt: Date;
  source?: { name: string; kind: string } | null;
}) {
  return {
    id: mention.id,
    url: mention.url,
    title: mention.title,
    publisher: mention.publisher,
    snippet: mention.snippet,
    language: mention.language,
    country: mention.country,
    publishedAt: mention.publishedAt ? mention.publishedAt.toISOString() : null,
    status: mention.status,
    category: mention.category,
    projectCode: mention.projectCode,
    reviewedBy: mention.reviewedBy,
    reviewedAt: mention.reviewedAt ? mention.reviewedAt.toISOString() : null,
    // The rules this matched when it arrived, so the queue shows why it was urgent
    // rather than only the alert knowing.
    flags: mention.flags ? mention.flags.split(',').map((f) => f.trim()).filter(Boolean) : [],
    foundAt: mention.createdAt.toISOString(),
    sourceName: mention.source?.name ?? '',
    sourceKind: mention.source?.kind ?? '',
  };
}

/* -------------------------------------------------------------------- reads */

export async function listMentionsHandler(query: { status?: unknown }): Promise<HandlerResult> {
  const status = typeof query.status === 'string' && STATUSES.includes(query.status) ? query.status : undefined;

  const [mentions, lastRun, sources] = await Promise.all([
    prisma.mention.findMany({
      where: status ? { status } : undefined,
      include: { source: { select: { name: true, kind: true } } },
      // Newest first. Postgres sorts NULLs first on a descending sort, which would put
      // every undated item at the top of the queue — the opposite of useful — so they
      // are pushed to the end and ordered by when we found them instead.
      orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: 500,
    }),
    prisma.mentionRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.mentionSource.count({ where: { active: true } }),
  ]);

  const counts = await prisma.mention.groupBy({ by: ['status'], _count: { _all: true } });

  return {
    status: 200,
    body: {
      coverageNote: COVERAGE_NOTE,
      activeSources: sources,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
      lastRun: lastRun
        ? {
            startedAt: lastRun.startedAt.toISOString(),
            status: lastRun.status,
            found: lastRun.found,
            added: lastRun.added,
            duplicates: lastRun.duplicates,
            detail: lastRun.detail,
          }
        : null,
      mentions: mentions.map(serialise),
    },
  };
}

export async function listMentionSourcesHandler(): Promise<HandlerResult> {
  const sources = await prisma.mentionSource.findMany({ orderBy: { createdAt: 'asc' } });
  return {
    status: 200,
    body: sources.map((s) => ({ id: s.id, name: s.name, kind: s.kind, target: s.target, active: s.active })),
  };
}

/* ------------------------------------------------------------------- writes */

export async function createMentionSourceHandler(input: {
  name?: unknown;
  kind?: unknown;
  target?: unknown;
}): Promise<HandlerResult> {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const target = typeof input.target === 'string' ? input.target.trim() : '';
  const kind = input.kind;

  if (!name) return { status: 400, body: { error: 'A name is required.' } };
  if (!isSourceKind(kind)) return { status: 400, body: { error: 'kind must be gdelt, rss or googleAlerts.' } };
  if (!target) return { status: 400, body: { error: 'A query or feed URL is required.' } };

  // A feed source must be a URL we can actually fetch. Rejected here rather than
  // discovered as a failed source on the first run.
  if (kind !== 'gdelt') {
    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('scheme');
    } catch {
      return { status: 400, body: { error: 'That feed address is not a valid http(s) URL.' } };
    }
  }

  const existing = await prisma.mentionSource.findFirst({ where: { kind, target } });
  if (existing) return { status: 409, body: { error: 'That source is already configured.' } };

  const source = await prisma.mentionSource.create({ data: { name, kind, target } });
  return { status: 201, body: { id: source.id, name: source.name, kind: source.kind, target: source.target, active: source.active } };
}

export async function setMentionSourceActiveHandler(input: { id?: unknown; active?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const source = await prisma.mentionSource.findUnique({ where: { id } });
  if (!source) return { status: 404, body: { error: 'No such source.' } };

  const updated = await prisma.mentionSource.update({ where: { id }, data: { active: Boolean(input.active) } });
  return { status: 200, body: { id: updated.id, active: updated.active } };
}

export async function deleteMentionSourceHandler(input: { id?: unknown }): Promise<HandlerResult> {
  const id = typeof input.id === 'string' ? input.id : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  const source = await prisma.mentionSource.findUnique({ where: { id } });
  if (!source) return { status: 404, body: { error: 'No such source.' } };

  await prisma.mentionSource.delete({ where: { id } });
  return { status: 200, body: { ok: true } };
}

/**
 * Records a reviewer's decision.
 *
 * Review is the whole point of the queue: an automated search for "Seplat" returns
 * share-price notes and unrelated companies alongside genuine social-investment
 * coverage, and nothing here is fit to quote until a person has said which is which.
 * A decision is therefore always attributed.
 */
export async function reviewMentionHandler(
  input: { id?: unknown; status?: unknown; category?: unknown; projectCode?: unknown },
  reviewer: User | null,
): Promise<HandlerResult> {
  if (!reviewer) return { status: 401, body: { error: 'Not signed in.' } };

  const id = typeof input.id === 'string' ? input.id : '';
  const status = typeof input.status === 'string' ? input.status : '';
  if (!id) return { status: 400, body: { error: 'id is required.' } };
  if (!STATUSES.includes(status)) return { status: 400, body: { error: 'status must be pending, accepted or rejected.' } };

  const category =
    typeof input.category === 'string' && CATEGORIES.includes(input.category) ? input.category : null;
  const projectCode = typeof input.projectCode === 'string' && input.projectCode.trim() ? input.projectCode.trim() : null;

  const mention = await prisma.mention.findUnique({ where: { id } });
  if (!mention) return { status: 404, body: { error: 'No such mention.' } };

  if (projectCode) {
    const project = await prisma.project.findUnique({ where: { code: projectCode } });
    if (!project) return { status: 400, body: { error: `No programme with code ${projectCode}.` } };
  }

  const updated = await prisma.mention.update({
    where: { id },
    data: {
      status,
      category,
      projectCode,
      // Returning something to the queue clears the attribution too, so a pending item
      // never carries a stale reviewer's name.
      reviewedBy: status === 'pending' ? null : reviewer.name,
      reviewedAt: status === 'pending' ? null : new Date(),
    },
    include: { source: { select: { name: true, kind: true } } },
  });

  return { status: 200, body: serialise(updated) };
}

/* ---------------------------------------------------------------- ingestion */

/**
 * Fetches every active source and stores what is new.
 *
 * De-duplication happens twice and for different reasons: within a run, because the
 * same story arrives from several sources; and against the database, because a run
 * overlaps the previous one by design. Overlapping is deliberate — a gap would lose
 * coverage silently, whereas an overlap costs nothing once duplicates are dropped.
 *
 * A run never throws. A source that fails is reported as failed, with its error, and
 * the others still land.
 */
export async function runMentionIngestionHandler(): Promise<HandlerResult> {
  const sources = await prisma.mentionSource.findMany({ where: { active: true } });
  if (sources.length === 0) {
    return {
      status: 400,
      body: { error: 'No active sources are configured, so there is nothing to fetch.' },
    };
  }

  const outcomes = await fetchAll(sources.map((s) => ({ id: s.id, name: s.name, kind: s.kind, target: s.target })));

  let found = 0;
  let added = 0;
  let duplicates = 0;
  const seenThisRun = new Set<string>();
  const created: FlaggableMention[] = [];

  for (const outcome of outcomes) {
    if (!outcome.ok) continue;
    for (const item of outcome.items) {
      found += 1;
      const url = normaliseUrl(item.url);
      if (seenThisRun.has(url)) {
        duplicates += 1;
        continue;
      }
      seenThisRun.add(url);

      try {
        const record = await prisma.mention.create({
          data: {
            sourceId: outcome.sourceId,
            url,
            title: item.title.slice(0, 500),
            publisher: item.publisher.slice(0, 200),
            snippet: item.snippet.slice(0, 1000),
            language: item.language.slice(0, 60),
            country: item.country.slice(0, 60),
            publishedAt: item.publishedAt,
          },
        });
        // Only what this run actually stored is a candidate for an alert. A duplicate
        // is a story somebody has already been told about.
        created.push({
          id: record.id,
          title: record.title,
          snippet: record.snippet,
          publisher: record.publisher,
          url: record.url,
          publishedAt: record.publishedAt,
        });
        added += 1;
      } catch {
        // The unique constraint on url is the de-duplication against previous runs;
        // hitting it is the expected path, not an error.
        duplicates += 1;
      }
    }
  }

  const failed = outcomes.filter((o) => !o.ok);
  const status = failed.length === 0 ? 'ok' : failed.length === outcomes.length ? 'failed' : 'partial';

  const detail = outcomes.map((o) => ({
    source: o.sourceName,
    ok: o.ok,
    items: o.items.length,
    ...(o.error ? { error: o.error } : {}),
  }));

  const alerts = await notifyFlagged(created);

  const run = await prisma.mentionRun.create({
    data: { status, detail, found, added, duplicates },
  });

  return {
    // A run in which every source failed is not a success, and must not look like one
    // to a caller that only checks the status code.
    status: status === 'failed' ? 502 : 200,
    body: {
      runId: run.id,
      status,
      found,
      added,
      duplicates,
      detail,
      alerts,
      coverageNote: COVERAGE_NOTE,
    },
  };
}

export interface AlertSummary {
  /** How many of this run's new mentions matched a rule. */
  flagged: number;
  /** How many channels the alert reached. */
  delivered: number;
  /** Channels that refused it, with the reason. */
  failed: { channel: string; error: string }[];
}

/**
 * Flags this run's new mentions and tells people about the ones that matter.
 *
 * Wrapped so that nothing here can fail a collection run. An alert that could not be
 * sent is a problem; a collection that threw away everything it fetched because a
 * webhook was down would be a much larger one, and the queue is what the system is
 * actually for.
 */
async function notifyFlagged(created: FlaggableMention[]): Promise<AlertSummary> {
  const empty: AlertSummary = { flagged: 0, delivered: 0, failed: [] };
  if (created.length === 0) return empty;

  try {
    const rules = await prisma.alertRule.findMany({ where: { active: true } });
    if (rules.length === 0) return empty;

    const flagged = flagMentions(created, rules);
    if (flagged.length === 0) return empty;

    // Recorded whether or not anything can be delivered, so the queue shows what was
    // urgent even on an installation with no channel configured.
    await Promise.all(
      flagged.map((m) => prisma.mention.update({ where: { id: m.id }, data: { flags: m.rules.join(', ') } })),
    );

    const ids = flagged.map((m) => m.id);
    const channels = await prisma.alertChannel.findMany({ where: { active: true } });

    if (channels.length === 0) {
      // Nothing to deliver to. Marked notified anyway: adding a channel next month
      // should not fire a month of alerts about stories that are by then old news.
      await prisma.mention.updateMany({ where: { id: { in: ids } }, data: { notifiedAt: new Date() } });
      return { flagged: flagged.length, delivered: 0, failed: [] };
    }

    const outcomes = await deliverAll(
      channels.map((c) => ({ id: c.id, name: c.name, kind: c.kind, url: c.url })),
      flagged,
      await orgName(),
      appUrl(),
    );

    // At-most-once: marked on the attempt, not on a confirmed delivery. See the note
    // at the top of lib/media/alerts.ts for why a retry is the worse failure.
    await prisma.mention.updateMany({ where: { id: { in: ids } }, data: { notifiedAt: new Date() } });
    await Promise.all(outcomes.map(recordDelivery));

    return {
      flagged: flagged.length,
      delivered: outcomes.filter((o) => o.ok).length,
      failed: outcomes.filter((o) => !o.ok).map((o) => ({ channel: o.channelName, error: o.error ?? 'Unknown error' })),
    };
  } catch {
    return empty;
  }
}

/** Writes one delivery outcome onto its channel, so a broken webhook is visible. */
async function recordDelivery(outcome: DeliveryOutcome): Promise<void> {
  await prisma.alertChannel
    .update({
      where: { id: outcome.channelId },
      data: {
        lastStatus: outcome.ok ? 'ok' : 'failed',
        lastError: outcome.ok ? null : outcome.error ?? 'Unknown error',
        lastSentAt: new Date(),
      },
    })
    .catch(() => {
      // The channel was deleted mid-run. Not worth failing anything over.
    });
}
