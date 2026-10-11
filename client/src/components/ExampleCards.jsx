import React from 'react';

const EXAMPLES = [
  {
    category: 'Article',
    title: 'Wikipedia: Web Scraping',
    description: 'Overview of automated web data extraction techniques and history.',
    url: 'https://en.wikipedia.org/wiki/Web_scraping',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    )
  },
  {
    category: 'Technical Documentation',
    title: 'MDN Web Docs: HTTP Overview',
    description: 'Fundamental architecture of the Hypertext Transfer Protocol.',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    )
  },
  {
    category: 'Blog Post',
    title: 'Overreacted: A Complete Guide to useEffect',
    description: 'Dan Abramov’s in-depth guide to React lifecycle and hooks.',
    url: 'https://overreacted.io/a-complete-guide-to-useeffect/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  }
];

export default function ExampleCards({ onSelectExample }) {
  return (
    <section className="examples-section" aria-label="Example websites">
      <div className="examples-header">
        <h2 className="examples-title">Try an example</h2>
        <span className="examples-subtitle">Select a verified public page to populate the input</span>
      </div>

      <div className="examples-grid">
        {EXAMPLES.map((ex) => (
          <div key={ex.category} className="glass-card example-card">
            <div className="example-top">
              <div className="example-icon" aria-hidden="true">
                {ex.icon}
              </div>
              <span className="example-category">{ex.category}</span>
            </div>

            <h3 className="example-heading">{ex.title}</h3>
            <p className="example-desc">{ex.description}</p>

            <button
              type="button"
              className="btn-try-example"
              onClick={() => onSelectExample(ex.url)}
              aria-label={`Try example: ${ex.title}`}
            >
              <span>Try example</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
