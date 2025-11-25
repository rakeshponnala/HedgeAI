from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from claude_brain import ClaudeAnalyst  # Import your new brain!

# 1. Initialize the App
app = FastAPI(title="The AI Analyst API")

# 2. Enable CORS (Allows your frontend to talk to this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Initialize the AI Analyst (Loads API Keys once on startup)
try:
    analyst = ClaudeAnalyst()
    print("✅ API Server: Claude Analyst Loaded Successfully.")
except Exception as e:
    print(f"❌ API Server Error: {e}")
    analyst = None

# --- Data Models ---
class AnalysisRequest(BaseModel):
    ticker: str

# --- Endpoints ---
@app.get("/")
def read_root():
    return {"status": "active", "message": "The AI Analyst Brain is Online 🧠"}

@app.get("/api/analyze/{ticker}")
async def analyze_stock(ticker: str):
    """
    The Main Endpoint:
    Frontend sends 'NVDA' -> We send back the Risk Report.
    """
    if not analyst:
        raise HTTPException(status_code=500, detail="AI Analyst not initialized (Check API Keys).")
    
    ticker = ticker.upper()
    print(f"📨 API Request Received: Analyze {ticker}")
    
    try:
        # Call the logic we just built in claude_brain.py
        report = analyst.analyze(ticker)
        
        # Return structured JSON
        return {
            "ticker": ticker,
            "analysis": report
        }
    except Exception as e:
        print(f"❌ Error generating report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload
