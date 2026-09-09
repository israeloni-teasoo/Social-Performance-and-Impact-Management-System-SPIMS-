import { useEffect, useState } from 'react';
import { InfoTip } from '../components/Tooltip';
import { formField, h1, input, label as labelStyle, pill, primaryBtn, sectionCardTitle, subtitle } from '../ui';
import { ChangeOwnPasswordSection, UserAccountsSection } from './settingsSections';
import type { IntegrationStatus, OrgSettings } from '../types';
import type { ToastTone } from '../useToastQueue';

const card = { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 };

type Tab = 'organisation' | 'accounts' | 'yours' | 'system';

function OrganisationSection({
  settings,
  canEdit,
  onSave,
}: {
  settings: OrgSettings;
  canEdit: boolean;
  onSave: (next: OrgSettings) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<OrgSettings>(settings);
  const [busy, setBusy] = useState(false);

  // The stored settings arrive after the first render, so adopt them when they land.
  useEffect(() => setDraft(settings), [settings]);

  const set = <K extends keyof OrgSettings>(key: K, value: OrgSettings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setBusy(true);
    await onSave(draft);
    setBusy(false);
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sectionCardTitle }}>
        Organisation
        <InfoTip label="Where these appear" width={320}>
          The organisation name and financial year appear in the header, on the sign-in screen and in every export. The target year
          drives the dashboard’s progress-to-aspiration figure. Changing them here changes them everywhere.
        </InfoTip>
      </div>

      <div className="form-grid-3" style={{ marginBottom: 14 }}>
        <div style={formField}>
          <label style={labelStyle}>Organisation name</label>
          <input value={draft.orgName} onChange={(e) => set('orgName', e.target.value)} style={input} disabled={!canEdit} />
        </div>
        <div style={formField}>
          <label style={labelStyle}>Financial year</label>
          <input value={draft.financialYear} onChange={(e) => set('financialYear', e.target.value)} style={input} disabled={!canEdit} />
        </div>
        <div style={formField}>
          <label style={labelStyle}>Currency</label>
          <input value={draft.currencyLabel} onChange={(e) => set('currencyLabel', e.target.value)} style={input} disabled={!canEdit} />
        </div>
      </div>

      <div className="form-grid-3" style={{ marginBottom: 14, alignItems: 'end' }}>
        <div style={formField}>
          <label style={labelStyle}>Target year for the social aspiration</label>
          <input
            type="number"
            value={draft.targetYear}
            onChange={(e) => set('targetYear', Number(e.target.value))}
            style={input}
            disabled={!canEdit}
          />
        </div>
      </div>

      <div style={{ ...formField, marginBottom: 16 }}>
        <label style={labelStyle}>Data status note</label>
        <textarea
          value={draft.dataStatusNote}
          onChange={(e) => set('dataStatusNote', e.target.value)}
          rows={2}
          style={{ ...input, resize: 'vertical' }}
          disabled={!canEdit}
        />
        <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          Shown wherever figures are presented. Change it once this deployment holds verified data rather than samples.
        </span>
      </div>

      {canEdit ? (
        <button onClick={save} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save organisation settings'}
        </button>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Only an Executive can change these.</div>
      )}
    </div>
  );
}

function SystemSection({ status, live }: { status: IntegrationStatus | null; live: boolean }) {
  const Row = ({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'off' }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
      <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: tone === 'good' ? '#1F8A5B' : tone === 'off' ? 'var(--muted)' : 'var(--navy)',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...sectionCardTitle }}>
        System and integrations
        <InfoTip label="What this shows" width={320}>
          What this installation has connected. No key or secret is ever shown here — only whether one is configured.
        </InfoTip>
      </div>

      {!live || !status ? (
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          No server is connected, so there is nothing to report. On a real deployment this lists the database, the connected
          services and current record counts.
        </div>
      ) : (
        <div>
          <Row label="Database" value={`${status.database} · connected`} tone="good" />
          <Row
            label="Claude report generation"
            value={status.claudeConfigured ? 'Configured' : 'Not configured'}
            tone={status.claudeConfigured ? 'good' : 'off'}
          />
          <Row
            label="Media & social mention monitoring"
            value={status.mediaMonitoringConfigured ? 'Press and web · active' : 'No sources active'}
            tone="off"
          />
          <Row label="Projects on record" value={String(status.projects)} />
          <Row label="Active user accounts" value={String(status.activeUsers)} />
          <Row label="Bulk uploads received" value={String(status.uploads)} />
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
            Claude report generation is optional and off unless a key is configured. When it is on, compiled report content is sent
            to Anthropic’s API — see the technical specification, “Outbound data flows”.
          </div>
        </div>
      )}
    </div>
  );
}

export function Settings({
  currentUserId,
  canAdminister,
  settings,
  status,
  live,
  onSave,
  pushToast,
}: {
  currentUserId: string;
  canAdminister: boolean;
  settings: OrgSettings;
  status: IntegrationStatus | null;
  live: boolean;
  onSave: (next: OrgSettings) => Promise<boolean>;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const [tab, setTab] = useState<Tab>('organisation');

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'organisation', label: 'Organisation' },
    { id: 'accounts', label: 'User accounts', adminOnly: true },
    { id: 'yours', label: 'Your account' },
    { id: 'system', label: 'System' },
  ];
  const visible = tabs.filter((t) => !t.adminOnly || canAdminister);

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={h1}>Settings</h1>
      <p style={subtitle}>
        Organisation details, user accounts and what this installation has connected.
        {!canAdminister && ' Most settings are managed by an Executive.'}
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {visible.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 15px',
              borderRadius: 9,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: tab === t.id ? 'var(--navy)' : 'var(--line)',
              background: tab === t.id ? 'var(--navy)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--navy)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'organisation' && <OrganisationSection settings={settings} canEdit={canAdminister && live} onSave={onSave} />}
      {tab === 'accounts' && canAdminister && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
            User accounts
            <span style={pill('rgba(43,76,155,0.12)', '#2B4C9B')}>Executive only</span>
          </div>
          <UserAccountsSection currentUserId={currentUserId} pushToast={pushToast} />
        </>
      )}
      {tab === 'yours' && <ChangeOwnPasswordSection pushToast={pushToast} />}
      {tab === 'system' && <SystemSection status={status} live={live} />}
    </div>
  );
}
