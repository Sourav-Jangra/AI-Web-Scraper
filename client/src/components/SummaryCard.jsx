import React from 'react';

export default function SummaryCard({ data }) {
  if (!data) return null;

  const { title, url, summary, provider, model, charCount } = data;

  return (
    <div className="glass-card summary-container">
      <div className="summary-header">
        <h2 className="summary-title">{title || 'AI Content Summary'}</h2>
        <div className="summary-meta">
          {provider && <span className="badge">{provider}</span>}
          {model && <span className="badge">{model}</span>}
          {charCount && <span className="badge">{charCount} chars read</span>}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="url-link">
          🔗 {url}
        </a>
      </div>

      <div className="summary-body">
        {summary}
      </div>
    </div>
  );
}
