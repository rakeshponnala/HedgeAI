# HedgeAI Architecture Guide

Technical documentation for HedgeAI's system architecture, design patterns, and implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [AI Integration](#ai-integration)
6. [Security](#security)
7. [Performance](#performance)

---

## System Overview

HedgeAI implements a **three-tier architecture** separating presentation, application logic, and external services.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION TIER                            │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                     Next.js Application                      │   │
│   │                                                              │   │
│   │   • Server Components (layout, metadata)                    │   │
│   │   • Client Components (dashboard, forms)                    │   │
│   │   • Tailwind CSS styling                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTP/REST (JSON)
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                         APPLICATION TIER                             │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                      FastAPI Server                          │   │
│   │                                                              │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │   │
│   │   │   Routes    │  │   Services  │  │   Models    │        │   │
│   │   │  (api/)     │  │ (services/) │  │  (models/)  │        │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘        │   │
│   │                                                              │   │
│   │   ┌─────────────────────────────────────────────────┐       │   │
│   │   │              Configuration (core/)               │       │   │
│   │   └─────────────────────────────────────────────────┘       │   │
│   └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
┌─────────────▼───┐  ┌─────────▼───────┐  ┌─────▼─────────────┐
│  Yahoo Finance  │  │   DuckDuckGo    │  │   Anthropic API   │
│                 │  │                 │  │                   │
│  Stock prices   │  │  News search    │  │  Claude Sonnet    │
│  Market data    │  │  Headlines      │  │  Risk analysis    │
└─────────────────┘  └─────────────────┘  └───────────────────┘
```

---

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # Endpoint definitions
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py              # Settings & environment
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py             # Pydantic models
│   └── services/
│       ├── __init__.py
│       ├── analysis_service.py    # AI analysis
│       └── data_service.py        # Data retrieval
├── main.py                        # Application entry
├── requirements.txt
└── .env
```

### Component Responsibilities

#### `main.py` - Application Entry Point

```python
# Initializes FastAPI with configuration
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION
)

# Configures middleware (CORS, etc.)
# Includes route definitions
```

#### `app/core/config.py` - Configuration Management

Centralizes all application settings:

```python
class Settings:
    ANTHROPIC_API_KEY: str      # From environment
    AI_MODEL_NAME: str          # Claude model ID
    AI_MAX_TOKENS: int          # Response limit
    AI_TEMPERATURE: float       # Response randomness
    NEWS_MAX_RESULTS: int       # Headlines count
```

#### `app/api/routes.py` - API Endpoints

Defines HTTP endpoints with proper typing:

| Endpoint | Method | Response Model | Description |
|----------|--------|----------------|-------------|
| `/` | GET | `HealthResponse` | Health check |
| `/api/analyze/{ticker}` | GET | `AnalysisResponse` | Stock analysis |

#### `app/models/schemas.py` - Data Models

Pydantic models for request/response validation:

```python
class AnalysisResponse(BaseModel):
    ticker: str
    analysis: str

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str
```

#### `app/services/data_service.py` - Data Retrieval

Handles external data fetching:

```python
class DataService:
    @staticmethod
    def get_stock_price(ticker: str) -> Union[float, str]

    @staticmethod
    def get_news_headlines(ticker: str) -> List[str]

    @classmethod
    def fetch_stock_data(cls, ticker: str) -> dict
```

#### `app/services/analysis_service.py` - AI Analysis

Manages Claude API integration:

```python
class AnalysisService:
    SYSTEM_PROMPT = "..."         # AI persona definition
    USER_PROMPT_TEMPLATE = "..."  # Analysis request template

    def __init__(self)            # Initialize Anthropic client
    def analyze(ticker: str)      # Perform risk analysis
```

---

## Frontend Architecture

### Directory Structure

```
frontend/
├── src/
│   └── app/
│       ├── page.js            # Dashboard (Client Component)
│       ├── layout.tsx         # Root layout (Server Component)
│       └── globals.css        # Tailwind styles
├── public/                    # Static assets
└── package.json
```

### Component Pattern

**Server Components** (default in Next.js 14+):
- `layout.tsx` - Metadata, fonts, shared structure

**Client Components** (`"use client"`):
- `page.js` - Interactive dashboard with state

### State Management

```javascript
// Local component state (no external library needed)
const [ticker, setTicker] = useState('');      // User input
const [loading, setLoading] = useState(false);  // Loading state
const [data, setData] = useState(null);         // API response
const [error, setError] = useState('');         // Error state
```

---

## Data Flow

### Request Lifecycle

```
1. USER ACTION
   └─▶ User enters "NVDA" and clicks "Run Analysis"

2. FRONTEND
   └─▶ Validates input
   └─▶ Sets loading state
   └─▶ Sends GET /api/analyze/NVDA

3. API LAYER (routes.py)
   └─▶ Validates ticker format
   └─▶ Calls AnalysisService.analyze()

4. ANALYSIS SERVICE
   └─▶ Calls DataService.fetch_stock_data()
       ├─▶ Yahoo Finance: Gets price ($177.82)
       └─▶ DuckDuckGo: Gets 3 news headlines

5. AI PROCESSING
   └─▶ Constructs prompt with real data
   └─▶ Sends to Claude API
   └─▶ Receives risk assessment

6. RESPONSE
   └─▶ Returns JSON to frontend
   └─▶ Frontend displays formatted memo
```

---

## AI Integration

### Prompt Engineering

The system uses structured prompting for consistent output:

**System Prompt (Persona Definition):**
```
You are a cynical, risk-focused hedge fund analyst.
Your job is to protect capital by identifying DOWNSIDE risks.
You do not cheerlead.
```

**User Prompt (Task + Context):**
```
Analyze the stock ticker: {ticker}

HERE IS THE REAL-TIME DATA (Do not hallucinate numbers):
- Current Price: ${price}
- Recent News Headlines:
{news}

TASK:
Write a 'Risk Assessment Memo' (max 150 words).
1. Acknowledge the price action.
2. Identify 2 major risks based on the news provided.
3. Conclude with a 'Bearish' or 'Neutral' rating.
```

### Design Rationale

| Design Choice | Purpose |
|---------------|---------|
| "Cynical" persona | Prevents default bullish bias |
| "Do not hallucinate" | Grounds response in provided data |
| Max 150 words | Forces concise, actionable output |
| Bearish/Neutral only | No bullish option maintains risk focus |
| Temperature 0.2 | Ensures consistent, factual responses |

### API Configuration

```python
response = self.client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=400,
    temperature=0.2,
    system=SYSTEM_PROMPT,
    messages=[{"role": "user", "content": user_message}]
)
```

---

## Security

### API Key Management

```
✓ Stored in .env file (not committed)
✓ Listed in .gitignore
✓ Loaded via python-dotenv
✓ Validated on startup
```

### Input Validation

```python
# Ticker validation
ticker = ticker.upper().strip()
if not ticker or len(ticker) > 10:
    raise HTTPException(status_code=400, detail="Invalid ticker")
```

### CORS Configuration

```python
# Current: Permissive (development)
allow_origins=["*"]

# Production: Restrict to specific origins
allow_origins=["https://yourdomain.com"]
```

---

## Performance

### Optimization Strategies

| Area | Strategy |
|------|----------|
| Stock Data | Uses `fast_info` for quicker retrieval |
| News | Limited to 3 results to reduce latency |
| AI Response | `max_tokens=400` limits response size |
| Temperature | Low value (0.2) reduces retry needs |

### Caching Opportunities

Future improvements:
- Cache stock prices (1-5 min TTL)
- Cache news results (15-30 min TTL)
- Cache analysis results (configurable TTL)

### Async Considerations

Current implementation is synchronous. Future optimization:
- Async data fetching
- Parallel price + news retrieval
- Background task processing

---

## Future Enhancements

1. **Authentication**
   - JWT-based user auth
   - Rate limiting per user

2. **Database**
   - Analysis history storage
   - User watchlists

3. **Additional Data Sources**
   - SEC filings integration
   - Earnings data
   - Technical indicators

4. **Enhanced Analysis**
   - Sentiment scoring
   - Historical comparison
   - Peer analysis
