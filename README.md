# Full-Stack AI Web Scraper

A lightweight, secure, and modern full-stack web application where a user enters a public webpage URL, clicks **Summarize**, and receives an AI-generated summary of the page's readable content.

Built with **React + Vite**, **Node.js + Express**, **Cheerio**, and **Google Gemini AI API** (with explicit **Groq AI fallback** capabilities).

---

## Features

- 🎯 **URL Input & Extraction**: Clean input interface with immediate client-side and server-side validation.
- ⚡ **Visible Processing States**: Loading spinner and disabled states while fetching & summarizing.
- 🛡️ **SSRF & Security Defense**:
  - DNS resolution lookup & IP classification to block loopbacks (`127.0.0.1`, `::1`), private IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local metadata addresses (`169.254.169.254`), and non-HTTP/HTTPS protocols.
  - DNS Rebinding protection & multi-pass redirect re-validation (up to 3 redirects).
- 🧹 **Robust Cheerio Scraping**:
  - 10-second timeout limit.
  - 2MB response size limit.
  - Strips non-content elements (`<script>`, `<style>`, `<nav>`, `<footer>`, `<svg>`, etc.) and truncates text at ~6,000 characters.
- 🤖 **AI Summarization & Fallback Strategy**:
  - Primary default model: `gemini-3.8-flash` (via `@google/genai`).
  - Automatic fallback to Groq (`llama-3.1-8b-instant`) when Gemini returns `429 Too Many Requests`, `503 Service Unavailable`, or model access errors.
  - Fails fast on bad API keys (`401/403`) or bad requests (`400`) without triggering unnecessary retries.
- 🔒 **Sanitization**: API keys strictly reside on the backend. Stack traces, internal IPs, and sensitive credentials are never exposed to the frontend.

---

## Project Structure

```
AI Web Scraper/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # UrlForm, SummaryCard, ErrorAlert
│   │   ├── App.jsx              # Main UI State Orchestration
│   │   ├── main.jsx
│   │   └── index.css            # Glassmorphism Dark Theme Styling
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── utils/
│   │   │   ├── urlSecurity.js   # SSRF & DNS Protection
│   │   │   ├── scraper.js       # Cheerio Web Scraper
│   │   │   └── aiSummarizer.js  # AI Service & Groq Fallback Logic
│   │   ├── middleware/
│   │   │   └── errorHandler.js  # Sanitized Error Middleware
│   │   └── index.js             # Express API Server
│   ├── tests/
│   │   └── server.test.js       # Jest & Supertest Suite
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Groq API Key**: Free API key from [Groq Console](https://console.groq.com/) for fallback support.

---

## Environment Variable Setup

### 1. Backend Setup (`server/.env`)

Create a `.env` file in the `server/` directory (refer to `server/.env.example`):

```env
PORT=5000
AI_PROVIDER=gemini
AI_MODEL=gemini-3.8-flash
GEMINI_API_KEY=your_google_ai_studio_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
CLIENT_URL=http://localhost:5173
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file to Git!

### 2. Frontend Setup (`client/.env.local`)

Create a `.env.local` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Local Installation & Startup

### Step 1: Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Run Backend Tests

```bash
cd server
npm test
```

### Step 3: Start Development Servers

**Backend**:
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

**Frontend**:
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

---

## Deployment Guide

### Deploying Backend (Render / Koyeb)
1. Push repository to GitHub.
2. Create a new **Web Service** on Render (or Koyeb) pointing to the `server/` directory.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Configure Environment Variables in Render Dashboard:
   - `GEMINI_API_KEY`
   - `GROQ_API_KEY`
   - `CLIENT_URL` (Set to your deployed frontend URL)
   - `NODE_ENV` = `production`

### Deploying Frontend (Vercel / Netlify)
1. Create a new site on Vercel (or Netlify) pointing to the `client/` directory.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Configure Environment Variables in Vercel Dashboard:
   - `VITE_API_BASE_URL` (Set to your deployed backend URL)

---

## Verification Status

- ✅ **Unit & Integration Tests**: Passed (11/11 tests passing in Jest test suite).
- ✅ **Frontend Production Build**: Successfully compiled Vite bundle.
- ℹ️ **Live AI Request**: Requires adding a valid `GEMINI_API_KEY` to `server/.env`.
- ℹ️ **GitHub / Live Deployment**: Deployment and repository push remain to be performed with user credentials.
