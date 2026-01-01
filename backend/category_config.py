import re
from typing import Dict, Any

MIN_LEN = 20
MAX_LEN = 1000

RX_FIRST = re.compile(r"\b(i|i['’]?m|i am|i['’]?ve|i was|we|we['’]?re|we have)\b", re.I)
RX_EXC = re.compile(
    r"(?isx)"
    r"("
        # Politeness / sign-offs
        r"\b(thanks|thank\s+you|cheers|appreciate\s+(it|that)|"
        r"you're\s+(welcome|welcome\!)|good\s+luck|best\s+wishes)\b"
        r"|"
        # Meta / participation comments
        r"\b(following\s+(this|along)|subscrib(ed|ing)|same\s+here|me\s+too)\b"
        r"|"
        # Contact / moderation instructions
        r"\b(reach\s+out|contact\s+(support|me)|feel\s+free\s+to|let\s+me\s+know|dm\s+me|pm\s+me)\b"
        r"|"
        # Short agreement / reaction words
        r"^(lol|lmao|omg|wow|yep|yeah|ok|okay|sure|cool|nice|agreed|same)$"
        r"|"
        # Links / obvious URLs
        r"https?://\S+"
        r"|"
        # Email addresses
        r"[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
    r")"
)


CFG: Dict[str, Dict[str, Any]] = {
    "painpointsxfrustrations": {
        "expansions": [
            "i'm struggling with", "i can't", "i cannot", "i couldn't",
            "it's hard to", "it's confusing to", "doesn't work",
            "isn't working", "won't work", "keeps crashing",
            "i get an error", "takes too long to", "i'm stuck on", "i keep getting",
            "i have a problem with", "i find it difficult to"
            "problems the user is facing", "issues people are having",
            "things that aren't working", "difficulties or obstacles they encounter",
        ],
        "inc": re.compile(
            r"\b("
            r"can(?:not|['’]?t)|couldn['’]?t|unable|"
            r"struggl\w+|trouble|"
            r"hard\s+to|difficult\s+to|confus\w+|"
            r"problem|issue|bug|error|fail(?:ed|ing|s)?|broke\w*|crash\w*|freez\w*|hang\w*|time(?:d\s+)?out|"
            r"isn['’]?t\s+working|not\s+working|won['’]?t\s+work|doesn['’]?t\s+work|"
            r"keeps?\s+\w+ing|"
            r"stuck|too\s+slow|takes?\s+too\s+long|latency|laggy|"
            r"hurts?|pain|flare[-\s]?ups?|flare\w*"
            r")\b",
            re.I
        ),
        "exc": RX_EXC,
        "require_first": True,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },

    "failed_solutions": {
        "expansions": [
            "i tried", "doesn't work", "no luck", "no relief",
            "didn't help", "still broken", "made it worse",
            "no improvement", "keeps failing", "same issue", 
            "still doesn't work", "every solution i found made it worse",
            "nothing is working", "tried everything", "problem is still there",
            "still dealing with the same issue", "frustrations with the system or process",
            "support didn't help"
        ],
       "inc": re.compile(
            r"\b(?:i(?:\s+have)?\s+tried(?: everything)?|tried(?: all(?: the)? standard fixes)?|attempted|gave (?:it|this) a try|didn['’]?t help|doesn['’]?t work|no relief|no luck|"
            r"still\s+(?:have|facing|dealing\s+with|seeing)?\s+(?:the same|an?other)?\s+(?:problem|issue|pain|symptoms?)|even after|reinstall\w*|followed .* (?:steps|guide|instructions)|keeps \w+ing|"
            r"it broke|supplements?\s+didn['’]?t|doctors?\s+(?:just\s+)?gave me another prescription|prescribed another|nothing\s+(?:I\s+do|helps?)\b|"
            r"medication \w+\s+hasn't helped|made (?:the problem|it) worse|still failed|seen multiple doctors)\b",
            re.I
        ),
        "exc": RX_EXC,              
        "require_first": True,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },

    "desire_and_wish": {
        "expansions" :[
            "i want to", "i just want to", "i'd like to", "i'd love to",
            "i hope to", "i hope i can", "i'm trying to", "so that i can",
            "i wish i could", "my goal is to",
            "i want a", "i want the", "i need a", "i need the",
            "i could really use", "i'm looking for a way to", "i wish this would"
        ],
        "inc": re.compile(
            r"\b(?:"
            r"i\s+(?:just\s+)?want\s+(?:to|a|an|the)\b|"
            r"i['’]d\s+(?:like|love)\s+(?:to|a|an|the)\b|"
            r"i\s+hope\s+(?:to|i\s+can)\b|"
            r"i\s+wish\s+i\s+could\b|"
            r"my\s+goal\s+is\s+to\b|"
            r"i\s+(?:plan\s+to|am\s+planning\s+to|aim\s+to)\b|"
            r"i['’]?m\s+(?:trying|looking)\s+to\b|"
            r"i\s+need\s+(?:to|a|an|the)\b|"
            r"so\s+that\s+i\s+can\b|"
            r"i\s+could\s+really\s+use\b"
            r")",
            re.I
        ),
        "exc": RX_EXC,
        "require_first": True,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },

    "question": {
        "expansions": [
            "how do i", "how can i", "how long does", "how much", "how many",
            "what should i", "what is", "what are", "what if",
            "why does", "why is", "when should i",
            "where can i", "where do i", "which one",
            "can i", "should i", "is it safe", "is this normal", "do i need to",
            "does anyone know", "has anyone", "anyone else", "any advice", "any tips", "eli5",
            "can someone explain", "am i doing it wrong"
        ],
        "inc": re.compile(
            r"(?isx)"
            r"(?:"
            r"\?"
            r"|^\s*(?:"
                r"how|what|why|where|when|who|"
                r"(?:does|did|has|have|would|should|could|will|is|are|was|were)\b"  
                r"|do\s+(?:i|you|we|they)\b"            
                r"|can\s+(?:i|you|anyone)\b"
                r"|any\s+(?:advice|tips)\b|eli5\b"
            r")"
            r")",
            re.I
        ),
        "exc": RX_EXC,
        "require_first": False,
        "min_len": 10,
        "max_len": 200
    },

    "metaphors" : {
        "expansions" : [
            "feels like a dead end",
            "like living in a fog",
            "my brain feels like it’s on dial-up",
            "a constant uphill battle",
            "I’m at the end of my rope",
            "running on empty",
            "feels like I'm hitting a brick wall"
        ],
        "inc": re.compile(
            r"(?:end\ of\ my\ rope|wits'? \s* end|dead\ end|uphill\ battle|brick\ wall|running\ on\ empty|burn(?:ed|t)\ out)"  
            r"|feels?\s+like\s+[^,.;!?]+"  
            r"|it'?s\s+like\s+[^,.;!?]+"  
            r"|as\s+if\s+[^,.;!?]+"  
            r"|(?:is|was|are|were)\s+(?:a|an)\s+(?!post\b|comment\b|rule\b|site\b|link\b|mod\b)[^\d\W][\w'-]+(?:\s+[^\d\W][\w'-]+){0,3}", 
            re.I
        ),
        "exc": RX_EXC,
        "require_first": False,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },

    "practitioner_reference": {
        "expansions": [
            "my chiropractor said",
            "a massage therapist told me",
            "I went to the holistic clinic",
            "my wellness professional",
            "at the chiropractor's office",
            "the massage studio",
            "a physical therapist recommended",
            "I saw an acupuncturist",
            "I went to see a",  
        ],
        "inc": re.compile(
            r"\b(chiropractic|chiropractor|chiro|physio|physical\s+therap(?:y|ist|ists?)|pt\b|"
            r"massage(?:\s+(?:therapy|therapist|therapists?))?|rmt\b|acupunctur\w*|"
            r"osteopath\w*|clinic|practice|practitioner|specialist|provider|yoga\s+studio|"
            r"pemf|pulsed\s+electro(?:-|\s*)magnetic|"
            r"(?:saw|visited|went\s+to|booked|made\s+an\s+appointment\s+with)\s+(?:a|the|my)\s+(?:doctor|md|do|nd))\b",
            re.I
        ),
        "exc": RX_EXC,
        "require_first": False,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },

    "trigger_phrase": {
        "expansions": [
            "that was the last straw",
            "the breaking point for me was",
            "i finally decided to",
            "i knew i had to do something when",
            "that's when i",
            "ever since then i",
            "as soon as that happened i",
            "after that i",
            "because of that i",
            "it made me",
            "the turning point was when"
        ],
        "inc": re.compile(
            r"(?=.*\b(after|when|since|once|because|ever since|as soon as|the moment|the day|that's when|at that point|"
            r"made me|led me to|pushed me to|forced me to)\b)"
            r"(?=.*\b(i|we)\s+(?:decided\s+to|started(?:\s+to)?|began(?:\s+to)?|finally\s+decided\s+to|"
            r"gave\s+(?:it|this)\s+a\s+try|gave\s+in\s+and\s+tried|tried|signed\s+up|made\s+(?:an\s+)?appointment|"
            r"looked\s+into|researched|switched|went\s+to|bought|ordered|booked|reached\s+out|messaged\s+support|"
            r"called|saw\s+(?:a|my)))",
            re.I
        ),
        "exc": RX_EXC,
        "require_first": True,
        "min_len": MIN_LEN,
        "max_len": MAX_LEN
    },
}

