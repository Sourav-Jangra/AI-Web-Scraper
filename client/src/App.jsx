import React, { useState } from 'react';
import UrlForm from './components/UrlForm';
import SummaryCard from './components/SummaryCard';
import ErrorAlert from './components/ErrorAlert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState(null);

  const handleSummarize = async (targetUrl) => {
    setIsLoading(true);
    setError(null);
    setSummaryData(null);

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
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>AI Web Scraper</h1>
        <p>Extract and summarize any public webpage instantly</p>
      </header>

      <main>
        <UrlForm onSubmit={handleSummarize} isLoading={isLoading} />
        <ErrorAlert message={error} />
        <SummaryCard data={summaryData} />
      </main>
    </div>
  );
}
