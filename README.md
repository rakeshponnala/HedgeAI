# HedgeAI

AI-powered contrarian stock risk analysis for retail investors. Unlike traditional bullish-biased tools, HedgeAI takes a **hedge fund approach** - identifying downside risks to help protect your capital.

## Overview

Most financial analysis tools default to optimism. HedgeAI fills a critical gap by providing **"Devil's Advocate"** analysis that surfaces potential risks before you invest.

**Key Value Proposition:**
- Identifies risks others might overlook
- Provides clear, actionable risk assessments
- Helps investors make more informed decisions

## Features

| Feature | Description |
|---------|-------------|
| **Real-time Data** | Live stock prices via Yahoo Finance |
| **News Intelligence** | Recent headlines aggregated from DuckDuckGo |
| **AI Risk Analysis** | Claude Sonnet 4.5 powered risk assessment |
| **Clear Verdicts** | Bearish or Neutral ratings |
| **Modern UI** | Clean, responsive dashboard |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│                                                              │
│    Next.js 16  •  React 19  •  Tailwind CSS 4              │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│                                                              │
│    FastAPI  •  Pydantic  •  Uvicorn                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Yahoo     │  │ DuckDuckGo │  │ Anthropic  │
    │  Finance   │  │   Search   │  │  Claude    │
    └────────────┘  └────────────┘  └────────────┘
```

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | 16.x |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Backend | FastAPI | Latest |
| AI Model | Claude Sonnet | 4.5 |
| Stock Data | yfinance | Latest |
| News Data | ddgs | Latest |

## Project Structure

```
HedgeAI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # API endpoint definitions
│   │   ├── core/
│   │   │   └── config.py             # Application configuration
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic data models
│   │   └── services/
│   │       ├── analysis_service.py   # AI analysis logic
│   │       └── data_service.py       # Data retrieval logic
│   ├── main.py                       # Application entry point
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # Environment variables (not committed)
│
├── frontend/
│   ├── src/app/
│   │   ├── page.js                   # Main dashboard
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Global styles
│   └── package.json                  # Node dependencies
│
├── docs/
│   └── ARCHITECTURE.md               # Technical documentation
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Anthropic API key → [Get one here](https://console.anthropic.com/)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Then edit with your API key
```

**Environment Variables** (`backend/.env`):
```env
ANTHROPIC_API_KEY=your_api_key_here
AI_MODEL_NAME=claude-sonnet-4-5-20250929
AI_MAX_TOKENS=400
AI_TEMPERATURE=0.2
NEWS_MAX_RESULTS=3
```

**Start the server:**
```bash
uvicorn main:app --reload
```

API available at `http://127.0.0.1:8000`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard available at `http://localhost:3000`

## API Documentation

### Interactive Docs

Once the backend is running:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

### Endpoints

#### Health Check
```http
GET /
```
```json
{
  "status": "active",
  "message": "HedgeAI API is online",
  "version": "1.0.0"
}
```

#### Analyze Stock
```http
GET /api/analyze/{ticker}
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `ticker` | string | Stock symbol (e.g., NVDA, TSLA) |

**Response:**
```json
{
  "ticker": "NVDA",
  "analysis": "RISK ASSESSMENT MEMO - NVDA\n\nPrice: $177.82\n\nMajor Risks:\n1. Geopolitical exposure through Taiwan semiconductor dependency...\n2. Valuation concerns amid market volatility...\n\nRating: BEARISH"
}
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `AI_MODEL_NAME` | Claude model ID | `claude-sonnet-4-5-20250929` |
| `AI_MAX_TOKENS` | Max response tokens | `400` |
| `AI_TEMPERATURE` | Response randomness | `0.2` |
| `NEWS_MAX_RESULTS` | Headlines to fetch | `3` |

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md) - Technical deep-dive

## Roadmap

- [ ] User authentication
- [ ] Analysis history
- [ ] Portfolio tracking
- [ ] Additional data sources (SEC filings, earnings)
- [ ] Technical indicators

## Limitations

- Stock prices may have slight delays
- News availability depends on DuckDuckGo
- Analysis is AI-generated and for research only

## Disclaimer

**This tool is for educational and research purposes only.**

HedgeAI does not provide financial advice. Always conduct your own research and consult qualified financial advisors before making investment decisions. Past performance does not guarantee future results.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit a PR.

---

Built by Rakesh Ponnala
