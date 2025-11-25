import os
import yfinance as yf
from ddgs import DDGS
from datetime import datetime
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables (API Keys)
load_dotenv()

class ClaudeAnalyst:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("❌ MISSING API KEY! Please add ANTHROPIC_API_KEY to your .env file.")
        
        self.client = Anthropic(api_key=api_key)
        
        # Use the model from .env, or default to the latest stable Sonnet 3.5
        self.model = os.getenv("AI_MODEL_NAME", "claude-3-5-sonnet-latest")
        print(f"🧠 Initialized with Model: {self.model}")

    def fetch_data(self, ticker: str):
        """Retrieval Layer: Gets the hard facts."""
        print(f"🔍 Fetching live data for {ticker}...")
        
        # 1. Get Price
        try:
            stock = yf.Ticker(ticker)
            # Using fast_info for better performance
            price = round(stock.fast_info.last_price, 2)
        except Exception as e:
            print(f"   ⚠️ Price fetch warning: {e}")
            price = "Unknown"

        # 2. Get News
        news_list = []
        try:
            with DDGS() as ddgs:
                # Targeted search for investor risks
                results = ddgs.news(f"{ticker} stock investor risks {datetime.now().year}", max_results=3)
                for r in results:
                    news_list.append(f"- {r['title']} (Source: {r['source']})")
        except Exception as e:
            print(f"   ⚠️ News fetch warning: {e}")
            news_list.append("No recent news found.")

        return {"price": price, "news": "\n".join(news_list)}

    def analyze(self, ticker: str):
        """Generation Layer: Sends facts to Claude."""
        
        # 1. Retrieve Data
        data = self.fetch_data(ticker)
        
        # 2. The System Prompt (Persona)
        system_prompt = "You are a cynical, risk-focused hedge fund analyst. Your job is to protect capital by identifying DOWNSIDE risks. You do not cheerlead."

        # 3. The User Prompt (Context)
        user_message = f"""
        Analyze the stock ticker: {ticker}
        
        HERE IS THE REAL-TIME DATA (Do not hallucinate numbers):
        - Current Price: ${data['price']}
        - Recent News Headlines:
        {data['news']}
        
        TASK:
        Write a 'Risk Assessment Memo' (max 150 words).
        1. Acknowledge the price action.
        2. Identify 2 major risks based on the news provided.
        3. Conclude with a 'Bearish' or 'Neutral' rating.
        """

        print(f"📤 Sending data to {self.model}...")
        
        try:
            # 4. Call API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=400,
                temperature=0.2, # Low temperature = More factual/consistent
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            return message.content[0].text
        except Exception as e:
            return f"❌ API Error: {str(e)}"

# --- RUN IT ---
if __name__ == "__main__":
    analyst = ClaudeAnalyst()
    
    # Test with a stock
    ticker = "NVDA"
    print(f"\n--- 🤖 CLAUDE ANALYZING: {ticker} ---")
    result = analyst.analyze(ticker)
    print("\n⬇️ CLAUDE'S REPORT ⬇️")
    print(result)
