import { useMemo, useState } from 'react';
import { CATEGORY_LABELS, CHANNEL_KIND_HINTS, CHANNEL_KIND_LABELS, SOURCE_KIND_LABELS } from '../mentionsCopy';
import { card, h1, pill, primaryBtn, subtitle } from '../ui';
import { useAlertsStore } from '../useAlertsStore';
import { useMentionsStore } from '../useMentionsStore';
import type { AlertChannelKind, MentionCategory, MentionSourceKind, MentionStatus, Project, Role } from '../types';
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

/**
 * How long ago, in words.
 *
 * The queue refreshes itself, so the useful question on screen is no longer "what does
 * this say" but "how current is it". A clock time would make the reader do that
 * subtraction themselves.
 */
function ago(at: Date | null): string {
  if (!at) return '';
  const seconds = Math.max(0, Math.round((Date.now() - at.getTime()) / 1000));
  if (seconds < 75) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
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
  const [showAlerts, setShowAlerts] = useState(false);

  const canReview = role === 'exec' || role === 'relations';
  const canManageSources = role === 'exec';

  const newIds = useMemo(() => new Set(store.newIds), [store.newIds]);

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
              onClick={() => setShowAlerts((v) => !v)}
              style={{ fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 9, background: '#fff', border: '1px solid var(--line)', color: 'var(--navy)', cursor: 'pointer' }}
            >
              {showAlerts ? 'Hide alerts' : 'Alerts'}
            </button>
          )}
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

      {/*
        The queue refreshes itself while it is open, so an arrival during a meeting is
        on screen by the end of it. Without this marker a new item would simply appear
        in a list somebody had already read past, which is how a flagged story gets
        missed.
      */}
      {store.newIds.length > 0 && (
        <div
          style={{
            ...card,
            marginBottom: 12,
            padding: '10px 14px',
            borderLeft: '3px solid #006B42',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#006B42' }}>
            {store.newIds.length} new since you opened this
          </span>
          <button
            onClick={store.markSeen}
            style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: '#fff', border: '1px solid var(--line)', color: 'var(--navy)', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}

      {lastRun && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
          Last checked {when(lastRun.startedAt)} — {lastRun.found} found, {lastRun.added} new, {lastRun.duplicates} already
          seen.
          {store.live && store.checkedAt && <span> This screen updated {ago(store.checkedAt)}.</span>}
          {failedSources.length > 0 && (
            <span style={{ color: '#B7400E', fontWeight: 600 }}>
              {' '}
              {failedSources.length} source(s) failed: {failedSources.map((f) => `${f.source} — ${f.error ?? 'error'}`).join('; ')}
            </span>
          )}
        </div>
      )}

      {showAlerts && canManageSources && <AlertPanel pushToast={pushToast} />}
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
            isNew={newIds.has(m.id)}
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
  isNew,
  onReview,
}: {
  mention: ReturnType<typeof useMentionsStore>['feed']['mentions'][number];
  projects: Project[];
  canReview: boolean;
  isNew: boolean;
  onReview: (status: MentionStatus, category: MentionCategory | null, projectCode: string | null) => void;
}) {
  const [category, setCategory] = useState<MentionCategory>((mention.category as MentionCategory) ?? 'socialInvestment');
  const [projectCode, setProjectCode] = useState(mention.projectCode ?? '');

  const flagged = mention.flags.length > 0;

  return (
    <div
      style={{
        ...card,
        marginBottom: 12,
        // A flagged item is marked in the queue as well as in the alert, so someone who
        // never saw the alert still sees why it mattered.
        ...(flagged ? { borderLeft: '3px solid #EA5B1A' } : {}),
      }}
    >
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        {isNew && <span style={{ ...pill, background: '#006B42', color: '#fff' }}>New</span>}
        {mention.flags.map((flag) => (
          <span key={flag} style={{ ...pill, background: '#FBE4D7', color: '#B7400E' }}>
            {flag}
          </span>
        ))}
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

/**
 * What is worth interrupting someone for, and where that interruption goes.
 *
 * Executive only, like the source list, and for a related reason: a rule decides when
 * people are pulled out of what they are doing, and a channel URL decides where
 * Seplat's coverage is posted.
 *
 * The panel is deliberately blunt about the two ways this feature fails quietly — a
 * webhook that has stopped accepting messages, and a rule so broad that everything
 * matches it and people stop reading the alerts.
 */
function AlertPanel({ pushToast }: { pushToast: (message: string, tone?: ToastTone) => void }) {
  const alerts = useAlertsStore(pushToast);
  const [ruleName, setRuleName] = useState('');
  const [ruleTerms, setRuleTerms] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelKind, setChannelKind] = useState<AlertChannelKind>('teams');
  const [channelUrl, setChannelUrl] = useState('');

  if (!alerts.live) {
    return (
      <div style={{ ...card, marginBottom: 18 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Alerts</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Alerts are sent by the server when it collects, so there is nothing to configure in this demo build. Connect
          the API to set up a watchlist.
        </div>
      </div>
    );
  }

  const submitRule = () => {
    if (!ruleName.trim() || !ruleTerms.trim()) return;
    void alerts.addRule(ruleName.trim(), ruleTerms.trim());
    setRuleName('');
    setRuleTerms('');
  };

  const submitChannel = () => {
    if (!channelName.trim() || !channelUrl.trim()) return;
    void alerts.addChannel(channelName.trim(), channelKind, channelUrl.trim());
    setChannelName('');
    setChannelUrl('');
  };

  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Alerts</div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
        A mention that matches a rule is posted to every channel below, once, when it is collected. Everything else
        still arrives in the queue — rules decide what is urgent, not what is collected. Keep them narrow: a rule that
        matches most coverage teaches people to ignore the alerts.
      </div>

      {/* ---- Rules ---- */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#006B42', marginBottom: 6 }}>Watch for</div>
      {alerts.config.rules.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', paddingBottom: 8 }}>
          No rules yet, so nothing is alerted on.
        </div>
      )}
      {alerts.config.rules.map((rule) => (
        <div key={rule.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ ...pill, background: rule.active ? '#FBE4D7' : '#eee', color: rule.active ? '#B7400E' : 'var(--muted)' }}>
            {rule.name}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--muted)', flex: 1, wordBreak: 'break-word' }}>
            {rule.terms.split(/[\n,]/).map((t) => t.trim()).filter(Boolean).join(' · ')}
          </span>
          <button
            onClick={() => void alerts.setRuleActive(rule.id, !rule.active)}
            style={smallBtn}
          >
            {rule.active ? 'Pause' : 'Resume'}
          </button>
          <button onClick={() => void alerts.removeRule(rule.id)} style={{ ...smallBtn, color: '#B7400E' }}>
            Remove
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Rule name, e.g. Community unrest" style={inputStyle} />
        <input
          value={ruleTerms}
          onChange={(e) => setRuleTerms(e.target.value)}
          placeholder="Terms, comma separated"
          style={{ ...inputStyle, minWidth: 260 }}
        />
        <button onClick={submitRule} style={{ ...primaryBtn, padding: '8px 16px', fontSize: 12.5 }}>
          Add rule
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
        Matching ignores case and picks up endings, so <strong>spill</strong> also matches spills and spillage. It will
        not match inside another word, so it will not fire on “boiling”.
      </div>

      {/* ---- Channels ---- */}
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#006B42', marginTop: 22, marginBottom: 6 }}>Send to</div>
      {alerts.config.rules.length > 0 && alerts.config.channels.length === 0 && (
        <div style={{ fontSize: 12.5, color: '#B7400E', fontWeight: 600, paddingBottom: 8 }}>
          Rules are set but there is nowhere to send an alert. Matches will be marked in the queue and nobody will be
          told.
        </div>
      )}
      {alerts.config.channels.map((channel) => (
        <div key={channel.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ ...pill, background: '#E0F0D5', color: '#006B42' }}>
            {CHANNEL_KIND_LABELS[channel.kind] ?? channel.kind}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{channel.name}</span>
          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{channel.urlMasked}</span>

          {/* A webhook that has quietly stopped working is the main way this feature
              fails, so its last outcome is on the screen rather than in a log. */}
          {channel.lastStatus === 'failed' ? (
            <span style={{ fontSize: 11.5, color: '#B7400E', fontWeight: 600, flex: 1 }}>
              Last attempt failed — {channel.lastError ?? 'no reason given'}
            </span>
          ) : (
            <span style={{ fontSize: 11.5, color: 'var(--muted)', flex: 1 }}>
              {channel.lastSentAt ? `Last delivered ${when(channel.lastSentAt)}` : 'Not used yet'}
            </span>
          )}

          <button
            onClick={() => void alerts.testChannel(channel.id)}
            disabled={alerts.testing === channel.id}
            style={{ ...smallBtn, opacity: alerts.testing === channel.id ? 0.6 : 1 }}
          >
            {alerts.testing === channel.id ? 'Sending…' : 'Send a test'}
          </button>
          <button onClick={() => void alerts.removeChannel(channel.id)} style={{ ...smallBtn, color: '#B7400E' }}>
            Remove
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="Channel name" style={inputStyle} />
        <select
          value={channelKind}
          onChange={(e) => setChannelKind(e.target.value as AlertChannelKind)}
          style={selectStyle}
          aria-label="Channel type"
        >
          {Object.entries(CHANNEL_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="Webhook URL (https)"
          style={{ ...inputStyle, minWidth: 260 }}
        />
        <button onClick={submitChannel} style={{ ...primaryBtn, padding: '8px 16px', fontSize: 12.5 }}>
          Add channel
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
        {CHANNEL_KIND_HINTS[channelKind]} The URL is a credential — anyone holding it can post into that channel — so it
        is stored on the server and never shown again here.
        {!alerts.config.appUrlConfigured && (
          <>
            {' '}
            Alerts will carry no link back to SPIMS until <strong>PUBLIC_APP_URL</strong> is set on the server.
          </>
        )}
      </div>
    </div>
  );
}

const smallBtn: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  background: '#fff',
  border: '1px solid var(--line)',
  color: 'var(--navy)',
  cursor: 'pointer',
};
