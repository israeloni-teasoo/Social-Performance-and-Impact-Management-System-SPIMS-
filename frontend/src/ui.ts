import type { CSSProperties } from 'react';

export const card: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--line)',
  borderRadius: 16,
  padding: '22px 24px',
};

export const h1: CSSProperties = {
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  margin: '0 0 6px',
  color: 'var(--navy)',
};

export const subtitle: CSSProperties = {
  fontSize: 14.5,
  color: 'var(--muted)',
  margin: '0 0 22px',
};

export const tableHeaderRow: CSSProperties = {
  padding: '15px 22px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  background: '#fafafe',
  borderBottom: '1px solid var(--line)',
};

export const tableRow: CSSProperties = {
  padding: '16px 22px',
  fontSize: 13.5,
  alignItems: 'center',
  borderBottom: '1px solid var(--line)',
};

export function pill(bg: string, fg: string): CSSProperties {
  return {
    fontSize: 11.5,
    fontWeight: 600,
    padding: '4px 11px',
    borderRadius: 20,
    background: bg,
    color: fg,
  };
}

export const label: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--navy)',
};

export const input: CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '11px 13px',
  border: '1px solid var(--line)',
  borderRadius: 10,
  background: '#fbfbfd',
  color: 'var(--ink)',
};

export const formField: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 };

export const sectionCardTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--navy)',
  marginBottom: 18,
  paddingBottom: 12,
  borderBottom: '1px solid var(--line)',
};

export const primaryBtn: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 600,
  color: '#fff',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
};

export const secondaryBtn: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 600,
  color: 'var(--navy)',
  background: '#fff',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '12px 22px',
  cursor: 'pointer',
};

export const PILLAR_COLORS: Record<string, [string, string]> = {
  Education: ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Health: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Infrastructure: ['rgba(14,124,134,0.14)', '#0E7C86'],
  'Economic Emp.': ['rgba(192,73,30,0.14)', '#C0491E'],
};

export const STATUS_COLORS: Record<string, [string, string]> = {
  'On track': ['rgba(31,138,91,0.14)', '#1F8A5B'],
  'At risk': ['rgba(227,26,56,0.12)', '#E31A38'],
  Delayed: ['rgba(192,73,30,0.14)', '#C0491E'],
};

export const REPORT_LENS_COLORS: Record<string, [string, string]> = {
  Board: ['rgba(17,28,85,0.1)', '#111C55'],
  Global: ['rgba(227,26,56,0.12)', '#E31A38'],
  Local: ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Community: ['rgba(31,138,91,0.14)', '#1F8A5B'],
};

export const SEVERITY_COLORS: Record<string, [string, string]> = {
  High: ['rgba(227,26,56,0.12)', '#E31A38'],
  Medium: ['rgba(192,73,30,0.14)', '#C0491E'],
  Low: ['rgba(31,138,91,0.14)', '#1F8A5B'],
};

export const GRIEVANCE_STATUS_COLORS: Record<string, [string, string]> = {
  Open: ['rgba(192,73,30,0.14)', '#C0491E'],
  Investigating: ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Resolved: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Closed: ['rgba(138,141,166,0.18)', '#6B6E88'],
};

export const STAKEHOLDER_STATUS_COLORS: Record<string, [string, string]> = {
  Active: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Watch: ['rgba(192,73,30,0.14)', '#C0491E'],
};

export const APPROVAL_TYPE_COLORS: Record<string, [string, string]> = {
  Activity: ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Beneficiaries: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Spend: ['rgba(192,73,30,0.14)', '#C0491E'],
  Evidence: ['rgba(17,28,85,0.1)', '#111C55'],
};
