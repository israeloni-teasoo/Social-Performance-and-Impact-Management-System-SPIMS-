import { useRef, useState } from 'react';
import { DEMO_ACCOUNTS } from '../data/accounts';
import { input, primaryBtn } from '../ui';

export function Login({ onLogin }: { onLogin: (email: string, password: string) => boolean }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (email?: string, password?: string) => {
    const e = email ?? emailRef.current?.value ?? '';
    const p = password ?? passwordRef.current?.value ?? '';
    if (!onLogin(e, p)) {
      setError('Email or password not recognised. Try one of the demo accounts below.');
    }
  };

  const fillAndSubmit = (email: string, password: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = password;
    setError(null);
    submit(email, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        fontFamily: "'Poppins',sans-serif",
        padding: '32px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 920, display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 340px', background: '#fff', border: '1px solid var(--line)', borderRadius: 18, padding: '38px 34px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 19,
                color: '#fff',
              }}
            >
              S
            </div>
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)' }}>SPIMS</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Social Perf. &amp; Impact
              </div>
            </div>
          </div>

          <div style={{ fontSize: 21, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>Sign in</div>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 22px' }}>Seplat Energy Plc · Social Performance &amp; Impact Management System</p>

          <div
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Email</label>
              <input ref={emailRef} type="email" placeholder="you@seplat.com" style={input} autoComplete="username" />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)', display: 'block', marginBottom: 6 }}>Password</label>
              <input ref={passwordRef} type="password" placeholder="••••••••" style={input} autoComplete="current-password" />
            </div>

            {error && <div style={{ fontSize: 12.5, color: 'var(--accent)', marginTop: 8, marginBottom: 4 }}>{error}</div>}

            <button onClick={() => submit()} style={{ ...primaryBtn, width: '100%', marginTop: 16, padding: '13px 22px', fontSize: 14.5 }}>
              Sign in →
            </button>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', background: 'var(--navy)', borderRadius: 18, padding: '30px 30px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Demo accounts</div>
          <p style={{ fontSize: 12.5, color: '#9EA1C0', margin: '0 0 18px', lineHeight: 1.5 }}>
            This is a prototype — pick any role below to sign in instantly and see what that persona sees.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => fillAndSubmit(a.email, a.password)}
                style={{
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.name} · {a.roleLabel}</div>
                <div style={{ fontSize: 11.5, color: '#B9CBEB', marginTop: 3, fontFamily: 'monospace' }}>{a.email}</div>
                <div style={{ fontSize: 11.5, color: '#B9CBEB', fontFamily: 'monospace' }}>{a.password}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
