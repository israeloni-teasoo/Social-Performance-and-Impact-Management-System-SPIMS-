import { useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { formField, h1, input, label, pill, primaryBtn, secondaryBtn, subtitle } from '../ui';
import type { FieldTask, NewTaskInput, NewTeamMemberInput, Project, TeamMember } from '../types';

const STATUS_COLORS: Record<string, [string, string]> = {
  Active: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Invited: ['rgba(192,73,30,0.14)', '#C0491E'],
};

const TASK_STATUS_COLORS: Record<string, [string, string]> = {
  'Not started': ['rgba(138,141,166,0.18)', '#6B6E88'],
  'In progress': ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Done: ['rgba(31,138,91,0.14)', '#1F8A5B'],
};

export function Team({
  members,
  tasks,
  projects,
  onInvite,
  onAssignTask,
}: {
  members: TeamMember[];
  tasks: FieldTask[];
  projects: Project[];
  onInvite: (input: NewTeamMemberInput) => void;
  onAssignTask: (input: NewTaskInput) => void;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<HTMLSelectElement>(null);
  const dueRef = useRef<HTMLInputElement>(null);
  const assigneeRef = useRef<HTMLSelectElement>(null);

  const submitInvite = () => {
    if (!nameRef.current?.value.trim()) return;
    onInvite({
      name: nameRef.current.value,
      email: emailRef.current?.value ?? '',
      roleTitle: roleRef.current?.value ?? 'Field Officer',
    });
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (roleRef.current) roleRef.current.value = '';
    setInviteOpen(false);
  };

  const submitAssign = () => {
    if (!titleRef.current?.value.trim() || !assigneeRef.current?.value) return;
    onAssignTask({
      title: titleRef.current.value,
      project: projectRef.current?.value ?? '',
      due: dueRef.current?.value ?? '',
      assigneeId: assigneeRef.current.value,
    });
    if (titleRef.current) titleRef.current.value = '';
    if (dueRef.current) dueRef.current.value = '';
    setAssignOpen(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={h1}>My Team</h1>
          <p style={subtitle}>Invite field officers, assign them tasks, and see who's carrying what.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setAssignOpen((o) => !o)} style={secondaryBtn}>
            Assign task
          </button>
          <button onClick={() => setInviteOpen((o) => !o)} style={{ ...primaryBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="plus" size={16} strokeWidth={2.4} />
            Invite member
          </button>
        </div>
      </div>

      {inviteOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Invite a team member</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div style={formField}>
              <label style={label}>Name</label>
              <input ref={nameRef} placeholder="e.g. Chidi Nwankwo" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Email</label>
              <input ref={emailRef} type="email" placeholder="e.g. chidi@seplat.com" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Role / patch</label>
              <input ref={roleRef} placeholder="e.g. Field Officer · Amukpe" style={input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => setInviteOpen(false)} style={secondaryBtn}>
              Cancel
            </button>
            <button onClick={submitInvite} style={primaryBtn}>
              Send invite →
            </button>
          </div>
        </div>
      )}

      {assignOpen && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 16 }}>Assign a task</div>
          <div className="form-grid-3" style={{ marginBottom: 16 }}>
            <div style={formField}>
              <label style={label}>Task title</label>
              <input ref={titleRef} placeholder="e.g. Q4 beneficiary count" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Project</label>
              <select ref={projectRef} style={input} defaultValue={projects[0]?.name ?? ''}>
                {projects.map((p) => (
                  <option key={p.id} value={`${p.code} · ${p.state}`}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={formField}>
              <label style={label}>Due</label>
              <input ref={dueRef} placeholder="e.g. Due in 5 days" style={input} />
            </div>
            <div style={formField}>
              <label style={label}>Assign to</label>
              <select ref={assigneeRef} style={input} defaultValue={members[0]?.id}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => setAssignOpen(false)} style={secondaryBtn}>
              Cancel
            </button>
            <button onClick={submitAssign} style={primaryBtn}>
              Assign task →
            </button>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 18 }}>
        {members.map((m) => {
          const [sBg, sFg] = STATUS_COLORS[m.status];
          const myTasks = tasks.filter((t) => t.assigneeId === m.id);
          const done = myTasks.filter((t) => t.status === 'Done').length;
          return (
            <div key={m.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>{m.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{m.roleTitle}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.email}</div>
                </div>
                <span style={pill(sBg, sFg)}>{m.status}</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                {myTasks.length} task{myTasks.length === 1 ? '' : 's'} assigned · {done} done · joined {m.joinedAt}
              </div>

              {myTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                  {myTasks.map((t) => {
                    const [tBg, tFg] = TASK_STATUS_COLORS[t.status ?? 'Not started'];
                    return (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--ink)' }}>{t.title}</span>
                        <span style={pill(tBg, tFg)}>{t.status ?? 'Not started'}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
