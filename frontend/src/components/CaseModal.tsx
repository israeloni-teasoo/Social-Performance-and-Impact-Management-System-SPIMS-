import { useRef } from 'react';
import { GRIEVANCE_STATUS_COLORS, pill, SEVERITY_COLORS } from '../ui';
import type { Grievance, Role } from '../types';

export function CaseModal({
  grievance,
  role,
  onCloseModal,
  onAssign,
  onAddNote,
  onResolve,
  onCloseCase,
  onEscalate,
}: {
  grievance: Grievance;
  role: Role;
  onCloseModal: () => void;
  onAssign: (assignee: string) => void;
  onAddNote: (note: string) => void;
  onResolve: (resolution: string) => void;
  onCloseCase: (satisfaction: string) => void;
  onEscalate: () => void;
}) {
  const assignRef = useRef<HTMLSelectElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const resolutionRef = useRef<HTMLTextAreaElement>(null);
  const satisfactionRef = useRef<HTMLSelectElement>(null);

  const [sevBg, sevFg] = SEVERITY_COLORS[grievance.severity];
  const [stBg, stFg] = GRIEVANCE_STATUS_COLORS[grievance.status];
  const canHandle = role !== 'exec';

  return (
    <div className="spims-modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onCloseModal} style={{ position: 'absolute', inset: 0, background: 'rgba(17,28,85,0.5)' }}></div>
      <div
        className="spims-scroll spims-modal-card"
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 18,
          maxWidth: 800,
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
            <div style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--muted)', marginBottom: 6 }}>
              {grievance.ref} · {grievance.category}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.2 }}>{grievance.title}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <span style={pill(sevBg, sevFg)}>{grievance.severity} severity</span>
              <span style={pill(stBg, stFg)}>{grievance.status}</span>
            </div>
          </div>
          <button
            onClick={onCloseModal}
            style={{ fontFamily: 'inherit', fontSize: 22, lineHeight: 1, color: 'var(--muted)', background: 'var(--bg)', border: 'none', borderRadius: 10, width: 38, height: 38, cursor: 'pointer', flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '22px 28px' }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#2B4C9B', marginBottom: 8 }}>
                Raised by
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{grievance.raisedByName}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>
                {grievance.raisedByRole} · {grievance.raisedByCommunity}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.9 }}>
                <span style={{ color: 'var(--muted)' }}>Contact:</span> {grievance.raisedByContact}
                <br />
                <span style={{ color: 'var(--muted)' }}>Channel:</span> {grievance.channel}
                <br />
                <span style={{ color: 'var(--muted)' }}>Date raised:</span> {grievance.dateRaised}
              </div>
            </div>
            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
                Handled by
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{grievance.assignee || 'Unassigned'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12 }}>Community Relations</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.9 }}>
                <span style={{ color: 'var(--muted)' }}>Logged by:</span> {grievance.loggedBy}
                <br />
                <span style={{ color: 'var(--muted)' }}>SLA due:</span> {grievance.dueDate}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5, background: '#fbfbfd', border: '1px solid var(--line)', borderRadius: 12, padding: '16px 18px', marginBottom: 22 }}>
            {grievance.description}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
            Case history
          </div>
          <div style={{ marginBottom: 6 }}>
            {grievance.timeline.map((t) => (
              <div key={t.id} style={{ display: 'flex', gap: 14, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.4 }}>{t.action}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                    {t.actor} · {t.ts}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {canHandle && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              {grievance.status === 'Open' && !grievance.assignee && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Assign a handler to start investigation</div>
                  <div className="spims-modal-row">
                    <select ref={assignRef} style={{ fontFamily: 'inherit', fontSize: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)' }}>
                      <option>Blessing Aganbi · Community Relations</option>
                      <option>Peter Obiora · Community Liaison</option>
                      <option>Ngozi Uba · Stakeholder Manager</option>
                    </select>
                    <button
                      onClick={() => onAssign(assignRef.current?.value ?? '')}
                      style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#fff', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Assign &amp; start →
                    </button>
                  </div>
                </div>
              )}

              {grievance.status === 'Investigating' && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Add an investigation note</div>
                  <div className="spims-modal-row" style={{ marginBottom: 22 }}>
                    <input
                      ref={noteRef}
                      placeholder="e.g. Site visited; contractor to complete handover by Friday."
                      style={{ fontFamily: 'inherit', fontSize: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)' }}
                    />
                    <button
                      onClick={() => {
                        if (noteRef.current?.value.trim()) {
                          onAddNote(noteRef.current.value.trim());
                          noteRef.current.value = '';
                        }
                      }}
                      style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--navy)', background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 22px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Add note
                    </button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Resolve the case</div>
                  <textarea
                    ref={resolutionRef}
                    rows={2}
                    placeholder="Describe how the grievance was resolved with the community."
                    style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)', resize: 'vertical', marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      onClick={onEscalate}
                      style={{ fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#C0491E', background: '#fff', border: '1px solid #F0D3C4', borderRadius: 10, padding: '11px 20px', cursor: 'pointer' }}
                    >
                      Escalate
                    </button>
                    <button
                      onClick={() => onResolve(resolutionRef.current?.value.trim() || 'Resolved with the community.')}
                      style={{ fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, color: '#fff', background: '#1F8A5B', border: 'none', borderRadius: 10, padding: '11px 24px', cursor: 'pointer' }}
                    >
                      Mark resolved ✓
                    </button>
                  </div>
                </div>
              )}

              {grievance.status === 'Resolved' && (
                <div>
                  <div style={{ background: 'rgba(31,138,91,0.08)', border: '1px solid rgba(31,138,91,0.25)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1F8A5B', marginBottom: 4 }}>
                      Resolution
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.45 }}>{grievance.resolution}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginBottom: 12 }}>Close the case with a satisfaction rating</div>
                  <div className="spims-modal-row">
                    <select ref={satisfactionRef} style={{ fontFamily: 'inherit', fontSize: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)' }}>
                      <option>Very satisfied</option>
                      <option>Satisfied</option>
                      <option>Neutral</option>
                      <option>Dissatisfied</option>
                    </select>
                    <button
                      onClick={() => onCloseCase(satisfactionRef.current?.value ?? 'Satisfied')}
                      style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: '#fff', background: 'var(--navy)', border: 'none', borderRadius: 10, padding: '12px 24px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Close case
                    </button>
                  </div>
                </div>
              )}

              {grievance.status === 'Closed' && (
                <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B6E88', marginBottom: 6 }}>
                    Case closed
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{grievance.resolution}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>
                    Community satisfaction: <strong style={{ color: 'var(--navy)' }}>{grievance.satisfaction}</strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
