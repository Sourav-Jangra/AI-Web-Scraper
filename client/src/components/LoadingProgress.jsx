import React from 'react';

export default function LoadingProgress({ stage }) {
  if (!stage) return null;

  const stages = [
    { key: 'fetching', label: '1. Fetching webpage content...' },
    { key: 'extracting', label: '2. Cleaning and extracting text...' },
    { key: 'summarizing', label: '3. Generating AI summary...' }
  ];

  const getCurrentIndex = () => {
    if (stage === 'fetching') return 0;
    if (stage === 'extracting') return 1;
    if (stage === 'summarizing') return 2;
    return 0;
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="glass-card loading-card" style={{ textAlign: 'center', padding: '1.75rem' }}>
      <div className="spinner" style={{ margin: '0 auto 1.25rem auto', width: '28px', height: '28px' }}></div>
      <div className="loading-steps" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
        {stages.map((s, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div 
              key={s.key} 
              style={{
                fontSize: '0.95rem',
                fontWeight: isCurrent ? '600' : '400',
                color: isCurrent ? '#818cf8' : isDone ? '#34d399' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              {isDone && <span>✓</span>}
              {isCurrent && <span style={{ animation: 'pulse 1s infinite' }}>●</span>}
              {!isDone && !isCurrent && <span>○</span>}
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
