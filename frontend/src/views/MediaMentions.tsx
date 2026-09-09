import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, SOURCE_KIND_LABELS } from '../mentionsCopy';
import { card, h1, pill, primaryBtn, subtitle } from '../ui';
import { useMentionsStore } from '../useMentionsStore';
import type { MentionCategory, MentionSourceKind, MentionStatus, Project, Role } from '../types';
import type { ToastTone } from '../useToastQueue';

/**
 * The media mention review queue.
 *
 * The review step is the feature, not an inconvenience attached to it. An automated
 * search for "Seplat" returns share-price notes, unrelated companies and syndicated
 * duplicates alongside genuine social-investment coverage. Nothing here is fit to
 * quote until a person has said which is which, so a mention arrives as pending and
 * stays there until somebody decides.
 */

const STATUS_TABS: { key: MentionStatus; label: string }[] = [
  { key: 'pending', label: 'To review' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
];

function when(iso: string | null): string {
  if (!iso) return 'undated';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function MediaMentions({
  projects,
  role,
  pushToast,
}: {
  projects: Project[];
  role: Role;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const store = useMentionsStore(pushToast);
  const [tab, setTab] = useState<MentionStatus>('pending');
  const [showSources, setShowSources] = useState(false);

  const canReview = role === 'exec' || role === 'relations';
  const canManageSources = role === 'exec';

  const shown = useMemo(
    () => store.feed.mentions.filter((m) => m.status === tab),
    [store.feed.mentions, tab],
  );

  const lastRun = store.feed.lastRun;
  const failedSources = lastRun?.detail.filter((d) => !d.ok) ?? [];

  return (
    <div>
      <h1 style={h1}>Media &amp; Web Mentions</h1>
      <p style={subtitle}>
        Coverage of Seplat found in the press and on the web, collected automatically and confirmed by a person before it
        counts as anything.
      </p>

      {/* The limitation travels with the data rather than living in a document. */}
      <div style={{ ...card, borderLeft: '3px solid #F8B006', marginBottom: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#006B42', marginBottom: 4 }}>What this covers</div>
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>
          {store.feed.coverageNote || 'Press and web sources only.'} Social platforms release mention data only through
          licensed partners, so that part needs a paid subscription and is not built.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '9px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              border: '1px solid var(--line)',
              background: tab === t.key ? '#006B42' : '#fff',
              color: tab === t.key ? '#fff' : 'var(--navy)',
            }}
          >
            {t.label} ({store.feed.counts[t.key] ?? 0})
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canManageSources && (
            <button
              onClick={() => setShowSources((v) => !v)}
              style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, background: '#fff', border: '1px solid var(--line)', color: 'var(--navy)', cursor: 'pointer' }}
            >
              {showSources ? 'Hide sources' : `Sources (${store.sources.filter((s) => s.active).length} active)`}
            </button>
          )}
          {canReview && (
            <button onClick={() => void store.runIngestion()} disabled={store.running} style={{ ...primaryBtn, opacity: store.running ? 0.6 : 1 }}>
              {store.running ? 'Checking…' : 'Check for new mentions →'}
            </button>
          )}
        </div>
      </div>

      {lastRun && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
          Last checked {when(lastRun.startedAt)} — {lastRun.found} found, {lastRun.added} new, {lastRun.duplicates} already
          seen.
          {failedSources.length > 0 && (
            <span style={{ color: '#B7400E', fontWeight: 600 }}>
              {' '}
              {failedSources.length} source(s) failed: {failedSources.map((f) => `${f.source} — ${f.error ?? 'error'}`).join('; ')}
            </span>
          )}
        </div>
      )}

      {showSources && canManageSources && <SourcePanel store={store} />}

      {shown.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
          {tab === 'pending'
            ? store.feed.activeSources === 0
              ? 'No sources are configured yet, so nothing has been collected.'
              : 'Nothing waiting to be reviewed.'
            : `No ${tab} mentions.`}
        </div>
      ) : (
        shown.map((m) => (
          <MentionCard
            key={m.id}
            mention={m}
            projects={projects}
            canReview={canReview}
            onReview={(status, category, projectCode) => void store.review(m.id, status, category, projectCode)}
          />
        ))
      )}
    </div>
  );
}

function MentionCard({
  mention,
  projects,
  canReview,
  onReview,
}: {
  mention: ReturnType<typeof useMentionsStore>['feed']['mentions'][number];
  projects: Project[];
  canReview: boolean;
  onReview: (status: MentionStatus, category: MentionCategory | null, projectCode: string | null) => void;
}) {
  const [category, setCategory] = useState<MentionCategory>((mention.category as MentionCategory) ?? 'socialInvestment');
  const [projectCode, setProjectCode] = useState(mention.projectCode ?? '');

  return (
    <div style={{ ...card, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ ...pill, background: '#E0F0D5', color: '#006B42' }}>{mention.publisher}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{when(mention.publishedAt)}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          via {SOURCE_KIND_LABELS[mention.sourceKind] ?? mention.sourceKind}
        </span>
        {mention.status !== 'pending' && mention.reviewedBy && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {mention.status === 'accepted' ? 'Accepted' : 'Rejected'} by {mention.reviewedBy}
            {mention.category ? ` · ${CATEGORY_LABELS[mention.category] ?? mention.category}` : ''}
            {mention.projectCode ? ` · ${mention.projectCode}` : ''}
          </span>
        )}
      </div>

      <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, lineHeight: 1.35 }}>
        {mention.title}
      </div>
      {mention.snippet && (
        <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5, marginBottom: 8 }}>{mention.snippet}</div>
      )}

      {/* The link is the evidence. A mention without one cannot be checked. */}
      <a
        href={mention.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ fontSize: 12.5, color: '#2B4C9B', wordBreak: 'break-all' }}
      >
        {mention.url}
      </a>

      {canReview && mention.status === 'pending' && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MentionCategory)}
            style={selectStyle}
            aria-label="What kind of mention is this"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select value={projectCode} onChange={(e) => setProjectCode(e.target.value)} style={selectStyle} aria-label="Which programme">
            <option value="">No specific programme</option>
            {projects.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => onReview('accepted', category, projectCode || null)}
            style={{ ...primaryBtn, padding: '8px 16px', fontSize: 12.5 }}
          >
            Accept
          </button>
          <button
            onClick={() => onReview('rejected', 'unrelated', null)}
            style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 16px', borderRadius: 8, background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            Reject
          </button>
        </div>
      )}

      {canReview && mention.status !== 'pending' && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => onReview('pending', null, null)}
            style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid var(--line)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            Return to the queue
          </button>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 12.5,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: '#fff',
  color: 'var(--navy)',
};

const inputStyle: React.CSSProperties = { ...selectStyle, minWidth: 180 };

/** Which sources are searched. Executive only: this decides what leaves the network. */
function SourcePanel({ store }: { store: ReturnType<typeof useMentionsStore> }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MentionSourceKind>('rss');
  const [target, setTarget] = useState('');

  const submit = () => {
    if (!name.trim() || !target.trim()) return;
    void store.addSource(name.trim(), kind, target.trim());
    setName('');
    setTarget('');
  };

  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Where SPIMS looks</div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Every check is made by this server, never by anyone’s browser, and sends only a search term — no Seplat data
        leaves with it. With no active source, nothing is contacted at all.
      </div>

      {store.sources.map((s) => (
        <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ ...pill, background: s.active ? '#E0F0D5' : '#eee', color: s.active ? '#006B42' : 'var(--muted)' }}>
            {SOURCE_KIND_LABELS[s.kind] ?? s.kind}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{s.name}</span>
          <span style={{ fontSize: 11.5, color: 'var(--muted)', wordBreak: 'break-all', flex: 1 }}>{s.target}</span>
          <button
            onClick={() => void store.setSourceActive(s.id, !s.active)}
            style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid var(--line)', color: 'var(--navy)', cursor: 'pointer' }}
          >
            {s.active ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={() => void store.removeSource(s.id)}
            style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: '#fff', border: '1px solid var(--line)', color: '#B7400E', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source name" style={inputStyle} />
        <select value={kind} onChange={(e) => setKind(e.target.value as MentionSourceKind)} style={selectStyle} aria-label="Source type">
          <option value="rss">News feed (RSS)</option>
          <option value="gdelt">GDELT search</option>
          <option value="googleAlerts">Google Alerts feed</option>
        </select>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={kind === 'gdelt' ? 'Search terms, e.g. "Seplat Energy"' : 'Feed address'}
          style={{ ...inputStyle, minWidth: 260 }}
        />
        <button onClick={submit} style={{ ...primaryBtn, padding: '8px 16px', fontSize: 12.5 }}>
          Add source
        </button>
      </div>
    </div>
  );
}
