import { useState } from 'react';
import { formatCount } from '../analytics/metrics';
import { formField, input, label as labelStyle, primaryBtn, secondaryBtn } from '../ui';
import { InfoTip } from './Tooltip';
import type { CustomField, CustomFieldFormat, NewCustomFieldInput } from '../types';

const FORMATS: { value: CustomFieldFormat; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'percent', label: 'Percentage' },
  { value: 'naira', label: 'Naira amount' },
  { value: 'date', label: 'Date' },
];

/** Numbers are stored raw so they stay comparable; formatting is a display concern. */
function displayAnswer(field: CustomField): string {
  const numeric = Number(field.answer.replace(/,/g, ''));
  if (field.format === 'text' || field.format === 'date' || Number.isNaN(numeric)) return field.answer;
  if (field.format === 'percent') return `${numeric}%`;
  if (field.format === 'naira') return `₦${formatCount(numeric)}`;
  return formatCount(numeric);
}

function FieldRow({
  field,
  canEdit,
  isLast,
  onUpdate,
  onRemove,
}: {
  field: CustomField;
  canEdit: boolean;
  isLast: boolean;
  onUpdate: (id: string, answer: string, source: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [answer, setAnswer] = useState(field.answer);
  const [source, setSource] = useState(field.source);

  const save = () => {
    if (!answer.trim()) return;
    onUpdate(field.id, answer, source);
    setEditing(false);
  };

  return (
    <div style={{ paddingBottom: isLast ? 0 : 16, marginBottom: isLast ? 0 : 16, borderBottom: isLast ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>{field.question}</div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
          <div style={formField}>
            <label style={labelStyle}>Answer</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>
          <div style={formField}>
            <label style={labelStyle}>Source</label>
            <textarea value={source} onChange={(e) => setSource(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} style={primaryBtn}>
              Save
            </button>
            <button
              onClick={() => {
                setAnswer(field.answer);
                setSource(field.source);
                setEditing(false);
              }}
              style={secondaryBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 15, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.5 }}>{displayAnswer(field)}</div>
      )}

      {!editing && (
        <>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>{field.source}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              Updated {field.updatedAt} · {field.updatedBy}
            </span>
            {canEdit && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, color: '#2B4C9B', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onRemove(field.id)}
                  style={{ fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CustomFieldsPanel({
  projectCode,
  fields,
  canEdit,
  onAdd,
  onUpdate,
  onRemove,
}: {
  projectCode: string;
  fields: CustomField[];
  canEdit: boolean;
  onAdd: (input: NewCustomFieldInput) => void;
  onUpdate: (id: string, answer: string, source: string) => void;
  onRemove: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [format, setFormat] = useState<CustomFieldFormat>('text');
  const [source, setSource] = useState('');

  const mine = fields.filter((f) => f.projectCode === projectCode);

  const submit = () => {
    if (!question.trim() || !answer.trim()) return;
    onAdd({ projectCode, question, answer, format, source });
    setQuestion('');
    setAnswer('');
    setSource('');
    setFormat('text');
    setAdding(false);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px', marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>
          Questions about this programme
          <InfoTip label="What this section is for" width={320}>
            Questions this programme keeps being asked, answered here so the dashboard responds directly instead of needing a fresh ad-hoc
            report each time. Each answer carries its source, on the same rule as every other figure in SPIMS.
          </InfoTip>
        </div>
        {canEdit && !adding && (
          <button onClick={() => setAdding(true)} style={secondaryBtn}>
            Add a question →
          </button>
        )}
      </div>

      {adding && (
        <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '18px 20px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={formField}>
            <label style={labelStyle}>Question</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What share of places went to host-community applicants?"
              style={input}
            />
          </div>
          <div className="form-grid-3">
            <div style={{ ...formField, gridColumn: 'span 2' }}>
              <label style={labelStyle}>Answer</label>
              <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="e.g. 73" style={input} />
            </div>
            <div style={formField}>
              <label style={labelStyle}>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as CustomFieldFormat)} style={input}>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={formField}>
            <label style={labelStyle}>Source</label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={2}
              placeholder="Where this answer comes from, and any caveat a reader should know."
              style={{ ...input, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submit} style={primaryBtn}>
              Add field
            </button>
            <button onClick={() => setAdding(false)} style={secondaryBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mine.length === 0 ? (
        <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
          No programme-specific questions recorded yet.
          {canEdit && ' Add the ones stakeholders keep asking, so the answer lives here instead of in a one-off report.'}
        </div>
      ) : (
        <div>
          {mine.map((f, i) => (
            <FieldRow key={f.id} field={f} canEdit={canEdit} isLast={i === mine.length - 1} onUpdate={onUpdate} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
