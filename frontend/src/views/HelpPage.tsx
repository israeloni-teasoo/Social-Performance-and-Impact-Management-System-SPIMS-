import { useState } from 'react';
import { HELP_TOPICS } from '../data/helpTopics';
import type { HelpTopic } from '../data/helpTopics';
import { h1, pill, subtitle } from '../ui';
import { StandardsLibrary } from './StandardsLibrary';
import type { Project } from '../types';

const TAG_COLORS: Record<HelpTopic['tag'], [string, string]> = {
  Data: ['rgba(43,76,155,0.12)', '#2B4C9B'],
  Roles: ['rgba(31,138,91,0.14)', '#1F8A5B'],
  Reports: ['rgba(17,28,85,0.1)', '#111C55'],
  Impact: ['rgba(227,26,56,0.12)', '#E31A38'],
};

type Tab = 'guide' | 'standards';

export function HelpPage({ projects, goProjectDetail }: { projects: Project[]; goProjectDetail: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>('guide');
  const [openId, setOpenId] = useState<string | null>(HELP_TOPICS[0].id);

  const tabStyle = (active: boolean) => ({
    fontSize: 12.5,
    fontWeight: 600,
    padding: '8px 16px',
    borderRadius: 9,
    background: active ? 'var(--navy)' : '#fff',
    color: active ? '#fff' : 'var(--ink)',
    border: active ? 'none' : '1px solid var(--line)',
    fontFamily: 'inherit',
    cursor: 'pointer',
  });

  return (
    <div>
      <h1 style={h1}>Help &amp; Standards</h1>
      <p style={subtitle}>
        Plain-English answers to the questions people usually ask, plus every local and global standard SPIMS reports against.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setTab('guide')} style={tabStyle(tab === 'guide')}>
          How SPIMS Works
        </button>
        <button onClick={() => setTab('standards')} style={tabStyle(tab === 'standards')}>
          Standards Library
        </button>
      </div>

      {tab === 'guide' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HELP_TOPICS.map((topic) => {
            const isOpen = openId === topic.id;
            const [tagBg, tagFg] = TAG_COLORS[topic.tag];
            return (
              <div key={topic.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenId(isOpen ? null : topic.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '18px 22px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={pill(tagBg, tagFg)}>{topic.tag}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)' }}>{topic.question}</span>
                  </span>
                  <span style={{ fontSize: 18, color: 'var(--muted)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>+</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 22px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topic.answer.map((line, i) => (
                      <p key={i} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink)' }}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <StandardsLibrary projects={projects} goProjectDetail={goProjectDetail} />
      )}
    </div>
  );
}
