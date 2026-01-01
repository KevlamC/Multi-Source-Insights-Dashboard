import time
import spacy
import psutil
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
from typing import List, Dict, Optional
from transformers import pipeline
from transformers import AutoTokenizer
import numpy as np
import yake
import logging


# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

BATCH_SIZE = 20
MAX_WORKER_PER_ATTRIBUTE = 5

process = psutil.Process(os.getpid())

# It's generally good practice to load spaCy models once globally for performance.
# However, for pure isolation of ONNX issues, ensure this doesn't cause a separate crash.
# If `spacy.load` itself causes an issue, you may temporarily comment this out too.
try:
    logger.info("Starting spaCy model loading...")
    nlp = spacy.load("en_core_web_sm")
    logger.info("SpaCy model loaded successfully")
except Exception as e:
    logger.error(f"Error loading spaCy model: {e}. Some text processing may be skipped.")
    nlp = None # Set to None if loading fails

# --- Emotions extractor ---
# Load model and tokenizer (COMMENTED OUT ONNX-related loading for debugging)
# model_id = "minuva/MiniLMv2-goemotions-v2"
# onnx_model_id = "minuva/MiniLMv2-goemotions-v2-onnx"
# try:
#     model = ORTModelForSequenceClassification.from_pretrained(onnx_model_id, provider="CPUExecutionProvider")
#     tokenizer = AutoTokenizer.from_pretrained(onnx_model_id, use_fast=True, model_max_length=256, truncation=True, padding='max_length')
#     # Initialize the pipeline
#     emotion_model = pipeline(
#         "text-classification",
#         model=model,
#         tokenizer=tokenizer,
#         top_k=None,
#         function_to_apply="sigmoid",
#         device=-1
#     )
#     print("ONNX-based emotion model loaded successfully (debugging).")
# except Exception as e:
#     print(f"Error loading ONNX-based emotion model: {e}. Emotion analysis will use dummy data.")
#     model = None
#     tokenizer = None
#     emotion_model = None

# Emotion labels mapping (kept for potential future use or if other parts depend on it)
id2label_map = {
    0: 'admiration', 1: 'amusement', 2: 'anger', 3: 'annoyance', 4: 'approval', 5: 'caring',
    6: 'confusion', 7: 'curiosity', 8: 'desire', 9: 'disappointment', 10: 'disapproval',
    11: 'disgust', 12: 'embarrassment', 13: 'excitement', 14: 'fear', 15: 'gratitude',
    16: 'grief', 17: 'joy', 18: 'love', 19: 'nervousness', 20: 'optimism', 21: 'pride',
    22: 'realization', 23: 'relief', 24: 'remorse', 25: 'sadness', 26: 'surprise', 27: 'neutral'
}

def analyze_emotions_sync(comments: List[Dict]) -> List[Dict]:
    # Temporarily return dummy data for debugging when ONNX is disabled
    enriched_comments = []
    for comment in comments:
        enriched_comments.append({
            **comment,
            "emotions": {"neutral": 1.0, "debugging_mode": True} # Dummy emotion
        })
    return enriched_comments

def get_emotion_scores_sync(text: str) -> Dict[str, float]:
    # Temporarily return dummy data for debugging when ONNX is disabled
    return {"neutral": 1.0, "debugging_mode": True}


# --- Desire/Wish extractor ---
_desire_pattern = re.compile(
    r"("
    r"\bI (?:wish|want|hope|would like|long for|yearn for|desire)\b.*|"
    r"\bMy dream (?:is|would be|has always been)\b.*|"
    r"\bI(?:'d| would) love to\b.*|"
    r"\bI(?:'d| would) prefer to\b.*|"
    r"\bIf only I could\b.*|"
    r"\bIt would be (?:great|nice|amazing|wonderful) if\b.*|"
    r"\bI(?:'m| am) looking forward to\b.*|"
    r"\bI(?:'m| am) eager to\b.*|"
    r"\bI(?:'m| am) aiming to\b.*|"
    r"\bI(?:'m| am) planning to\b.*|"
    r"\bI(?:'m| am) hoping to\b.*|"
    r"\bI(?:'d| would) be happy to\b.*|"
    r"\bI(?:'d| would) be glad to\b.*|"
    r"\bIf I could\b.*|"
    r"\bIf I had the chance\b.*|"
    r"\bIf I had the opportunity\b.*|"
    r"\bOne day I hope to\b.*"
    r")",
    re.IGNORECASE,
)

def extract_desire_sync(text: str) -> Optional[str]:
    match = _desire_pattern.search(text)
    if match:
        return match.group(0).strip()
    return None


def extract_desire_batch_sync(comments: List[Dict], max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    texts = [c["body"] for c in comments]

    def batch_run(text_list: List[str]) -> List[Optional[str]]:
        return [extract_desire_sync(text) for text in text_list]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        chunk_size = max(1, len(texts) // max_workers)
        chunks = [texts[i:i+chunk_size] for i in range(0, len(texts), chunk_size)]
        results = []
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    return [
        {**comment, "desire_and_wish": desire}
        for comment, desire in zip(comments, results)
    ]


# --- Failed solution extractor ---
negative_phrases = [
    "confused", "frustrated", "disappointed", "unsatisfied", "unhappy", "dissatisfied",
    "regret", "dislike", "disappointed", "concerned", "worried", "annoyed", "fed up",
    "not helpful", "not useful", "no benefit", "no improvement"
]
negative_phrases_re = "|".join(map(re.escape, negative_phrases))
_failed_solution_patterns = [
    re.compile(r"\btried\b.*?\bbut\b.*", re.IGNORECASE),
    re.compile(r"\battempted\b.*?\bbut\b.*", re.IGNORECASE),
    re.compile(r"\bgave\b.*?\btry\b.*?\bbut\b.*", re.IGNORECASE),

    re.compile(r"\btried\b.*?\b(not work(?:ing)?|failed|unsuccessful|no success|didn't help|did not help)\b.*", re.IGNORECASE),
    re.compile(r"\battempted\b.*?\b(not work(?:ing)?|failed|unsuccessful|no success|didn't help|did not help)\b.*", re.IGNORECASE),

    re.compile(r"\b(not work(?:ing)?|doesn't work|didn't work|won't work|cannot work|couldn't work|failed|broken|useless)\b.*", re.IGNORECASE),

    re.compile(r"\bwithout success\b.*", re.IGNORECASE),
    re.compile(r"\bno luck\b.*", re.IGNORECASE),

    re.compile(rf"after (trying|using|attempting|testing|installing|applying) .*?,? I feel ({negative_phrases_re})(?: about .*?)?\.?", re.IGNORECASE),
    re.compile(rf"I feel ({negative_phrases_re})(?: after .*?)?\.?", re.IGNORECASE),
]

def extract_failed_solution_sync(text: str) -> Optional[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for sent in sentences:
        for pattern in _failed_solution_patterns:
            match = pattern.search(sent)
            if match:
                return match.group(0).strip()
    return None

def extract_failed_solution_batch_sync(comments: List[Dict], max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    texts = [c["body"] for c in comments]

    def batch_run(text_list: List[str]) -> List[Optional[str]]:
        results = []
        for text in text_list:
            sentences = re.split(r'(?<=[.!?])\s+', text)
            found = None
            for sent in sentences:
                for pattern in _failed_solution_patterns:
                    match = pattern.search(sent)
                    if match:
                        found = match.group(0).strip()
                        break
                if found:
                    break
            results.append(found)
        return results

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        chunk_size = max(1, len(texts) // max_workers)
        chunks = [texts[i:i + chunk_size] for i in range(0, len(texts), chunk_size)]
        results = []
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    return [
        {**comment, "failed_solution": fs}
        for comment, fs in zip(comments, results)
    ]


# --- Metaphor extractor ---
_kw_extractor = yake.KeywordExtractor(n=2, top=5)
metaphor_clues = [
    "storm", "ocean", "wave", "river", "sea", "wind", "flame", "fire", "ice", "snow", "cloud", "sun", "moon", "star",
    "light", "dark", "shadow", "earthquake", "volcano", "thunder", "lightning",
    "burning", "explosion", "melting", "freezing", "boiling", "spark", "crushing", "drowning", "bleeding", "suffocating",
    "battle", "war", "fight", "soldier", "weapon", "armor", "enemy",
    "road", "path", "journey", "bridge", "mountain", "valley", "horizon", "labyrinth",
    "mirror", "prison", "cage", "chains", "trap", "door", "window",
    "dagger", "sword", "sunshine", "somersault", "shattered glass"
]

_metaphor_clues_re = re.compile(
    r'\b(' + '|'.join(re.escape(clue) for clue in metaphor_clues) + r')\b',
    re.IGNORECASE
)
_simile_re = re.compile(
    r'\b(?:like|resembles|is a)\b\s+(?:\w+\s?){1,3}'
    r'|'
    r'\bas\s+\w+(?:\s+\w+)?\s+as\s+\w+(?:\s+\w+)?\b',
    re.IGNORECASE
)

def extract_metaphor_fast_sync(text: str, max_results=3) -> List[str]:
    matches = _metaphor_clues_re.findall(text)
    matches += _simile_re.findall(text)
    unique = []
    for m in matches:
        m_norm = m.lower().strip()
        if m_norm not in unique:
            unique.append(m_norm)
            if len(unique) >= max_results:
                break
    return unique

def extract_metaphor_yake_sync(text: str, max_results=3) -> List[str]:
    keywords = _kw_extractor.extract_keywords(text)
    out = []
    for kw, score in keywords:
        if _metaphor_clues_re.search(kw) or _simile_re.search(kw):
            out.append(kw)
            if len(out) >= max_results:
                break
    return out

def extract_metaphor_hybrid_sync(text: str, max_results=3) -> List[str]:
    fast = extract_metaphor_fast_sync(text, max_results=max_results)
    if fast:
        return fast
    return extract_metaphor_yake_sync(text, max_results=max_results)

def extract_metaphors_batch_sync(comments: List[Dict], max_results=3) -> List[Dict]:
    enriched_comments = []
    for comment in comments:
        text = comment["body"]
        metaphors = extract_metaphor_hybrid_sync(text, max_results=max_results)
        enriched_comments.append({**comment, "metaphors": metaphors})
    return enriched_comments


# --- Painpoint/Frustration extractor ---
frustration_keywords = [
    "can't", "cannot", "problem", "issue", "hard to", "difficult", "confusing", "frustrating", "annoying",
    "tedious", "time-consuming", "slow", "inefficient", "unreliable", "unstable", "bug", "glitch",
    "stuck", "blocked", "preventing", "stop me from", "unable to", "not working", "doesn't work",
    "won't work", "failed", "failure", "broken", "crash", "crashed", "error", "errors",
    "hate", "dislike", "annoyed", "overwhelmed", "struggling", "painful", "upset", "stressful",
    "complex", "complicated", "overcomplicated", "messy", "clunky", "unintuitive", "poorly designed",
    "takes too long", "too much work", "requires too much", "need to", "have to", "forced to"
]
frustration_pattern = re.compile(r'(' + '|'.join(re.escape(k) for k in frustration_keywords) + r')', re.IGNORECASE)

def extract_painpoint_doc(doc) -> Optional[str]:
    for sent in doc.sents:
        if frustration_pattern.search(sent.text):
            return sent.text.strip()
    return None

def extract_painpoint_batch_sync(comments: List[Dict], docs: List, max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    def batch_run(docs_chunk):
        return [extract_painpoint_doc(doc) for doc in docs_chunk]

    chunk_size = max(1, len(docs) // max_workers)
    chunks = [docs[i:i + chunk_size] for i in range(0, len(docs), chunk_size)]

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    return [
        {**comment, "painpointsxfrustrations": pp}
        for comment, pp in zip(comments, results)
    ]


# --- Practitioner reference extractor ---
PRACTITIONER_TYPES = [
    "doctor", "physician", "surgeon", "nurse", "dentist", "optometrist", "ophthalmologist",
    "pharmacist", "dietitian", "nutritionist", "paramedic", "midwife", "veterinarian",
    "therapist", "counselor", "psychologist", "psychiatrist", "social worker",
    "physiotherapist", "physical therapist", "occupational therapist", "chiropractor",
    "acupuncturist", "massage therapist", "speech therapist", "personal trainer", "fitness coach",
    "life coach", "wellness coach", "health coach",
    "teacher", "professor", "tutor", "instructor", "mentor", "educator",
    "engineer", "architect", "technician", "mechanic", "consultant", "specialist"
]
def extract_practitioner_doc(doc) -> Dict[str, Optional[str]]:
    for ent in doc.ents:
        ent_text = ent.text.lower()
        for p_type in PRACTITIONER_TYPES:
            if p_type in ent_text:
                return {
                    "practitioner_type": p_type,
                    "practitioner_reference": ent.sent.text.strip()
                }

    for sent in doc.sents:
        sent_text = sent.text.lower()
        for p_type in PRACTITIONER_TYPES:
            if p_type in sent_text:
                return {
                    "practitioner_type": p_type,
                    "practitioner_reference": sent.text.strip()
                }

    return {"practitioner_type": None, "practitioner_reference": None}


def extract_practitioner_batch_sync(comments: List[Dict], docs: List, max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    def batch_run(docs_chunk):
        return [extract_practitioner_doc(doc) for doc in docs_chunk]

    chunk_size = max(1, len(docs) // max_workers)
    chunks = [docs[i:i + chunk_size] for i in range(0, len(docs), chunk_size)]

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    enriched_comments = [
        {**comment, "practitioner_reference": result}
        for comment, result in zip(comments, results)
    ]
    return enriched_comments


# --- Question extractor ---
QUESTION_PATTERNS = [
    r"^\s*(?:can|could|would|will|do|does|did|is|are|was|were|should|shall|may|might|have|has|had)\b.*",
    r"^\s*(?:who|what|when|where|why|how)\b.*",
    r".*\bi wonder\b.*",
    r".*\bdo you know\b.*",
]
def extract_question_sync(text: str) -> str | None:
    sentences = re.split(r"(?<=[.?!])\s+", text)
    for sent in sentences:
        stripped = sent.strip()
        if stripped.endswith("?"):
            return stripped
        for pat in QUESTION_PATTERNS:
            if re.match(pat, stripped, re.IGNORECASE):
                return stripped.rstrip(".!?")
    return None

def extract_question_batch_sync(comments: List[Dict], max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    texts = [c["body"] for c in comments]

    def batch_run(text_list: List[str]) -> List[Optional[str]]:
        results = []
        for text in text_list:
            sentences = re.split(r"(?<=[.?!])\s+", text)
            found = None
            for sent in sentences:
                stripped = sent.strip()
                if stripped.endswith("?"):
                    found = stripped
                    break
                for pat in QUESTION_PATTERNS:
                    if re.match(pat, stripped, re.IGNORECASE):
                        found = stripped.rstrip(".!?")
                        break
                if found:
                    break
            results.append(found)
        return results

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        chunk_size = max(1, len(texts) // max_workers)
        chunks = [texts[i:i + chunk_size] for i in range(0, len(texts), chunk_size)]
        results = []
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    enriched_comments = [
        {**comment, "question": q}
        for comment, q in zip(comments, results)
    ]
    return enriched_comments

# --- Topic scoring (expanded keyword list) ---
TOPIC_KEYWORDS = {
    "health": [
        "doctor", "pain", "injury", "exercise", "hospital", "nurse", "treatment", "therapy",
        "surgery", "medicine", "medication", "disease", "illness", "recovery", "clinic",
        "mental health", "stress", "anxiety", "depression", "fitness", "workout"
    ],
    "work": [
        "job", "manager", "deadline", "office", "boss", "coworker", "colleague", "salary",
        "promotion", "career", "internship", "meeting", "overtime", "project", "task",
        "workplace", "employment", "resignation", "fired", "hired"
    ],
    "technology": [
        "app", "software", "computer", "device", "AI", "artificial intelligence", "machine learning",
        "smartphone", "laptop", "tablet", "programming", "coding", "developer", "bug",
        "update", "server", "database", "internet", "cloud", "cybersecurity"
    ],
    "education": [
        "school", "university", "college", "student", "teacher", "professor", "class", "lecture",
        "homework", "assignment", "exam", "test", "study", "degree", "diploma", "course", "online learning"
    ],
    "finance": [
        "money", "budget", "salary", "tax", "bank", "loan", "credit", "debt", "investment",
        "stocks", "cryptocurrency", "bitcoin", "savings", "interest rate", "mortgage", "payment", "income"
    ],
    "relationships": [
        "friend", "boyfriend", "girlfriend", "husband", "wife", "partner", "relationship",
        "marriage", "dating", "breakup", "divorce", "love", "romance", "family", "parent", "child"
    ],
    "travel": [
        "trip", "vacation", "holiday", "flight", "airport", "hotel", "tour", "beach", "mountain",
        "hiking", "camping", "cruise", "road trip", "destination", "passport", "visa"
    ],
    "food": [
        "restaurant", "meal", "breakfast", "lunch", "dinner", "snack", "cooking", "recipe",
        "baking", "drink", "coffee", "tea", "pizza", "burger", "dessert", "fruit", "vegetable"
    ],
    "politics": [
        "government", "president", "prime minister", "election", "vote", "policy", "law",
        "politician", "party", "democracy", "parliament", "congress", "campaign", "protest"
    ],
    "sports": [
        "game", "match", "tournament", "league", "team", "player", "coach", "score",
        "goal", "win", "lose", "draw", "training", "championship", "competition", "stadium"
    ],
    "environment": [
        "climate", "pollution", "recycling", "sustainability", "green", "eco", "carbon",
        "emissions", "wildlife", "forest", "ocean", "plastic", "nature", "energy", "renewable"
    ],
    "shopping": [
        "store", "shop", "mall", "product", "purchase", "buy", "sale", "discount",
        "price", "order", "cart", "delivery", "return", "refund"
    ]
}

def extract_topics_sync(text: str) -> Dict[str, float]:
    scores = {}
    text_lower = text.lower()
    words = text.split()
    length = len(words) if words else 1
    for topic, keywords in TOPIC_KEYWORDS.items():
        count = sum(text_lower.count(w) for w in keywords)
        if count > 0:
            scores[topic] = count / length
    return scores

def extract_topics_batch_sync(comments: List[Dict], max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    texts = [c["body"] for c in comments]

    def batch_run(text_list: List[str]) -> List[Dict[str, float]]:
        return [extract_topics_sync(text) for text in text_list]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        chunk_size = max(1, len(texts) // max_workers)
        chunks = [texts[i:i + chunk_size] for i in range(0, len(texts), chunk_size)]
        results = []
        for chunk_results in executor.map(batch_run, chunks):
            results.extend(chunk_results)

    enriched_comments = [
        {**comment, "topics": topic_scores}
        for comment, topic_scores in zip(comments, results)
    ]
    return enriched_comments


# --- Trigger Phrase Extractor ---
def extract_trigger_phrase_doc_sync(doc) -> Optional[str]:
    # Temporarily return dummy for debugging when ONNX is disabled
    # Original logic relies on get_emotion_scores_sync, which is now dummy
    return "Dummy trigger phrase (debugging mode)"

def extract_trigger_phrase_batch_sync(comments: List[Dict], docs: List, max_workers: int = MAX_WORKER_PER_ATTRIBUTE) -> List[Dict]:
    enriched_comments = []
    for comment in comments:
        # Temporarily return dummy for debugging when ONNX is disabled
        enriched_comments.append({
            **comment,
            "trigger_phrase": "Dummy trigger phrase (debugging mode)"
        })
    return enriched_comments


# ====================== ALL ====================== #
MAX_WORKER_PER_BATCH = 9

def analyze_comments_batch_sync(comments: list[dict], max_workers: int = MAX_WORKER_PER_BATCH) -> list[dict]:
    """
    using threads for each attribute.
    Returns list of comments enriched with attributes.
    Logs time for each attribute after the batch finishes.
    """
    start_batch = time.time()

    MAX_CHARS = 2000
    # Ensure nlp model is loaded before attempting to use it
    if nlp is None:
        print("SpaCy model not loaded, skipping NLP processing for analyzer_client.")
        docs = [None] * len(comments) # Provide dummy docs if nlp is not available
    else:
        logger.info("Starting spaCy document processing...")
        docs = [nlp(comment["body"][:MAX_CHARS]) for comment in comments]
        logger.info("SpaCy document processing finished.")


    def timed_wrapper(func, *args):
        t0 = time.time()
        result = func(*args)
        t1 = time.time()
        return result, t1 - t0

    functions = [
        ("emotions", analyze_emotions_sync, [comments]),
        ("desires", extract_desire_batch_sync, [comments]),
        ("failed_solutions", extract_failed_solution_batch_sync, [comments]),
        ("metaphors", extract_metaphors_batch_sync, [comments]),
        # Only pass docs if nlp is loaded, otherwise pass comments (or an empty list if not needed)
        ("painpoints", extract_painpoint_batch_sync, [comments, docs if nlp else []]),
        ("practitioners", extract_practitioner_batch_sync, [comments, docs if nlp else []]),
        ("questions", extract_question_batch_sync, [comments]),
        ("topics", extract_topics_batch_sync, [comments]),
        ("triggers", extract_trigger_phrase_batch_sync, [comments, docs if nlp else []]),
    ]

    results_dict = {}
    timing_dict = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_name = {
            executor.submit(timed_wrapper, func, *args): name for name, func, args in functions
        }

        for future in as_completed(future_to_name):
            name = future_to_name[future]
            try:
                result, elapsed = future.result()
                results_dict[name] = result
                timing_dict[name] = elapsed
            except Exception as e:
                results_dict[name] = None
                timing_dict[name] = None
                print(f"[analyzer] {name} failed: {e}")

    total_time = time.time() - start_batch

    print(f"[analyzer] Batch finished in {total_time:.3f}s")
    for attr, t in timing_dict.items():
        if t is not None:
            print(f"  {attr}: {t:.3f}s")
        else:
            print(f"  {attr}: failed")

    enriched_comments = []
    for idx, comment in enumerate(comments):
        for attr_name in results_dict:
            # Safely check if result is available and comment ID matches
            if results_dict[attr_name] is not None and \
               idx < len(results_dict[attr_name]) and \
               results_dict[attr_name][idx] is not None and \
               "id" in results_dict[attr_name][idx] and \
               results_dict[attr_name][idx]["id"] != comment["id"]:
                print(f"WARNING: ID mismatch at index {idx} for {attr_name}. Expected {comment['id']}, got {results_dict[attr_name][idx]['id']}")
                # Optionally, you might want to raise an error or handle this more robustly
                # raise ValueError(f"ID mismatch at index {idx} for {attr_name}")


        enriched_comments.append({
            **comment,
            "emotions": results_dict["emotions"][idx].get("emotions") if results_dict.get("emotions") and idx < len(results_dict["emotions"]) else None,
            "desire_and_wish": results_dict["desires"][idx].get("desire_and_wish") if results_dict.get("desires") and idx < len(results_dict["desires"]) else None,
            "painpointsxfrustrations": results_dict["painpoints"][idx].get("painpointsxfrustrations") if results_dict.get("painpoints") and idx < len(results_dict["painpoints"]) else None,
            "practitioner_reference": (
                None
                if not results_dict.get("practitioners")
                or idx >= len(results_dict["practitioners"])
                or not results_dict["practitioners"][idx]
                or (
                    isinstance(results_dict["practitioners"][idx].get("practitioner_reference"), dict)
                    and results_dict["practitioners"][idx]["practitioner_reference"].get("practitioner_type") is None
                    and results_dict["practitioners"][idx]["practitioner_reference"].get("practitioner_reference") is None
                )
                else results_dict["practitioners"][idx].get("practitioner_reference")
            ),
            "trigger_phrase": results_dict["triggers"][idx].get("trigger_phrase") if results_dict.get("triggers") and idx < len(results_dict["triggers"]) else None,
            "question": results_dict["questions"][idx].get("question") if results_dict.get("questions") and idx < len(results_dict["questions"]) else None,
            "failed_solution": results_dict["failed_solutions"][idx].get("failed_solution") if results_dict.get("failed_solutions") and idx < len(results_dict["failed_solutions"]) else None,
            "topics": results_dict["topics"][idx].get("topics") if results_dict.get("topics") and idx < len(results_dict["topics"]) else None,
            "metaphors": results_dict["metaphors"][idx].get("metaphors") if results_dict.get("metaphors") and idx < len(results_dict["metaphors"]) else None,
        })

    return enriched_comments