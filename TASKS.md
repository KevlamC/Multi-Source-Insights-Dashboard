# AICxAlphaWave - Complete Task List

## 🔴 CRITICAL BUGS (Fix First)

### 1. Chatbot Broken - Missing Function
**File:** `backend/aiChatBot.py` line 101  
**Problem:** Calls `query_db.find_most_similar_painpoints()` which doesn't exist  
**Fix:** Implement function in `query_db.py` using existing `similarity_search()`

### 2. Frontend URL Mismatch
**Files:** All 7 page components + `BackendURL.ts`  
**Problem:** 
- `Painpoints.tsx`, `FailedSolutions.tsx`, `DesiresWishes.tsx`, etc. hardcode `localhost:3001`
- Backend runs on port `8000`
- `BackendURL.ts` points to Lambda URLs  
**Fix:** Centralize all URLs in `BackendURL.ts`, update all components to import from there

### 3. Pages Use Sample Data Fallback
**Problem:** API calls fail → falls back to hardcoded SAMPLE_DATA  
**Root Cause:** URL mismatch (see #2)

---

## 🏗️ ARCHITECTURE CHANGES

### 4. Remove Lambda, Use ECS/EC2
**Current:** Dockerfile uses Lambda base image, `main.py` has Mangum handler  
**Changes:**
- [ ] Update Dockerfile to standard Python image
- [ ] Remove `handler = Mangum(app)` from `main.py`
- [ ] Remove `mangum` from `requirements.txt`
- [ ] Create ECS task definition OR EC2 deployment scripts
- [ ] Set up ALB (Application Load Balancer) for ECS
- [ ] Update `BackendURL.ts` with new ECS/EC2 endpoint

### 5. S3 + CloudFront Setup
**Current:** S3 working, no CloudFront  
**Changes:**
- [ ] Create CloudFront distribution for S3 bucket
- [ ] Configure CORS on CloudFront
- [ ] Update frontend to use CloudFront URLs instead of direct S3
- [ ] Add cache invalidation on new data upload

### 6. Evaluate & Add Redis Caching
**Use Cases:**
- Cache filtered results (avoid re-filtering same data)
- Cache AI chat responses for common queries
- Session storage for chat history
**Decisions Needed:**
- [ ] AWS ElastiCache vs self-hosted Redis
- [ ] Cache invalidation strategy
- [ ] TTL for different data types

### 7. Evaluate GraphQL
**Current:** REST endpoints in FastAPI  
**Considerations:**
- Pros: Single endpoint, precise data fetching, good for complex filters
- Cons: Learning curve, may be overkill for current use case
**Recommendation:** Keep REST for now, revisit after core features work

---

## 🔐 AUTHENTICATION

### 8. Add OAuth 2.0 / JWT
**Changes:**
- [ ] Add `python-jose[cryptography]` and `passlib` to requirements
- [ ] Create `backend/auth.py` with JWT creation/validation
- [ ] Add `/auth/login`, `/auth/register`, `/auth/refresh` endpoints
- [ ] Create auth middleware for protected routes
- [ ] Store users in Supabase (new `users` table)
- [ ] Frontend: Add login/register pages
- [ ] Frontend: Store JWT in httpOnly cookies or localStorage
- [ ] Add auth headers to all API calls

---

## 🤖 CHATBOT FIX

### 9. Complete Chatbot Implementation
**Tasks:**
- [ ] Implement `find_most_similar_painpoints()` in `query_db.py`
- [ ] Fix `process_user_request()` error handling
- [ ] Add streaming responses for better UX
- [ ] Connect chat to actual filtered data (not just vectors)
- [ ] Add context window management (summarize old messages)

### 10. Chat History Persistence
**Current:** Frontend tries `/chat-history` but endpoint doesn't exist  
**Changes:**
- [ ] Create `chat_sessions` table in Supabase
- [ ] Add `/chat-history` GET endpoint
- [ ] Add `/ai/chats` POST endpoint to save chats
- [ ] Link chats to user (after auth is added)

---

## 📊 FRONTEND DIFFERENTIATION

### 11. Redesign 7 Dashboard Pages
**Current:** All pages nearly identical (same layout, same components)  
**Changes for each page:**

| Page | Unique Feature |
|------|----------------|
| **Painpoints** | Heatmap visualization, severity scale |
| **Failed Solutions** | Before/After comparison cards, failure patterns |
| **Desired Outcomes** | Goal-oriented cards, progress indicators |
| **Metaphors** | Word cloud, linguistic analysis charts |
| **Practitioner** | Provider type breakdown, specialty tags |
| **Triggers** | Timeline/event-based view, cause-effect diagram |
| **Questions** | FAQ accordion, question clustering |

### 12. Improve EmotionSunburst Component
- [ ] Add drill-down capability
- [ ] Add tooltips with comment previews
- [ ] Add click to filter table by emotion

---

## 📤 NEW FEATURE: Upload Dataset

### 13. Custom Dataset Upload
**Endpoints to create:**
- [ ] `POST /upload_dataset` - Accept CSV/JSON file
- [ ] `GET /dataset_templates` - Return expected column formats
- [ ] `POST /analyze_dataset` - Run analysis pipeline on uploaded data

**Frontend:**
- [ ] Add "Upload Your Data" tab/modal
- [ ] File upload component with drag-drop
- [ ] Column mapping UI (map user columns to expected columns)
- [ ] Progress indicator for analysis
- [ ] Display results in same dashboard format

**Analysis Pipeline:**
- [ ] Detect/validate columns
- [ ] Run emotion detection
- [ ] Run painpoint extraction
- [ ] Run metaphor detection
- [ ] Generate vectors → store in Supabase
- [ ] Compress → upload to S3

---

## ⚡ PERFORMANCE

### 14. Chunked Data Transfer
**Problem:** Large datasets freeze the UI  
**Solutions:**
- [ ] Add pagination to all endpoints (already have `pagination.py`)
- [ ] Implement cursor-based pagination for large sets
- [ ] Add `limit` and `offset` params to filter endpoints
- [ ] Frontend: Infinite scroll or "Load More" button
- [ ] Use Web Workers for heavy CSV parsing

### 15. Caching Strategy
- [ ] Cache S3 file list (invalidate on upload)
- [ ] Cache filter results by hash of filter params
- [ ] Add `Cache-Control` headers to responses
- [ ] Frontend: Use React Query or SWR for caching

---

## 🛠️ CODE CLEANUP

### 16. Consolidate Duplicate Code
**Issues found:**
- [ ] `main.py` and `app.py` both exist (keep only `main.py`)
- [ ] `FilterRequest` model defined twice in `main.py`
- [ ] Multiple imports of same env vars in `generate_clusters.py`
- [ ] Duplicate SAMPLE_DATA across all page components

### 17. Environment Configuration
**Create proper config:**
- [ ] `backend/config.py` for all env vars
- [ ] `src/frontend/config.ts` for all frontend config
- [ ] Use `.env.development` and `.env.production`
- [ ] Document all required env vars in README

### 18. Error Handling
- [ ] Add global error handler in FastAPI
- [ ] Add proper error boundaries in React
- [ ] Log errors to CloudWatch (ECS) or file (EC2)
- [ ] Add user-friendly error messages in frontend

---

## 🚀 DEPLOYMENT

### 19. AWS Deployment Checklist
**ECS Option:**
- [ ] Push Docker image to ECR
- [ ] Create ECS cluster
- [ ] Create task definition with proper resource limits
- [ ] Set up ALB with health checks
- [ ] Configure auto-scaling
- [ ] Set up CloudWatch logs

**EC2 Option:**
- [ ] Create EC2 instance (t3.medium minimum for ML model)
- [ ] Install Docker or run directly with Python
- [ ] Set up Nginx as reverse proxy
- [ ] Configure SSL with Let's Encrypt
- [ ] Set up systemd service for auto-restart

### 20. Frontend Deployment
- [ ] Build with `npm run build`
- [ ] Upload to S3 bucket
- [ ] Configure CloudFront distribution
- [ ] Set up custom domain (optional)

### 21. Local Dev Strategy
**For easy local → production transition:**
- [ ] Use Docker Compose for local dev
- [ ] Match local ports to production paths
- [ ] Use same env var names everywhere
- [ ] Create `scripts/dev.sh` and `scripts/prod.sh`

---

## 📋 PRIORITY ORDER

1. **Week 1:** Fix critical bugs (#1-3) + URL consolidation
2. **Week 2:** Remove Lambda, set up ECS/EC2 (#4) + CloudFront (#5)
3. **Week 3:** Complete chatbot (#9-10) + Auth (#8)
4. **Week 4:** Dataset upload (#13) + Frontend redesign (#11)
5. **Week 5:** Performance (#14-15) + Code cleanup (#16-18)
6. **Week 6:** Final deployment + testing (#19-21)

---

## 🔧 QUICK WINS (Can Do Now)

1. **Fix BackendURL.ts** - Point to local dev `http://localhost:8000`
2. **Update all page components** - Import from BackendURL instead of hardcoding
3. **Implement missing function** - Add `find_most_similar_painpoints()` to query_db.py
4. **Delete app.py** - Duplicate of main.py functionality

---

## 📁 FILES TO MODIFY

| File | Changes Needed |
|------|----------------|
| `backend/query_db.py` | Add `find_most_similar_painpoints()` |
| `backend/main.py` | Remove Mangum, add new endpoints |
| `backend/aiChatBot.py` | Fix function call, improve error handling |
| `src/frontend/components/BackendURL.ts` | Centralize all URLs |
| `src/frontend/components/Painpoints.tsx` | Use BackendURL, unique design |
| `src/frontend/components/FailedSolutions.tsx` | Use BackendURL, unique design |
| `src/frontend/components/DesiresWishes.tsx` | Use BackendURL, unique design |
| `src/frontend/components/Metaphors.tsx` | Use BackendURL, unique design |
| `src/frontend/components/Practitioner.tsx` | Use BackendURL, unique design |
| `src/frontend/components/Triggers.tsx` | Use BackendURL, unique design |
| `src/frontend/components/RedditQuestions.tsx` | Use BackendURL, unique design |
| `src/frontend/components/AskAIChatManager.tsx` | Use BackendURL |
| `Dockerfile` | Switch to standard Python image |
| `backend/requirements.txt` | Remove mangum, add auth packages |
