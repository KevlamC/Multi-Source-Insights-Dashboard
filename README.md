# Multi-Source Insights Dashboard

A comprehensive platform for scraping, analyzing, and visualizing health-related discussions from Reddit. Uses AI/ML to extract actionable insights about user pain points, emotions, failed solutions, desires, metaphors, and more.

## Features

- **Reddit Scraping** - Async scraping from multiple subreddits with rate limiting
- **AI Analysis** - Multi-dimensional comment analysis (emotions, pain points, solutions, desires, metaphors, etc.)
- **Vector Embeddings** - Semantic search via sentence-transformers on Supabase pgvector
- **Interactive Dashboard** - 7 specialized views with filtering, sorting, and export
- **AI Chatbot** - Ask questions about analyzed data, powered by Gemini API
- **Data Compression** - Brotli-compressed CSV storage in AWS S3

## Tech Stack

**Backend:**
- FastAPI + Python
- sentence-transformers (embeddings)
- Google Gemini 1.5 Flash (AI)
- Supabase + pgvector (vector DB)
- AWS S3 (storage)

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- @nivo/sunburst & recharts (charts)

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your environment variables
python -m uvicorn main:app --port 8000
```

### Frontend
```bash
npm install
npm run dev
```

Visit http://localhost:5173

## Environment Variables

See `.env.example` in the backend folder. You'll need:
- Reddit API credentials (PRAW)
- Supabase credentials
- AWS credentials (S3)
- Google Gemini API key

## Documentation

- **[APPLICATION_OVERVIEW.md](APPLICATION_OVERVIEW.md)** - Detailed app description, data schemas, API endpoints
- **[TASKS.md](TASKS.md)** - Current development roadmap

## License

MIT
