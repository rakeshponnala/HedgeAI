"""Quick test of fuzzy matching feature."""

from app.services.ticker_service import TickerService

# Test cases
test_cases = [
    # Exact matches
    ("zoetis", "ZTS", "Exact match - lowercase"),
    ("Zoetis", "ZTS", "Exact match - capitalized"),

    # Typos that should fuzzy match
    ("zotis", "ZTS", "Fuzzy match - missing 'e'"),
    ("zoetiss", "ZTS", "Fuzzy match - extra 's'"),
    ("gogle", "GOOGL", "Fuzzy match - Google typo"),
    ("microsft", "MSFT", "Fuzzy match - Microsoft typo"),
    ("teslla", "TSLA", "Fuzzy match - Tesla typo"),

    # Already valid tickers
    ("AAPL", "AAPL", "Pass-through - valid ticker"),
    ("NVDA", "NVDA", "Pass-through - valid ticker"),
]

print("Testing Fuzzy Matching Feature")
print("=" * 60)

for input_str, expected, description in test_cases:
    result = TickerService.resolve_ticker(input_str)
    status = "✓" if result == expected else "✗"
    print(f"{status} {description}")
    print(f"  Input: '{input_str}' -> Output: '{result}' (Expected: '{expected}')")
    if result != expected:
        print(f"  ⚠️  MISMATCH!")
    print()

print("=" * 60)
print("Test Complete!")
