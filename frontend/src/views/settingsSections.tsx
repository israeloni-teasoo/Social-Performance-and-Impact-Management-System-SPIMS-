import { useState } from 'react';
import { InfoTip } from '../components/Tooltip';
import { formField, input, label as labelStyle, pill, primaryBtn, secondaryBtn, sectionCardTitle } from '../ui';
import { changeOwnPassword, useUsersStore } from '../useUsersStore';
import type { ManagedUser, Role } from '../types';
import type { ToastTone } from '../useToastQueue';

const ROLES: { value: Role; label: string }[] = [
  { value: 'exec', label: 'Executive' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'field', label: 'Field Officer' },
  { value: 'relations', label: 'Community Relations' },
];

const MIN_PASSWORD = 12;

const card = { background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 };

function UserRow({
  user,
  isSelf,
  onSetRole,
  onSetActive,
  onResetPassword,
}: {
  user: ManagedUser;
  isSelf: boolean;
  onSetRole: (id: string, role: Role) => void;
  onSetActive: (id: string, active: boolean) => void;
  onResetPassword: (id: string, password: string) => Promise<boolean>;
}) {
  const [resetting, setResetting] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submitReset = async () => {
    if (password.length < MIN_PASSWORD) {
      setError(`The password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    setError('');
    if (await onResetPassword(user.id, password)) {
      setPassword('');
      setResetting(false);
    }
  };

  return (
    <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--line)', opacity: user.active ? 1 : 0.62 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{user.name}</span>
            {isSelf && <span style={pill('rgba(43,76,155,0.12)', '#2B4C9B')}>You</span>}
            {!user.active && <span style={pill('rgba(138,141,166,0.16)', 'var(--muted)')}>Deactivated</span>}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {user.email} · added {user.createdAt}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={user.role}
            onChange={(e) => onSetRole(user.id, e.target.value as Role)}
            style={{ ...input, width: 'auto', padding: '7px 11px', fontSize: 12.5 }}
            aria-label={`Role for ${user.name}`}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <button onClick={() => setResetting((v) => !v)} style={{ ...secondaryBtn, padding: '7px 12px', fontSize: 12.5 }}>
            {resetting ? 'Cancel' : 'Reset password'}
          </button>
          <button
            onClick={() => onSetActive(user.id, !user.active)}
            style={{
              ...secondaryBtn,
              padding: '7px 12px',
              fontSize: 12.5,
              color: user.active ? 'var(--accent)' : '#1F8A5B',
              borderColor: user.active ? 'rgba(227,26,56,0.3)' : 'rgba(31,138,91,0.3)',
            }}
          >
            {user.active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>

      {resetting && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ ...formField, flex: '1 1 260px' }}>
            <label style={labelStyle}>New password for {user.name}</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`New password, at least ${MIN_PASSWORD} characters`}
              style={input}
            />
          </div>
          <button onClick={submitReset} style={primaryBtn}>
            Set password
          </button>
          {error && <div style={{ flex: '1 1 100%', fontSize: 12.5, color: 'var(--accent)' }}>{error}</div>}
          <span style={{ fontSize: 11.5, color: 'var(--muted)', flex: '1 1 100%' }}>
            Shown in plain text so you can copy it. Share it through a secure channel and ask them to change it once signed in.
          </span>
        </div>
      )}
    </div>
  );
}

export function ChangeOwnPasswordSection({ pushToast }: { pushToast: (message: string, tone?: ToastTone) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    if (await changeOwnPassword(current, next, pushToast)) {
      setCurrent('');
      setNext('');
    }
    setBusy(false);
  };

  return (
    <div style={card}>
      <div style={sectionCardTitle}>Change your own password</div>
      <div className="form-grid-3" style={{ alignItems: 'end' }}>
        <div style={formField}>
          <label style={labelStyle}>Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={input} autoComplete="current-password" />
        </div>
        <div style={formField}>
          <label style={labelStyle}>New password</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD} characters`}
            style={input}
            autoComplete="new-password"
            aria-label="New password for your own account"
          />
        </div>
        <button onClick={submit} disabled={busy || !current || next.length < MIN_PASSWORD} style={{ ...primaryBtn, opacity: busy || !current || next.length < MIN_PASSWORD ? 0.5 : 1 }}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </div>
  );
}

export function UserAccountsSection({
  currentUserId,
  pushToast,
}: {
  currentUserId: string;
  pushToast: (message: string, tone?: ToastTone) => void;
}) {
  const { users, loading, available, addUser, setRole, setActive, resetPassword } = useUsersStore(pushToast);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRoleValue] = useState<Role>('field');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const submitNew = async () => {
    // Validation failures used to return here silently, so the button appeared to do
    // nothing at all. Say which field is wrong instead.
    if (!name.trim()) return setFormError('Enter the person’s full name.');
    if (!email.trim() || !email.includes('@')) return setFormError('Enter a valid email address.');
    if (password.length < MIN_PASSWORD) return setFormError(`The initial password must be at least ${MIN_PASSWORD} characters.`);
    setFormError('');
    if (await addUser({ name, email, role, password })) {
      setName('');
      setEmail('');
      setPassword('');
      setRoleValue('field');
      setAdding(false);
    }
  };

  const activeExecutives = users.filter((u) => u.role === 'exec' && u.active).length;

  return (
    <div>
      {loading ? (
        <div style={{ ...card, color: 'var(--muted)', fontSize: 13.5 }}>Loading accounts…</div>
      ) : !available ? (
        <div style={{ ...card, color: 'var(--muted)', fontSize: 13.5 }}>
          Account administration needs the server, which this demo build has no connection to. On a real deployment this is where
          accounts are created, given a role, and deactivated.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
              {users.length} account{users.length === 1 ? '' : 's'}
              <InfoTip label="How accounts work" width={330}>
                Accounts are deactivated rather than deleted, because a person is referenced by the comments they wrote and the
                uploads they made, and that history has to survive them leaving. Deactivating someone signs them out immediately —
                their existing session stops working on its next request, not when it expires.
              </InfoTip>
            </div>
            {!adding && (
              <button onClick={() => setAdding(true)} style={primaryBtn}>
                Add an account →
              </button>
            )}
          </div>

          {adding && (
            <div style={card}>
              <div style={sectionCardTitle}>New account</div>
              <div className="form-grid-3" style={{ marginBottom: 14 }}>
                <div style={formField}>
                  <label style={labelStyle}>Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amaka Okonkwo" style={input} />
                </div>
                <div style={formField}>
                  <label style={labelStyle}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@seplat.com" style={input} />
                </div>
                <div style={formField}>
                  <label style={labelStyle}>Role</label>
                  <select value={role} onChange={(e) => setRoleValue(e.target.value as Role)} style={input}>
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ ...formField, flex: '1 1 280px' }}>
                  <label style={labelStyle}>Initial password</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Initial password, at least ${MIN_PASSWORD} characters`}
                    style={input}
                  />
                </div>
                <button onClick={submitNew} style={primaryBtn}>
                  Create account
                </button>
                <button onClick={() => { setAdding(false); setFormError(''); }} style={secondaryBtn}>
                  Cancel
                </button>
                {formError && <div style={{ flex: '1 1 100%', fontSize: 12.5, color: 'var(--accent)' }}>{formError}</div>}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onSetRole={setRole}
                onSetActive={setActive}
                onResetPassword={resetPassword}
              />
            ))}
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
            {activeExecutives === 1
              ? 'There is one active Executive. You cannot deactivate or demote the last one — promote another account first.'
              : `${activeExecutives} active Executives. Only an Executive can manage accounts.`}
          </p>
        </>
      )}
    </div>
  );
}
