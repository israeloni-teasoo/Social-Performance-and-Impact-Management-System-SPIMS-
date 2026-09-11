import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { isApiAvailable, loadLocal, saveLocal } from './apiMode';
import { MENTION_FEED, MENTION_SOURCES } from './data/mentionsSeed';
import type { Mention, MentionCategory, MentionFeed, MentionSource, MentionSourceKind, MentionStatus } from './types';
import type { ToastTone } from './useToastQueue';

const FEED_KEY = 'spims_mentions_v1';
const SOURCES_KEY = 'spims_mention_sources_v1';

/**
 * How often an open queue re-checks the server.
 *
 * Collection itself runs on a schedule; this is only about the screen not going stale
 * while somebody is watching it. Forty-five seconds is short enough that a mention
 * appearing during a meeting is visible by the end of it, and long enough that a tab
 * left open all day is a few hundred requests rather than tens of thousands — which
 * matters on a platform that bills by invocation.
 */
const POLL_MS = 45_000;

/**
 * Media mentions, dual-mode like every other store.
 *
 * One thing here is not like the others: **ingestion cannot work in demo mode.**
 * Fetching from GDELT and from news feeds happens on the server, deliberately, so that
 * no user's browser ever contacts an outside host. With no server there is nothing to
 * fetch with, and the honest thing is to say so rather than to fake a run and quietly
 * hand back the same seed data — which would make a broken deployment look like a
 * working one.
 */
export function useMentionsStore(onNotify: (message: string, tone?: ToastTone) => void) {
  const [feed, setFeed] = useState<MentionFeed>({ coverageNote: '', activeSources: 0, counts: {}, lastRun: null, mentions: [] });
  const [sources, setSources] = useState<MentionSource[]>([]);
  const [live, setLive] = useState(false);
  const [running, setRunning] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  /**
   * The mentions that were already here when this screen was opened.
   *
   * Held in a ref rather than in state because a poll must be able to compare against
   * it without that comparison itself causing a re-render and a new baseline.
   */
  const seenIds = useRef<Set<string> | null>(null);
  const [newIds, setNewIds] = useState<string[]>([]);

  /** True while a review is being saved, so a poll cannot overwrite it mid-flight. */
  const reviewing = useRef(false);

  const load = useCallback(async () => {
    const isLive = await isApiAvailable();
    setLive(isLive);
    if (isLive) {
      const [f, s] = await Promise.all([
        api.get<MentionFeed>('/api/mentions'),
        api.get<MentionSource[]>('/api/mentions/sources'),
      ]);
      setFeed(f);
      setSources(s);
      setCheckedAt(new Date());
      if (seenIds.current === null) {
        seenIds.current = new Set(f.mentions.map((m) => m.id));
      } else {
        const baseline = seenIds.current;
        setNewIds(f.mentions.filter((m) => !baseline.has(m.id)).map((m) => m.id));
      }
      return;
    }
    const local = loadLocal<MentionFeed>(FEED_KEY, MENTION_FEED);
    setFeed(local);
    setSources(loadLocal<MentionSource[]>(SOURCES_KEY, MENTION_SOURCES));
    seenIds.current ??= new Set(local.mentions.map((m) => m.id));
  }, []);

  useEffect(() => {
    load().catch(() => {
      setFeed(loadLocal<MentionFeed>(FEED_KEY, MENTION_FEED));
      setSources(loadLocal<MentionSource[]>(SOURCES_KEY, MENTION_SOURCES));
    });
  }, [load]);

  /**
   * Keeps an open queue current.
   *
   * Only when there is a server to ask — the demo build has nothing that could change
   * underneath it. Polling stops while the tab is hidden and resumes with an immediate
   * check when it comes back, because the answer is stale by then anyway and a
   * background tab polling all night is pure cost.
   */
  useEffect(() => {
    if (!live) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const poll = () => {
      // A manual run reloads when it finishes, and a review is mid-write: either way,
      // replacing the feed underneath them would lose the newer state.
      if (document.hidden || reviewing.current) return;
      load().catch(() => {
        // A failed poll is not worth a toast. The screen keeps what it has, and the
        // next poll — or the operator — will say so more usefully.
      });
    };

    const start = () => {
      if (timer === null) timer = setInterval(poll, POLL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        poll();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [live, load]);

  /** Resets the "new since you opened this" marker to the queue as it stands now. */
  const markSeen = useCallback(() => {
    seenIds.current = new Set(feed.mentions.map((m) => m.id));
    setNewIds([]);
  }, [feed.mentions]);

  /** Fetches every active source. Server-only, for the reason given above. */
  const runIngestion = async () => {
    if (!live) {
      onNotify(
        'Fetching runs on the server so no browser contacts an outside site, and this demo build has no server. Connect the API to collect mentions.',
        'warning',
      );
      return;
    }
    setRunning(true);
    onNotify('Checking the configured sources…', 'info');
    try {
      const result = await api.post<{
        status: string;
        added: number;
        duplicates: number;
        found: number;
        detail: { source: string; ok: boolean; error?: string }[];
        alerts?: { flagged: number; delivered: number; failed: { channel: string; error: string }[] };
      }>('/api/mentions/run', {});
      await load();
      const failed = result.detail.filter((d) => !d.ok);
      const alerts = result.alerts;
      const flaggedNote = alerts && alerts.flagged > 0 ? ` ${alerts.flagged} flagged.` : '';

      if (failed.length > 0) {
        // Naming the source that failed is the difference between a fixable problem
        // and a mysterious empty queue.
        onNotify(`${result.added} new. ${failed.length} source(s) failed: ${failed.map((f) => `${f.source} — ${f.error}`).join('; ')}`, 'warning');
      } else if (alerts && alerts.failed.length > 0) {
        // A flagged mention nobody was told about is the failure this whole feature
        // exists to prevent, so it outranks the ordinary success message.
        onNotify(
          `${result.added} new.${flaggedNote} Alert not delivered: ${alerts.failed.map((f) => `${f.channel} — ${f.error}`).join('; ')}`,
          'warning',
        );
      } else {
        onNotify(
          `${result.added} new mention${result.added === 1 ? '' : 's'}, ${result.duplicates} already seen.${flaggedNote}`,
          'success',
        );
      }
    } catch {
      // A run in which every source failed answers 502, which lands here.
      await load().catch(() => {});
      onNotify('Every source failed. Check the source list and this server’s outbound access.', 'warning');
    } finally {
      setRunning(false);
    }
  };

  const review = async (id: string, status: MentionStatus, category: MentionCategory | null, projectCode: string | null) => {
    reviewing.current = true;
    try {
      if (live) await api.post('/api/mentions/review', { id, status, category, projectCode });
      setFeed((current) => {
        const next: MentionFeed = {
          ...current,
          mentions: current.mentions.map((m) =>
            m.id === id ? { ...m, status, category, projectCode, reviewedAt: new Date().toISOString() } : m,
          ),
        };
        next.counts = countBy(next.mentions);
        if (!live) saveLocal(FEED_KEY, next);
        return next;
      });
    } catch {
      onNotify('Could not save that decision — try again.', 'warning');
    } finally {
      reviewing.current = false;
    }
  };

  const addSource = async (name: string, kind: MentionSourceKind, target: string) => {
    try {
      const created = live
        ? await api.post<MentionSource>('/api/mentions/sources', { name, kind, target })
        : { id: `src-${Date.now()}`, name, kind, target, active: true };
      setSources((list) => {
        const next = [...list, created];
        if (!live) saveLocal(SOURCES_KEY, next);
        return next;
      });
      onNotify(`Added ${name}.`, 'success');
    } catch (error) {
      onNotify(error instanceof Error && error.message ? error.message : 'Could not add that source.', 'warning');
    }
  };

  const setSourceActive = async (id: string, active: boolean) => {
    try {
      if (live) await api.post('/api/mentions/sources/active', { id, active });
      setSources((list) => {
        const next = list.map((s) => (s.id === id ? { ...s, active } : s));
        if (!live) saveLocal(SOURCES_KEY, next);
        return next;
      });
    } catch {
      onNotify('Could not change that source — try again.', 'warning');
    }
  };

  const removeSource = async (id: string) => {
    try {
      if (live) await api.post('/api/mentions/sources/delete', { id });
      setSources((list) => {
        const next = list.filter((s) => s.id !== id);
        if (!live) saveLocal(SOURCES_KEY, next);
        return next;
      });
      onNotify('Source removed.', 'success');
    } catch {
      onNotify('Could not remove that source — try again.', 'warning');
    }
  };

  return {
    feed,
    sources,
    live,
    running,
    checkedAt,
    newIds,
    markSeen,
    runIngestion,
    review,
    addSource,
    setSourceActive,
    removeSource,
    reload: load,
  };
}

function countBy(mentions: Mention[]): Partial<Record<MentionStatus, number>> {
  const counts: Partial<Record<MentionStatus, number>> = {};
  for (const m of mentions) counts[m.status] = (counts[m.status] ?? 0) + 1;
  return counts;
}
