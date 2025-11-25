# The AI Analyst

A specialized AI tool for retail investors that provides 'Devil's Advocate' risk analysis on stocks using Claude AI.

## Architecture

- **Backend:** Python (FastAPI) + Anthropic Claude API + yfinance
- **Frontend:** React (Next.js) + Tailwind CSS
- **AI Model:** Claude Sonnet 4.5

## Features

- Real-time stock price fetching via Yahoo Finance
- News aggregation via DuckDuckGo
- AI-powered risk assessment with bearish/neutral ratings
- Clean, modern dashboard UI

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the backend directory:
```
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL_NAME=claude-sonnet-4-5-20250929
```

Run the server:
```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Start the backend server (port 8000)
2. Start the frontend dev server (port 3000)
3. Enter a stock ticker (e.g., NVDA, TSLA, AAPL)
4. Get AI-generated risk assessment

## API Endpoints

- `GET /` - Health check
- `GET /api/analyze/{ticker}` - Get risk analysis for a stock

## Disclaimer

This tool is for educational and research purposes only. Not financial advice.
