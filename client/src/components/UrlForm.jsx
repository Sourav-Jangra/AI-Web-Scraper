import React, { useState } from 'react';

export default function UrlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim());
  };

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit} className="url-form">
        <label htmlFor="url-input" style={{ fontSize: '0.95rem', fontWeight: '500', color: '#cbd5e1' }}>
          Public Webpage URL
        </label>
        <div className="input-group">
          <input
            id="url-input"
            type="url"
            className="url-input"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            required
          />
          <button type="submit" className="btn-submit" disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                <span>Summarizing...</span>
              </>
            ) : (
              <span>Summarize</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
