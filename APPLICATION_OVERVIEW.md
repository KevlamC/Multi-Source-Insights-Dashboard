# AICxAlphaWave Application Overview

## What This Application Is

AICxAlphaWave is a **Reddit comment analysis platform** that scrapes, processes, and visualizes health-related discussions from Reddit. It uses AI/ML to extract insights about user pain points, emotions, failed solutions, desires, metaphors, practitioner references, triggers, and questions from natural language text.

The platform is designed for **market research and consumer insights** - understanding what real people are saying about health topics, what problems they face, what solutions have failed them, and what they truly want.

---

## Core Functionality

### 1. Reddit Scraping
- Scrapes comments from specified subreddits (e.g., r/gout, r/insomnia, r/chronicpain)
- Uses Reddit's PRAW API with OAuth authentication
- Configurable subreddit targets, time ranges, and keyword filters
- Stores raw scraped data as CSV files

### 2. AI-Powered Comment Analysis
Each scraped comment is analyzed to extract:

| Feature | Description | Example Output |
|---------|-------------|----------------|
| **Emotions** | Detected emotional sentiment | `{"sadness": 0.85, "frustration": 0.72}` |
| **Pain Points** | Problems/struggles mentioned | "can't sleep at night", "medication side effects" |
| **Failed Solutions** | Things that didn't work | "melatonin stopped working", "therapy didn't help" |
| **Desires/Wishes** | What users want | "I just want to sleep through the night" |
| **Metaphors** | Figurative language used | "my brain is on fire", "trapped in my own body" |
| **Practitioner References** | Mentions of healthcare providers | "my doctor said...", "the rheumatologist recommended..." |
| **Triggers** | Events that cause action | "when the pain gets unbearable", "after seeing the specialist" |
| **Questions** | Questions users are asking | "has anyone tried X?", "is this normal?" |

### 3. Vector Embeddings & Semantic Search
- Comments are vectorized using `sentence-transformers/multi-qa-MiniLM-L6-cos-v1`
- Vectors are stored in Supabase (PostgreSQL with pgvector extension)
- Enables semantic similarity search for finding related comments
- Powers the AI chatbot's context retrieval

### 4. AI Chatbot
- Users can ask questions about the analyzed data
- Uses Gemini 1.5 Flash API for response generation
- Retrieves relevant comments via vector similarity search
- Generates insights based on actual Reddit discussions

### 5. Data Visualization Dashboard
- 7 specialized views for different insight types
- Interactive filtering by subreddit, emotion, intensity, time, topic
- Emotion sunburst chart for visualizing emotion distribution
- Export functionality for filtered data

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. SCRAPING PHASE
   Reddit API ──► reddit_scraper.py ──► Raw Comments (in memory)
   
2. ANALYSIS PHASE
   Raw Comments ──► filter_comment.py ──► Analyzed Comments
                    │
                    ├── Emotion Detection (custom model)
                    ├── Pain Point Extraction
                    ├── Failed Solution Detection
                    ├── Desire/Wish Extraction
                    ├── Metaphor Detection
                    ├── Practitioner Reference Detection
                    ├── Trigger Phrase Detection
                    └── Question Detection

3. VECTORIZATION PHASE
   Analyzed Comments ──► vectorise_comment.py ──► Vector Embeddings
                         │
                         └── sentence-transformers model
                             (multi-qa-MiniLM-L6-cos-v1)

4. STORAGE PHASE
   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │  CSV File ──► Brotli Compression ──► S3 Bucket         │
   │  (full data)     (.csv.br)            (data storage)    │
   │                                                         │
   │  Vector Embeddings ──► Supabase (pgvector)             │
   │  (for semantic search)                                  │
   │                                                         │
   └─────────────────────────────────────────────────────────┘

5. RETRIEVAL PHASE
   Frontend Request ──► FastAPI Backend
                        │
                        ├── Download from S3
                        ├── Decompress Brotli
                        ├── Apply Filters
                        ├── Re-compress
                        ├── Upload filtered to S3
                        └── Return S3 URL to frontend

6. AI CHAT PHASE
   User Question ──► Backend
                     │
                     ├── Embed question (same model)
                     ├── Query Supabase for similar vectors
                     ├── Retrieve matching comments
                     ├── Send to Gemini API with context
                     └── Return AI-generated response
```

---

## Data Schemas

### Raw Scraped Comment (CSV Columns)
```
id                  - Reddit comment ID
post_id             - Parent post ID
subreddit           - Source subreddit name
author              - Reddit username
body                - Comment text content
created_utc         - Unix timestamp
score               - Reddit upvotes/downvotes
```

### Analyzed Comment (Additional Columns)
```
emotions            - JSON object with emotion scores
                      e.g., {"sadness": 0.85, "anger": 0.3, "fear": 0.5}
pain_point          - Extracted pain point phrase or null
failed_solution     - Extracted failed solution or null
desire_wish         - Extracted desire/wish or null
metaphor            - Extracted metaphor phrase or null
practitioner_reference - Extracted practitioner mention or null
trigger_phrase      - Extracted trigger phrase or null
question            - Extracted question or null
topics              - JSON array of detected topics
                      e.g., ["medication", "sleep", "chronic_pain"]
intensity           - Overall emotional intensity (0.0 to 1.0)
```

### Vector Table (Supabase)
```sql
CREATE TABLE comment_vectors (
    id              SERIAL PRIMARY KEY,
    comment_id      TEXT NOT NULL,
    subreddit       TEXT,
    body            TEXT,
    embedding       VECTOR(384),  -- MiniLM produces 384-dim vectors
    feature_type    TEXT,         -- 'painpoint', 'emotion', 'question', etc.
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### Frontend Data Interfaces (TypeScript)
```typescript
interface ScraperCommentItem {
    id: string;
    author: string;
    subreddit: string;
    comment: string;
    upvotes: number;
    emotion: string;
    timestamp: string;
}

interface PainpointsItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    painpoint: string;
}

interface FailedSolutionItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    failedSolution: string;
}

interface DesireWishesItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    desire_wish: string;
}

interface MetaphorData extends ScraperCommentItem {
    intensity: number;
    topic: string;
    metaphorPhrase: string;
}

interface PractitionerItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    practitioner_type: string;  // 'doctor', 'specialist', 'therapist', etc.
}

interface TriggersItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    triggerPhrase: string;
}

interface QuestionItem extends ScraperCommentItem {
    intensity: number;
    topic: string;
    question: string;
}
```

---

## API Endpoints

### Scraping
- `POST /scrape_comments` - Initiate Reddit scrape with parameters
- `POST /use_prev_data` - Load previously scraped data from S3

### Data Retrieval
- `POST /get_filtered_cmts` - Get filtered comments with S3 URLs
- `GET /export_data` - Export filtered data as downloadable file

### AI Chat
- `POST /ai/chat` - Send message to AI chatbot, get insights

### Emotion Analysis
- `GET /get_emotion_clusters_one` - Get unique emotions
- `POST /get_comments_by_emotion_one` - Get comments by emotion
- `GET /get_emotion_counts` - Get emotion distribution

### Writeup Generation
- `POST /generate_writeup` - Generate AI summary for specific emotion

### Health
- `GET /health` - Health check endpoint

---

## Filter Parameters

The filtering system accepts these parameters:

```python
class FilterRequest(BaseModel):
    subreddits: Optional[List[str]]      # ["gout", "insomnia"]
    emotions: Optional[List[str]]         # ["sadness", "frustration"]
    topics: Optional[List[str]]           # ["medication", "sleep"]
    practitioner_types: Optional[List[str]] # ["doctor", "specialist"]
    min_intensity: Optional[float]        # 0.0 to 1.0
    time: Optional[str]                   # "past_day", "past_week", "past_month", "past_year", "all"
    keyword: Optional[str]                # Free text search
    
    # Feature-specific flags
    failed_solutions: Optional[bool]
    desire_and_wish: Optional[bool]
    metaphores: Optional[bool]
    practitioner_reference: Optional[bool]
    trigger_phrase: Optional[bool]
    question: Optional[bool]
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI (Python)
- **ML Model:** sentence-transformers/multi-qa-MiniLM-L6-cos-v1 (384-dim embeddings)
- **AI API:** Google Gemini 1.5 Flash
- **Database:** Supabase (PostgreSQL + pgvector)
- **Object Storage:** AWS S3
- **Compression:** Brotli (.csv.br files)
- **Reddit API:** PRAW (Python Reddit API Wrapper)

### Frontend
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** @nivo/sunburst, recharts
- **CSV Parsing:** PapaParse
- **Decompression:** fflate (for Brotli in browser)

### Infrastructure (Current)
- AWS Lambda (via Mangum) - **being migrated to ECS/EC2**
- AWS S3 for data storage
- Supabase for vector DB

---

## Sample Data Examples

### Example Scraped Comment (Raw)
```json
{
    "id": "abc123",
    "post_id": "xyz789",
    "subreddit": "gout",
    "author": "pain_sufferer",
    "body": "I tried allopurinol for 3 months but the side effects were unbearable. My doctor switched me to febuxostat but I'm scared it won't work either. Has anyone had success with diet changes alone? I just want to walk without pain.",
    "created_utc": 1703808000,
    "score": 45
}
```

### Same Comment After Analysis
```json
{
    "id": "abc123",
    "post_id": "xyz789",
    "subreddit": "gout",
    "author": "pain_sufferer",
    "body": "I tried allopurinol for 3 months but the side effects were unbearable. My doctor switched me to febuxostat but I'm scared it won't work either. Has anyone had success with diet changes alone? I just want to walk without pain.",
    "created_utc": 1703808000,
    "score": 45,
    "emotions": {"fear": 0.75, "sadness": 0.6, "frustration": 0.8},
    "intensity": 0.72,
    "pain_point": "side effects were unbearable",
    "failed_solution": "allopurinol",
    "desire_wish": "walk without pain",
    "metaphor": null,
    "practitioner_reference": "my doctor",
    "trigger_phrase": null,
    "question": "Has anyone had success with diet changes alone?",
    "topics": ["medication", "side_effects", "diet"]
}
```

---

## Current Data Files in Repository

| File | Description |
|------|-------------|
| `reddit_gout_comments_20250820_085429.csv` | Uncompressed gout subreddit scrape |
| `reddit_gout_comments_20250821_003739.csv.br` | Brotli-compressed gout data |
| `reddit_gout_comments_20250821_125349.csv.br` | Brotli-compressed gout data |
| `reddit_gout_comments_20250821_154047.csv.br` | Brotli-compressed gout data |
| `decompressed_reddit_comments.txt` | Sample decompressed data |

---

## Key Files for Data Processing

| File | Purpose |
|------|---------|
| `backend/reddit_scraper.py` | Scrapes Reddit, analyzes, vectorizes, uploads to S3 |
| `backend/filter_comment.py` | AI analysis of individual comments |
| `backend/vectorise_comment.py` | Creates vector embeddings |
| `backend/query_db.py` | Supabase vector queries |
| `backend/brotli_compression.py` | Compress/decompress CSV files |
| `backend/generate_clusters.py` | Emotion clustering queries |
| `backend/aiChatBot.py` | AI chat processing |
| `backend/main.py` | FastAPI server with all endpoints |
| `src/frontend/components/filterUtils.ts` | Frontend filter logic and CSV parsing |

---

## Environment Variables Required

```bash
# Reddit API
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=
REDDIT_USERNAME=
REDDIT_PASSWORD=

# Supabase
SUPABASE_URL=
SUPABASE_API_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=

# AI
GEMINI_API_KEY=

# Model
LOCAL_MODEL_PATH=/opt/models/m  # or ~/models/m locally
```

---

## What Makes This Application Unique

1. **Multi-dimensional Analysis** - Not just sentiment, but 8 different insight types
2. **Vector Search** - Semantic similarity, not just keyword matching
3. **Real User Data** - Actual Reddit discussions, not surveys
4. **Interactive Filtering** - Drill down by emotion, topic, time, intensity
5. **AI-Powered Insights** - Chatbot that understands the data context
6. **Scalable Architecture** - S3 for storage, vectors for search, streaming for large data
