import { useState } from 'react';
import { ApprovalDetailModal } from '../components/ApprovalDetailModal';
import { APPROVAL_TYPE_COLORS, h1 } from '../ui';
import type { Approval } from '../types';

export function Approvals({
  approvals,
  onApprove,
  onReturn,
  onComment,
}: {
  approvals: Approval[];
  onApprove: (id: string) => void;
  onReturn: (id: string) => void;
  onComment: (id: string, text: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = approvals.find((a) => a.id === openId) ?? null;

  const decide = (fn: (id: string) => void, id: string) => {
    fn(id);
    setOpenId(null);
  };

  return (
    <div>
      <h1 style={h1}>Approvals Queue</h1>
      <p style={{ fontSize: 14.5, color: 'var(--muted)', margin: '0 0 20px' }}>
        Field submissions waiting on your review. Click one to see what was submitted, leave a comment, then approve or return it.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {approvals.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '32px 22px', textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
            Nothing waiting on your review — the queue is clear.
          </div>
        )}
        {approvals.map((a) => {
          const [typeBg, typeFg] = APPROVAL_TYPE_COLORS[a.type] ?? ['#eee', '#555'];
          return (
            <button
              key={a.id}
              onClick={() => setOpenId(a.id)}
              className="rowh"
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  color: 'var(--navy)',
                  flexShrink: 0,
                }}
              >
                {a.who
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: typeBg,
                      color: typeFg,
                    }}
                  >
                    {a.type}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{a.item}</span>
                  {a.comments.length > 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{a.comments.length} comment{a.comments.length === 1 ? '' : 's'}</span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {a.project} · {a.who} · submitted {a.when}
                </div>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>View →</span>
            </button>
          );
        })}
      </div>

      {open && (
        <ApprovalDetailModal
          approval={open}
          onClose={() => setOpenId(null)}
          onApprove={(id) => decide(onApprove, id)}
          onReturn={(id) => decide(onReturn, id)}
          onComment={onComment}
        />
      )}
    </div>
  );
}
