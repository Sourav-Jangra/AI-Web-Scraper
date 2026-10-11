import React, { useEffect, useRef } from 'react';

export default function UrlForm({ onSubmit, isLoading, initialUrl = '' }) {
  const [url, setUrl] = React.useState(initialUrl);
  const inputRef = useRef(null);

  useEffect(() => {
    setUrl(initialUrl);
    if (initialUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [initialUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim());
  };

  return (
    <div className="glass-card form-card">
      <form onSubmit={handleSubmit} className="url-form">
        <label htmlFor="url-input" className="form-label">
          Public Webpage URL
        </label>
        <div className="input-group">
          <div className="input-wrapper">
            <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <input
              ref={inputRef}
              id="url-input"
              type="url"
              className="url-input"
              placeholder="https://en.wikipedia.org/wiki/Web_scraping"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              required
              aria-required="true"
              aria-label="Public webpage URL to summarize"
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={isLoading || !url.trim()}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Summarizing...</span>
              </>
            ) : (
              <>
                <span>Summarize</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
