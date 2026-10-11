import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SummaryCard({ data, onReset }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const { title, url, summary, provider, model, charCount, timing, cached } = data;

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  };

  return (
    <article className="glass-card report-container" aria-label="Generated AI Summary Report">
      {/* Report Header */}
      <div className="report-header">
        <div className="report-title-area">
          <span className="report-badge">AI Analysis Report</span>
          <h2 className="report-title">{title || 'Webpage Summary'}</h2>
        </div>

        {/* Action Controls */}
        <div className="report-actions">
          <button 
            type="button" 
            onClick={handleCopy} 
            className={`btn-action ${copied ? 'btn-copied' : ''}`}
            aria-label={copied ? "Summary copied to clipboard" : "Copy summary markdown to clipboard"}
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copied</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-action btn-open-external"
            title="Open original webpage in new tab"
            aria-label="Open original webpage in new tab"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Open Original Page</span>
          </a>

          {onReset && (
            <button 
              type="button" 
              onClick={onReset} 
              className="btn-action btn-reset"
              title="Summarize another URL"
              aria-label="Clear current summary and summarize another URL"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Summarize Another</span>
            </button>
          )}
        </div>
      </div>

      {/* Metadata Bar */}
      <div className="report-metadata">
        <div className="metadata-item">
          <span className="metadata-label">Source URL:</span>
          <span className="metadata-value metadata-url" title={url}>{url}</span>
        </div>
        <div className="metadata-tags">
          {cached && <span className="badge badge-cached">Cached</span>}
          {provider && <span className="badge">{provider}</span>}
          {model && <span className="badge">{model}</span>}
          {charCount && <span className="badge">{charCount} chars read</span>}
          {timing && timing.totalMs && (
            <span className="badge badge-timing">{timing.totalMs}ms</span>
          )}
        </div>
      </div>

      {/* Render Markdown Content Properly */}
      <div className="summary-markdown-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" className="markdown-link" />
            )
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>
    </article>
  );
}
