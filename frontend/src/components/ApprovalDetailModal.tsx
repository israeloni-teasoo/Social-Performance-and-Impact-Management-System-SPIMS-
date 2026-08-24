import { useRef } from 'react';
import { APPROVAL_TYPE_COLORS } from '../ui';
import type { Approval } from '../types';

export function ApprovalDetailModal({
  approval,
  onClose,
  onApprove,
  onReturn,
  onComment,
}: {
  approval: Approval;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReturn: (id: string) => void;
  onComment: (id: string, text: string) => void;
}) {
  const [typeBg, typeFg] = APPROVAL_TYPE_COLORS[approval.type] ?? ['#eee', '#555'];
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const submitComment = () => {
    const text = commentRef.current?.value.trim();
    if (!text) return;
    onComment(approval.id, text);
    if (commentRef.current) commentRef.current.value = '';
  };

  return (
    <div className="spims-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(17,28,85,0.5)' }} />
      <div
        className="spims-scroll spims-modal-card"
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 18,
          maxWidth: 640,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 30px 80px -20px rgba(0,0,0,0.55)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px 28px 18px',
            borderBottom: '1px solid var(--line)',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}
        >
          <div>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6, background: typeBg, color: typeFg }}>
              {approval.type}
            </span>
            <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.25, marginTop: 10 }}>{approval.item}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
              {approval.project} · submitted by {approval.who} · {approval.when}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ fontFamily: 'inherit', fontSize: 22, lineHeight: 1, color: 'var(--muted)', background: 'var(--bg)', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '22px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>What was submitted</div>
          <ul style={{ margin: '0 0 24px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approval.details.map((d, i) => (
              <li key={i} style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>
                {d}
              </li>
            ))}
          </ul>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => onReturn(approval.id)}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: 'var(--muted)', background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}
            >
              Return for revision
            </button>
            <button
              onClick={() => onApprove(approval.id)}
              style={{ flex: 1, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#fff', background: '#1F8A5B', border: 'none', borderRadius: 10, padding: '12px 16px', cursor: 'pointer' }}
            >
              Approve
            </button>
          </div>

          <div style={{ paddingTop: 12, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>
              Comments {approval.comments.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({approval.comments.length})</span>}
            </div>
            {approval.comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {approval.comments.map((c) => (
                  <div key={c.id} style={{ background: 'var(--bg)', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--navy)' }}>{c.author}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.createdAt}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={commentRef}
              rows={3}
              placeholder="Leave a comment for the field officer — e.g. ask a follow-up question before deciding."
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 13.5, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)', resize: 'vertical', marginBottom: 10 }}
            />
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={submitComment}
                style={{ fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: 'pointer' }}
              >
                Post comment →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
