"""Service for converting company names to stock tickers."""

from typing import Optional, Tuple
from difflib import get_close_matches
import yfinance as yf
from anthropic import Anthropic
from app.core.logging_config import get_logger
from app.core.config import settings

logger = get_logger(__name__)

# Common company name to ticker mappings
COMPANY_TO_TICKER = {
    # Tech Giants
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "apple": "AAPL",
    "microsoft": "MSFT",
    "amazon": "AMZN",
    "meta": "META",
    "facebook": "META",
    "netflix": "NFLX",
    "nvidia": "NVDA",
    "nvdia": "NVDA",  # Common misspelling
    "nviida": "NVDA",  # Common misspelling
    "nvida": "NVDA",  # Common misspelling
    "tesla": "TSLA",
    "telsa": "TSLA",  # Common misspelling
    "intel": "INTC",
    "amd": "AMD",
    "ibm": "IBM",
    "oracle": "ORCL",
    "salesforce": "CRM",
    "adobe": "ADBE",
    "cisco": "CSCO",
    "qualcomm": "QCOM",
    "broadcom": "AVGO",
    "paypal": "PYPL",
    "uber": "UBER",
    "lyft": "LYFT",
    "airbnb": "ABNB",
    "spotify": "SPOT",
    "snap": "SNAP",
    "snapchat": "SNAP",
    "twitter": "X",
    "x": "X",
    "pinterest": "PINS",
    "zoom": "ZM",
    "shopify": "SHOP",
    "square": "SQ",
    "block": "SQ",
    "palantir": "PLTR",
    "snowflake": "SNOW",
    "crowdstrike": "CRWD",
    "datadog": "DDOG",
    "servicenow": "NOW",
    "workday": "WDAY",
    "twilio": "TWLO",
    "okta": "OKTA",
    "splunk": "SPLK",
    "mongodb": "MDB",
    "elastic": "ESTC",
    "cloudflare": "NET",
    "docusign": "DOCU",
    "dropbox": "DBX",
    "roblox": "RBLX",
    "unity": "U",
    "coinbase": "COIN",
    "robinhood": "HOOD",

    # Finance
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "chase": "JPM",
    "bank of america": "BAC",
    "bofa": "BAC",
    "wells fargo": "WFC",
    "citigroup": "C",
    "citi": "C",
    "goldman sachs": "GS",
    "goldman": "GS",
    "morgan stanley": "MS",
    "blackrock": "BLK",
    "charles schwab": "SCHW",
    "schwab": "SCHW",
    "visa": "V",
    "mastercard": "MA",
    "american express": "AXP",
    "amex": "AXP",
    "berkshire hathaway": "BRK-B",
    "berkshire": "BRK-B",

    # Retail & Consumer
    "walmart": "WMT",
    "target": "TGT",
    "costco": "COST",
    "home depot": "HD",
    "lowes": "LOW",
    "nike": "NKE",
    "starbucks": "SBUX",
    "mcdonalds": "MCD",
    "coca cola": "KO",
    "coke": "KO",
    "pepsi": "PEP",
    "pepsico": "PEP",
    "disney": "DIS",
    "walt disney": "DIS",
    "netflix": "NFLX",
    "comcast": "CMCSA",
    "att": "T",
    "at&t": "T",
    "verizon": "VZ",
    "t-mobile": "TMUS",

    # Healthcare & Pharma
    "johnson & johnson": "JNJ",
    "j&j": "JNJ",
    "pfizer": "PFE",
    "moderna": "MRNA",
    "merck": "MRK",
    "abbvie": "ABBV",
    "eli lilly": "LLY",
    "lilly": "LLY",
    "bristol myers": "BMY",
    "amgen": "AMGN",
    "gilead": "GILD",
    "regeneron": "REGN",
    "unitedhealth": "UNH",
    "cvs": "CVS",
    "walgreens": "WBA",
    "zoetis": "ZTS",
    "neurocrine": "NBIX",
    "neurocrine biosciences": "NBIX",

    # Energy
    "exxon": "XOM",
    "exxonmobil": "XOM",
    "chevron": "CVX",
    "conocophillips": "COP",
    "shell": "SHEL",
    "bp": "BP",

    # Industrial & Auto
    "boeing": "BA",
    "lockheed martin": "LMT",
    "lockheed": "LMT",
    "raytheon": "RTX",
    "general electric": "GE",
    "ge": "GE",
    "3m": "MMM",
    "caterpillar": "CAT",
    "deere": "DE",
    "john deere": "DE",
    "ford": "F",
    "general motors": "GM",
    "gm": "GM",
    "rivian": "RIVN",
    "lucid": "LCID",

    # Semiconductors
    "tsmc": "TSM",
    "taiwan semiconductor": "TSM",
    "asml": "ASML",
    "applied materials": "AMAT",
    "lam research": "LRCX",
    "micron": "MU",
    "texas instruments": "TXN",
    "marvell": "MRVL",
    "arm": "ARM",

    # ETFs
    "spy": "SPY",
    "s&p 500": "SPY",
    "s&p": "SPY",
    "qqq": "QQQ",
    "nasdaq": "QQQ",
    "dia": "DIA",
    "dow jones": "DIA",
    "dow": "DIA",
    "iwm": "IWM",
    "russell": "IWM",
    "voo": "VOO",
    "arkk": "ARKK",
    "ark": "ARKK",
}


class TickerService:
    """Service for resolving company names to tickers."""

    @staticmethod
    def resolve_ticker(input_str: str) -> str:
        """
        Convert company name to ticker symbol if needed.
        Uses fuzzy matching to auto-correct typos and variations.

        Args:
            input_str: Company name or ticker symbol

        Returns:
            Stock ticker symbol
        """
        # Clean input
        cleaned = input_str.strip().lower()
        logger.info(f"[TickerService] Resolving input: '{input_str}' (cleaned: '{cleaned}')")

        # Check if it's a known company name or misspelling
        if cleaned in COMPANY_TO_TICKER:
            ticker = COMPANY_TO_TICKER[cleaned]
            logger.info(f"[TickerService] EXACT MATCH: '{input_str}' -> {ticker}")
            return ticker

        # Try fuzzy matching for typos (e.g., "zotis" -> "zoetis")
        matches = get_close_matches(cleaned, COMPANY_TO_TICKER.keys(), n=1, cutoff=0.8)
        if matches:
            matched_name = matches[0]
            ticker = COMPANY_TO_TICKER[matched_name]
            logger.info(f"[TickerService] FUZZY MATCH: '{input_str}' -> '{matched_name}' -> {ticker}")
            return ticker

        # Use AI to intelligently find the ticker symbol for ANY company
        try:
            if len(input_str) > 2:  # Skip very short inputs
                logger.info(f"[TickerService] Using AI to resolve ticker for: '{input_str}'")
                ai_ticker = TickerService._ai_lookup_ticker(input_str)
                if ai_ticker:
                    logger.info(f"[TickerService] AI LOOKUP SUCCESS: '{input_str}' -> {ai_ticker}")
                    return ai_ticker
        except Exception as e:
            logger.warning(f"[TickerService] AI lookup failed: {e}")

        # Otherwise assume it's already a ticker
        result = input_str.upper().strip()
        logger.warning(f"[TickerService] NO MATCH - passing through as ticker: '{result}'")
        logger.warning(f"[TickerService] Consider adding '{cleaned}' to COMPANY_TO_TICKER for faster lookup")
        return result

    @staticmethod
    def _ai_lookup_ticker(company_name: str) -> Optional[str]:
        """
        Use Claude AI to intelligently determine the stock ticker for any company.

        Args:
            company_name: The company name to look up

        Returns:
            Stock ticker symbol or None if not found
        """
        try:
            client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            prompt = f"""You are a stock market expert. Given a company name or partial name, return ONLY the stock ticker symbol.

Rules:
- Return ONLY the ticker symbol (e.g., "AAPL", "GOOGL", "MSFT")
- If it's already a ticker symbol, return it as-is
- If the company is not publicly traded or you're not sure, return "UNKNOWN"
- Do not include any explanation, just the ticker symbol

Company name: {company_name}

Ticker symbol:"""

            message = client.messages.create(
                model="claude-3-5-haiku-20241022",  # Use fast, cheap model
                max_tokens=10,
                temperature=0,
                messages=[{"role": "user", "content": prompt}]
            )

            ticker = message.content[0].text.strip().upper()

            # Validate the response
            if ticker and ticker != "UNKNOWN" and len(ticker) <= 5:
                logger.info(f"[TickerService] AI identified ticker: {ticker}")
                return ticker
            else:
                logger.debug(f"[TickerService] AI returned: {ticker}")
                return None

        except Exception as e:
            logger.error(f"[TickerService] AI lookup error: {e}")
            return None

    @staticmethod
    def get_company_name(ticker: str) -> Optional[str]:
        """
        Get company name from ticker (reverse lookup).

        Args:
            ticker: Stock ticker symbol

        Returns:
            Company name or None
        """
        ticker_upper = ticker.upper()
        for name, symbol in COMPANY_TO_TICKER.items():
            if symbol == ticker_upper:
                return name.title()
        return None
