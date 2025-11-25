from anthropic import Anthropic

from app.core.config import settings
from app.services.data_service import DataService


class AnalysisService:
    """Service for AI-powered stock risk analysis."""

    SYSTEM_PROMPT = """You are a cynical, risk-focused hedge fund analyst.
Your job is to protect capital by identifying DOWNSIDE risks.
You do not cheerlead."""

    USER_PROMPT_TEMPLATE = """
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
"""

    def __init__(self):
        """Initialize the analysis service with Anthropic client."""
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError(
                "Missing API Key. Please add ANTHROPIC_API_KEY to your .env file."
            )

        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.AI_MODEL_NAME
        self.data_service = DataService()

        print(f"[AnalysisService] Initialized with model: {self.model}")

    def analyze(self, ticker: str) -> str:
        """
        Perform AI-powered risk analysis on a stock.

        Args:
            ticker: Stock ticker symbol

        Returns:
            AI-generated risk assessment memo
        """
        # Fetch real-time data
        data = self.data_service.fetch_stock_data(ticker)

        # Construct prompt with real data
        user_message = self.USER_PROMPT_TEMPLATE.format(
            ticker=ticker,
            price=data["price"],
            news=data["news"]
        )

        print(f"[AnalysisService] Sending request to {self.model}...")

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=settings.AI_MAX_TOKENS,
                temperature=settings.AI_TEMPERATURE,
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}]
            )
            return response.content[0].text

        except Exception as e:
            error_msg = f"Analysis failed: {str(e)}"
            print(f"[AnalysisService] {error_msg}")
            raise RuntimeError(error_msg)
