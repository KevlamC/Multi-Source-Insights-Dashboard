import re
from typing import Optional

# Precompiled regexes for performance
PUNCT_OR_SYMBOLS_RE = re.compile(r'^\W+$', re.UNICODE)
WHITESPACE_RE = re.compile(r'^\s*$')

# Comment length threshold
LENGTH_THRES = 30

def is_useless_comment(text: str) -> Optional[str]:
    if not text:
        return "empty_or_none"

    try:
        text = text.strip()

        if len(text) < LENGTH_THRES: return "too_short"
        
        # New rule: filter comments containing "Bot message:"
        if "bot message:" in text.lower():
            return "bot_message"
        
        # Uncomment other rules if needed
        if WHITESPACE_RE.match(text): return "whitespace_only"

        if PUNCT_OR_SYMBOLS_RE.match(text): return "punct_or_symbols_only"

        if all(not c.isalnum() for c in text): return "emoji_or_symbols_only"

        if len(set(text.lower())) <= 3: return "low_char_diversity"
        return None
    except Exception as e:
        return f"error: {e}"
