import React from 'react';

export default function ErrorAlert({ message }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div>
        <strong>Unable to summarize page</strong>
        <p style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>{message}</p>
      </div>
    </div>
  );
}
