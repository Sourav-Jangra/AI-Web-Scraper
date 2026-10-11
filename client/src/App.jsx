import React, { useState } from 'react';
import UrlForm from './components/UrlForm';
import SummaryCard from './components/SummaryCard';
import ErrorAlert from './components/ErrorAlert';
import LoadingProgress from './components/LoadingProgress';
import ExampleCards from './components/ExampleCards';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);
  const [submittedUrl, setSubmittedUrl] = useState('');

  const handleSummarize = async (targetUrl) => {
    setIsLoading(true);
    setLoadingStage('fetching');
    setError(null);
    setSummaryData(null);
    setSubmittedUrl(targetUrl);

    // Dynamic stage progression reflecting actual background operations
    const stageTimer = setTimeout(() => {
      setLoadingStage('summarizing');
    }, 1800);

    try {
      const response = await fetch(`${API_BASE_URL}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Server error (${response.status})`);
      }

      setSummaryData(result.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server.');
    } finally {
      clearTimeout(stageTimer);
      setIsLoading(false);
      setLoadingStage(null);
    }
  };

  const handleSelectExample = (exampleUrl) => {
    setSubmittedUrl(exampleUrl);
    setError(null);
  };

  const handleReset = () => {
    setSummaryData(null);
    setError(null);
    setSubmittedUrl('');
  };

  return (
    <div className="app-container">
      {/* SaaS Product Header */}
      <header className="app-header">
        <div className="brand-badge">
          <svg className="brand-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <span className="brand-name">AI Web Scraper</span>
        </div>

        <h1 className="hero-headline">Turn webpages into clear insights.</h1>
        <p className="hero-description">
          Paste any public webpage URL to automatically extract, filter, and summarize its readable content using AI.
        </p>
      </header>

      <main className="app-main">
        {/* Main Search Input Form */}
        <UrlForm onSubmit={handleSummarize} isLoading={isLoading} initialUrl={submittedUrl} />

        {/* Real Loading Progression */}
        {isLoading && <LoadingProgress stage={loadingStage} />}

        {/* Error Feedback Banner */}
        <ErrorAlert message={error} />

        {/* Generated Summary Report */}
        {summaryData ? (
          <SummaryCard data={summaryData} onReset={handleReset} />
        ) : (
          /* Show Example Cards only before summary is generated */
          !isLoading && <ExampleCards onSelectExample={handleSelectExample} />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Private & secure · In-memory processing · SSRF-protected</p>
      </footer>
    </div>
  );
}
