import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Small "ⓘ" trigger that reveals explanatory content on click/tap — keeps pages free of always-on note boxes. */
export function InfoTip({ label, children, width = 280 }: { label: string; children: ReactNode; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: '#fff',
          color: 'var(--muted)',
          fontFamily: 'inherit',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        i
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '130%',
            left: 0,
            zIndex: 50,
            width: `min(${width}px, 86vw)`,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 20px 50px -12px rgba(17,28,85,0.28)',
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--ink)',
          }}
        >
          {children}
        </div>
      )}
    </span>
  );
}
