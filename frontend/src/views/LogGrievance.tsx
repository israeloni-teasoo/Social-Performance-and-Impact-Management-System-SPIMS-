import { useRef } from 'react';
import { formField, h1, input, label, primaryBtn, secondaryBtn, sectionCardTitle, subtitle } from '../ui';
import type { NewGrievanceInput } from '../types';

export function LogGrievance({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (input: NewGrievanceInput) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const communityRef = useRef<HTMLSelectElement>(null);
  const channelRef = useRef<HTMLSelectElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const severityRef = useRef<HTMLSelectElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    onSubmit({
      title: titleRef.current?.value ?? '',
      category: categoryRef.current?.value ?? '',
      severity: severityRef.current?.value ?? '',
      channel: channelRef.current?.value ?? '',
      raisedByName: nameRef.current?.value ?? '',
      raisedByCommunity: communityRef.current?.value ?? '',
      raisedByContact: contactRef.current?.value ?? '',
      description: descRef.current?.value ?? '',
    });
    [nameRef, contactRef, titleRef, descRef].forEach((r) => {
      if (r.current) r.current.value = '';
    });
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={h1}>Log Grievance</h1>
      <p style={subtitle}>Capture a complaint raised by a community member or stakeholder. It opens a case and routes to Community Relations.</p>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>Who raised it</div>
        <div className="form-grid-2">
          <div style={formField}>
            <label style={label}>Name of complainant</label>
            <input ref={nameRef} placeholder="e.g. Pa Godwin Eze" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Contact</label>
            <input ref={contactRef} placeholder="Phone or via CDC" style={input} />
          </div>
          <div style={formField}>
            <label style={label}>Community</label>
            <select ref={communityRef} style={input} defaultValue="Sapele, Delta">
              <option>Sapele, Delta</option>
              <option>Oben, Edo</option>
              <option>Amukpe, Delta</option>
              <option>Ovhor, Delta</option>
              <option>Orogun, Delta</option>
              <option>Ozara, Edo</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Intake channel</label>
            <select ref={channelRef} style={input} defaultValue="Walk-in desk">
              <option>Walk-in desk</option>
              <option>Phone hotline</option>
              <option>Community meeting</option>
              <option>Suggestion box</option>
              <option>Field officer visit</option>
              <option>Email / letter</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '24px 26px', marginBottom: 18 }}>
        <div style={sectionCardTitle}>The complaint</div>
        <div style={{ ...formField, marginBottom: 16 }}>
          <label style={label}>Summary</label>
          <input ref={titleRef} placeholder="Short title, e.g. Delayed borehole handover" style={input} />
        </div>
        <div className="form-grid-2-1" style={{ marginBottom: 16 }}>
          <div style={formField}>
            <label style={label}>Category</label>
            <select ref={categoryRef} style={input} defaultValue="Infrastructure / service delivery">
              <option>Infrastructure / service delivery</option>
              <option>Employment / local content</option>
              <option>Environment / nuisance</option>
              <option>Programme / fairness</option>
              <option>Programme / access</option>
              <option>Compensation / land</option>
              <option>Safety</option>
              <option>Other</option>
            </select>
          </div>
          <div style={formField}>
            <label style={label}>Severity</label>
            <select ref={severityRef} style={input} defaultValue="Medium">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        </div>
        <div style={formField}>
          <label style={label}>Description</label>
          <textarea
            ref={descRef}
            rows={3}
            placeholder="What happened, and what the complainant is asking for."
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 10, background: '#fbfbfd', color: 'var(--ink)', resize: 'vertical' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', marginRight: 'auto' }}>
          On submit, a case reference is generated and the grievance appears in the case log immediately.
        </span>
        <button onClick={onCancel} style={secondaryBtn}>
          Cancel
        </button>
        <button onClick={submit} style={primaryBtn}>
          Log grievance &amp; open case →
        </button>
      </div>
    </div>
  );
}
