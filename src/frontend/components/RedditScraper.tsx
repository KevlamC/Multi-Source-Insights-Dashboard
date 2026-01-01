import React, { useEffect, useRef, useState } from 'react';
import { emotionEmoji } from "./Emotion";
import type { ScraperCommentItem } from './ItemInterfaces';
import { applyFiltersBackend, fetchAndParseCSVFiles } from './filterUtils';
import { emotionOptions } from './Emotion'; // Imported from Emotion.ts
import { BACKEND_SCRAPER_ROUTE, BACKEND_USEPREVIOUS_ROUTE, BACKEND_GET_FILTERED_CMTS_ROUTE } from './BackendURL';

// Type declaration for PapaParse if loaded globally via CDN.
// This is crucial if you are NOT importing Papa from a module and instead
// relying on a script tag in your `index.html`.
declare global {
  interface Window {
    Papa?: {
      parse: (text: string, config: any) => any;
    };
  }
}

// IMPORTANT: Replace this with your actual AWS Lambda Function URL


const cssString = `
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #fafafa 0%, #f5f3ff 100%);
  color: #374151; /* gray-700 */
  line-height: 1.6;
  min-height: 100vh;
}

/* Header */
.site-header {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.7); /* gray-200 */
  position: sticky;
  top: 0;
  z-index: 1000;
}

.top-nav {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-icon {
  color: #7c3aed; /* purple-600 */
}

.logo {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 60%, #3b82f6 100%); /* purple->indigo->blue */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280; /* gray-500 */
  text-decoration: none;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.nav-link:hover {
  color: #7c3aed; /* purple-600 */
  background-color: rgba(167, 139, 250, 0.12); /* purple-400 @12% */
}

/* Layout */
.page-layout {
  display: flex;
  min-height: calc(100vh - 4rem);
}

/* Main Content (sidebar removed) */
.main-content {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-x: hidden;
}

/* Section Cards */
.search-section,
.filters-section,
.niche-filters-section,
.data-section {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(229, 231, 235, 0.7); /* gray-200 */
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.08); /* subtle purple shadow */
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827; /* gray-900 */
  margin: 0;
}

.title-icon {
  color: #7c3aed; /* purple-600 */
}

/* Progress */
.progress-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  min-width: 300px;
}

.progress-bar-container {
  width: 100%;
  background: rgba(229, 231, 235, 0.6);
  border-radius: 1rem;
  height: 0.75rem;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.progress-bar { width: 100%; height: 100%; position: relative; }

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa 0%, #8b5cf6 50%, #6366f1 100%); /* purple->indigo */
  border-radius: 1rem;
  width: 0%;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.35) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(100%);} }

.estimated-time { font-size: 0.875rem; color: #6b7280; font-weight: 500; white-space: nowrap; }

.search-grid { display: flex; flex-direction: column; gap: 1.5rem; }

.input-row { display: grid; grid-template-columns: 2fr 3fr 2fr; gap: 1.5rem; align-items: end; }

.input-group { display: flex; flex-direction: column; gap: 0.5rem; }

.input-group label { font-weight: 600; color: #374151; font-size: 0.875rem; }

.input-group input {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(209, 213, 219, 0.9); /* gray-300 */
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #7c3aed; /* purple-600 */
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.25);
  background: rgba(255, 255, 255, 0.95);
}

.button-group { display: flex; gap: 0.75rem; }

/* Previous Data */
.previous-data-section { margin-top: 1rem; display: flex; justify-content: center; }

.use-previous-btn {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%); /* teal/green light */
  color: #065f46; /* emerald-800 text */
  border: none; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

.use-previous-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35); }

/* Filters */
.filters-section.disabled, .niche-filters-section.disabled { opacity: 0.5; pointer-events: none; }

.niche-filters-section h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }

#nicheEmotionFilters { display: flex; flex-wrap: wrap; gap: 0.5rem; }

#nicheEmotionFilters .filter-btn,
.filter-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(209, 213, 219, 0.9);
  border-radius: 0.5rem; color: #6b7280; font-size: 0.875rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}

#nicheEmotionFilters .filter-btn:hover, .filter-btn:hover {
  background: rgba(167, 139, 250, 0.12);
  border-color: #a78bfa; /* purple-400 */
  color: #7c3aed; /* purple-600 */
}

#nicheEmotionFilters .filter-btn.active, .filter-btn.active {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  border-color: transparent; color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
}

.filter-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }

.filter-group h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }

.filter-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }

/* Action Buttons */
.action-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  white-space: nowrap; flex: 1;
}

.action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); }

.action-btn.primary { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: white; }
.action-btn.primary:hover { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); }

.action-btn.secondary { background: rgba(124, 58, 237, 0.08); color: #6b7280; border: 1px solid rgba(209, 213, 219, 0.9); }
.action-btn.secondary:hover { background: rgba(124, 58, 237, 0.12); color: #4b5563; }

/* Data Section */
.data-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(229, 231, 235, 0.7); }

.data-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1.25rem; font-weight: 800; color: #111827; }

.data-stats { color: #6b7280; font-size: 0.875rem; }

.table-container { max-height: 24rem; overflow-y: auto; }

.data-table { width: 100%; border-collapse: collapse; }

.data-table th {
  background: rgba(250, 245, 255, 0.9); /* purple-50 */
  padding: 1rem; text-align: left; font-weight: 800; color: #4c1d95; /* purple-900 */
  font-size: 0.875rem; border-bottom: 1px solid rgba(229, 231, 235, 0.7); position: sticky; top: 0; backdrop-filter: blur(8px);
}

.data-table td { padding: 1rem; border-bottom: 1px solid rgba(229, 231, 235, 0.5); vertical-align: top; }

.data-table tr:hover { background: linear-gradient(135deg, rgba(250, 245, 255, 0.6) 0%, rgba(224, 231, 255, 0.35) 100%); }

.comment-cell { max-width: 300px; line-height: 1.5; }
.author-cell { font-weight: 700; color: #1f2937; }
.subreddit-cell { color: #7c3aed; font-weight: 600; }
.upvotes-cell { text-align: center; font-weight: 700; }
.emotion-cell { text-align: center; }

.emotion-badge { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700; }
.emotion-positive { background: rgba(34, 197, 94, 0.12); color: #15803d; }
.emotion-negative { background: rgba(239, 68, 68, 0.12); color: #b91c1c; }
.emotion-neutral { background: rgba(107, 114, 128, 0.12); color: #4b5563; }
.emotion-frustrated { background: rgba(245, 101, 101, 0.12); color: #ef4444; }

.time-cell { color: #6b7280; font-size: 0.875rem; white-space: nowrap; }

/* Mobile */
@media (max-width: 1024px) {
  .main-content { padding: 1rem; gap: 1.5rem; }
  .filter-row { grid-template-columns: 1fr; gap: 1.5rem; }
  .input-row { grid-template-columns: 1fr; gap: 1rem; }
  .button-group { flex-direction: column; }
  .search-header { flex-direction: column; align-items: stretch; gap: 1rem; }
  .progress-section { align-items: stretch; min-width: auto; }
  .data-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  .comment-cell { max-width: 200px; }
}

@media (max-width: 640px) {
  .top-nav { padding: 0 1rem; }
  .logo { font-size: 1rem; }
  .nav-link span { display: none; }
  .main-content { padding: 0.75rem; }
  .section-title { font-size: 1.125rem; }
  .filter-buttons { gap: 0.375rem; }
  .filter-btn { padding: 0.375rem 0.75rem; font-size: 0.8125rem; }
  .comment-cell { max-width: 150px; }
  .button-group { gap: 0.5rem; }
  .action-btn { padding: 0.625rem 1rem; font-size: 0.8125rem; }
}
`;

const sampleScraperCommentItems: ScraperCommentItem[] = [
  {
    id: "1",
    author: "healthseeker_22",
    subreddit: "health",
    comment: "I've been struggling with chronic back pain for months. Traditional treatments haven't worked, and I'm looking for alternative approaches that actually help.",
    upvotes: 47,
    emotion: "optimism",
    timestamp: "2 hours ago"
  },
  {
    id: "2",
    author: "fitfanatic99",
    subreddit: "fitness",
    comment: "Just finished my first 5K run and I feel amazing! Can't wait to beat my personal record next time.",
    upvotes: 89,
    emotion: "excitement",
    timestamp: "1 hour ago"
  },
  {
    id: "3",
    author: "wellnessguru",
    subreddit: "wellness",
    comment: "Meditation has completely changed my perspective on stress. Feeling much more relaxed and present.",
    upvotes: 63,
    emotion: "relief",
    timestamp: "3 hours ago"
  },
  {
    id: "4",
    author: "curiouscat42",
    subreddit: "health",
    comment: "I wonder if intermittent fasting actually improves cognitive function or if it's just hype.",
    upvotes: 22,
    emotion: "curiosity",
    timestamp: "30 minutes ago"
  },
  {
    id: "5",
    author: "angryuser88",
    subreddit: "chronicpain",
    comment: "It's so frustrating when doctors dismiss your pain. Feeling ignored makes it even worse.",
    upvotes: 15,
    emotion: "anger",
    timestamp: "5 hours ago"
  },
  {
    id: "6",
    author: "sad_soul",
    subreddit: "wellness",
    comment: "Some days it feels like nothing I do helps, and I just want to give up.",
    upvotes: 8,
    emotion: "sadness",
    timestamp: "6 hours ago"
  },
  {
    id: "7",
    author: "proudachiever",
    subreddit: "fitness",
    comment: "Finally nailed my deadlift form! Hard work really does pay off.",
    upvotes: 74,
    emotion: "pride",
    timestamp: "2 hours ago"
  },
  {
    id: "8",
    author: "lovelyhuman",
    subreddit: "health",
    comment: "Feeling grateful for all the support from my friends while I recover from surgery.",
    upvotes: 51,
    emotion: "gratitude",
    timestamp: "1 hour ago"
  },
  {
    id: "9",
    author: "embarrassed123",
    subreddit: "fitness",
    comment: "I tripped on the treadmill in front of everyone… I’m mortified.",
    upvotes: 12,
    emotion: "embarrassment",
    timestamp: "4 hours ago"
  },
  {
    id: "10",
    author: "excitedlearner",
    subreddit: "wellness",
    comment: "Just discovered yoga nidra and wow, it’s life-changing for my sleep patterns!",
    upvotes: 36,
    emotion: "excitement",
    timestamp: "20 minutes ago"
  },
  {
    id: "11",
    author: "fearfulmind",
    subreddit: "chronicpain",
    comment: "I’m worried my condition will never improve despite trying everything.",
    upvotes: 9,
    emotion: "fear",
    timestamp: "7 hours ago"
  },
  {
    id: "12",
    author: "disgusteduser",
    subreddit: "health",
    comment: "It’s gross how some fitness supplements are marketed with false claims. Really misleading.",
    upvotes: 4,
    emotion: "disgust",
    timestamp: "1 day ago"
  },
  {
    id: "13",
    author: "curiousexplorer",
    subreddit: "fitness",
    comment: "Has anyone tried cryotherapy? I’m curious if it really speeds up recovery.",
    upvotes: 17,
    emotion: "curiosity",
    timestamp: "3 hours ago"
  },
  {
    id: "14",
    author: "joyfulrunner",
    subreddit: "fitness",
    comment: "Ran my fastest mile today! Feeling pure joy and accomplishment.",
    upvotes: 58,
    emotion: "joy",
    timestamp: "2 hours ago"
  },
  {
    id: "15",
    author: "neutralobserver",
    subreddit: "wellness",
    comment: "I follow a daily routine but haven’t noticed any major changes yet.",
    upvotes: 10,
    emotion: "neutral",
    timestamp: "5 hours ago"
  },
];



const RedditScraper: React.FC = () => {
  const [subreddits, setSubreddits] = useState<string>('');
  const [numPosts, setNumPosts] = useState<string>('');
  const [currentData, setCurrentData] = useState<ScraperCommentItem[]>(sampleScraperCommentItems);


  // --- Emotion filter ---
  // multiple selection -> array instead of single value
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["all"]);

  // --- Subreddit filter ---
  const subredditOptions = [
    { key: "all", label: "All" },
    ...Array.from(new Set(currentData.map((item) => item.subreddit))).map((sub) => ({
      key: sub,
      label: sub,
    })),
  ] as const;
  // derive union of all keys
  type SubredditKey = (typeof subredditOptions)[number]["key"];
  const [selectedSubreddits, setSelectedSubreddits] = useState<SubredditKey[]>(["all"]);

  const [isScrapingInProgress, setIsScrapingInProgress] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<string>('0min');
  const [filtersEnabled, setFiltersEnabled] = useState<boolean>(false);
  const [usingPreviousData, setUsingPreviousData] = useState<boolean>(false);
  const hasScrapedDataRef = useRef(false); // Renamed to accurately reflect purpose

  // add this near your other refs/states
  const scrapingIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const calculateEstimatedTime = (): number => {
    if (!subreddits || !numPosts) { return 0; }
    const subredditArray = subreddits.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    const numPostsInt = parseInt(numPosts) || 0;
    return subredditArray.length * numPostsInt * 10;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) { return `${seconds}s`; }
    else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}hr ${minutes}min` : `${hours}hr`;
    }
  };

  useEffect(() => { setEstimatedTime(formatTime(calculateEstimatedTime())); }, [subreddits, numPosts]);

  const [filtered, setFiltered] = useState<ScraperCommentItem[]>(currentData);

  // preparation for apply filter backend
  const filters = { selectedEmotions, selectedSubreddits };
  /* ---------- apply filters : backend ---------- */
  //NOW CONNECTED
  const [isFiltering, setIsFiltering] = useState(false);
  const runFilter = async () => {
  setIsFiltering(true);
  try {
    const filters = {
      subreddits: selectedSubreddits.includes("all") ? null : selectedSubreddits,
      emotions: selectedEmotions.includes("all") ? null : selectedEmotions,
      keyword: null,
      min_intensity: null,
      time: null
    };

    const response = await fetch(BACKEND_GET_FILTERED_CMTS_ROUTE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Filter failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.urls && data.urls.length > 0) {
      const combinedData = await fetchAndParseCSVFiles<ScraperCommentItem>(data.urls, "scraper");
      setFiltered(combinedData);
    } else {
      // Fallback to client-side filtering if no backend results
      applyFiltersBackend<ScraperCommentItem>("ScraperCommentItem", {selectedEmotions, selectedSubreddits}, setFiltered);
    }
    
  } catch (err) {
    console.error("Backend filter failed:", err);
    // Fall back to client-side filtering
    applyFiltersBackend<ScraperCommentItem>("ScraperCommentItem", {selectedEmotions, selectedSubreddits}, setFiltered);
  } finally {
    setIsFiltering(false);
  }
};


  // /* ---------- Apply filters : frontend---------- */
  // const applyFilters = () => {
  //   let rows = [...currentData];

  //   // Multi-subreddit filtering
  //   if (!selectedSubreddits.includes("all")) {
  //     rows = rows.filter((r) => selectedSubreddits.includes(r.subreddit as SubredditKey));
  //   }

  //   // Multi-emotion filtering
  //   if (!selectedEmotions.includes("all")) {
  //     rows = rows.filter((r) => selectedEmotions.includes(r.emotion));
  //   }

  //   return rows;
  // };

  // /* ---------- Run Filter: frontend ---------- */
  // const runFilter = () => {
  //   const result = applyFilters();
  //   setFiltered(result);
  // };

  /* ---------- Clear Filter ---------- */
  const clearFilter = () => {
    setSelectedEmotions(["all"]);
    setSelectedSubreddits(["all"]);
    setFiltered(currentData);
  };

  // handle run scraping
  const handleRunScraping = async () => {
  if (!subreddits || !numPosts) {
    alert('Please fill in both subreddits and number of posts.');
    return;
  }

  setIsScrapingInProgress(true);
  setUsingPreviousData(false);
  setFiltersEnabled(false);
  setProgress(0);

  const totalSeconds = calculateEstimatedTime();
  let currentProgress = 0;
  const maxFakeProgress = 95;
  const progressIncrement = maxFakeProgress / (totalSeconds / 0.5);

  scrapingIntervalRef.current = setInterval(() => {
    currentProgress += progressIncrement;
    if (currentProgress > maxFakeProgress) { currentProgress = maxFakeProgress; }
    setProgress(currentProgress);
  }, 500);

  try {
    const subredditList = subreddits.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Validate subreddit count (max 3 as per your backend)
    if (subredditList.length > 3) {
      throw new Error("Maximum 3 subreddits allowed");
    }

    // Validate post limit (1-1000 as per your backend)
    const postLimit = parseInt(numPosts);
    if (postLimit < 1 || postLimit > 1000) {
      throw new Error("Post limit must be between 1 and 1000");
    }

    // ✅ USE THE CORRECT ENDPOINT - /scrape_comments
    const response = await fetch(BACKEND_SCRAPER_ROUTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subreddits: subredditList,
        post_limit: postLimit
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Scraping failed: ${response.status}`);
    }

    if (scrapingIntervalRef.current) { clearInterval(scrapingIntervalRef.current); }
    setProgress(100);

    const data = await response.json();
    const urls: string[] = data.urls || [];

    if (urls.length === 0) {
      alert('Scraping completed but no data was returned.');
      setCurrentData(sampleScraperCommentItems);
      hasScrapedDataRef.current = false;
    } else {
      const combinedData = await fetchAndParseCSVFiles<ScraperCommentItem>(urls, "scraper");
      setCurrentData(combinedData);
      setFiltered(combinedData);
      hasScrapedDataRef.current = true;
    }

    setTimeout(() => {
      setIsScrapingInProgress(false);
      setFiltersEnabled(true);
    }, 1000);

  } catch (error: any) {
    if (scrapingIntervalRef.current) { clearInterval(scrapingIntervalRef.current); }
    setIsScrapingInProgress(false);
    setProgress(0);
    alert('Failed to scrape data: ' + error.message);
    hasScrapedDataRef.current = false;
  }
  };
  
  const handleClear = () => {
  if (scrapingIntervalRef.current) { clearInterval(scrapingIntervalRef.current); }
  setIsScrapingInProgress(false);
  setSubreddits('');
  setNumPosts('');
  setProgress(0);
  setFiltersEnabled(false);
  setSelectedEmotions(['all']);
  setSelectedSubreddits(['all']);
  setFiltered(sampleScraperCommentItems);
  setUsingPreviousData(false);
  hasScrapedDataRef.current = false;
};

const handleUsePreviousData = async () => {
  if (!hasScrapedDataRef.current) {
    alert("You have not scraped Reddit yet, so there is no previous data to load. Showing sample data.");
    setUsingPreviousData(true);
    setFiltersEnabled(true);
    setCurrentData(sampleScraperCommentItems);
    setFiltered(sampleScraperCommentItems);
    return;
  }

  setUsingPreviousData(true);
  setFiltersEnabled(true);

  try {
    const response = await fetch(BACKEND_USEPREVIOUS_ROUTE);
    if (!response.ok) {
      throw new Error(`Failed to fetch previous data: ${response.status}`);
    }
  
    const data = await response.json();
    const urls: string[] = data.urls;
    
    if (urls && urls.length > 0) {
      const combinedData = await fetchAndParseCSVFiles<ScraperCommentItem>(urls, "scraper");
      setCurrentData(combinedData);
      setFiltered(combinedData);
    } else {
      setCurrentData(sampleScraperCommentItems);
      setFiltered(sampleScraperCommentItems);
    }
    
  } catch (err) {
    console.error("Error fetching previous data:", err);
    alert("Failed to load previous data. Using sample data instead.");
    setCurrentData(sampleScraperCommentItems);
    setFiltered(sampleScraperCommentItems);
  }
};


  return (
    <>
      <style>{cssString}</style>


      <div className="max-w-7xl mx-auto p-6">
        <main className="main-content">
          <section className="search-section">
            <div className="search-header">
              <h2 className="section-title">
                <svg className="title-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search Parameters
              </h2>

              <div className="progress-section" style={{ display: isScrapingInProgress ? 'flex' : 'none' }}>
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <div className="estimated-time">Estimated Completion Time: {estimatedTime}</div>
              </div>
            </div>

            <div className="search-grid">
              <div className="input-row">
                <div className="input-group subreddit-input">
                  <label htmlFor="subreddits">Subreddits</label>
                  <input id="subreddits" type="text" placeholder="e.g. health, fitness, wellness" value={subreddits} onChange={(e) => setSubreddits(e.target.value)} />
                </div>

                <div className="input-group posts-input">
                  <label htmlFor="numPosts">Posts per Subreddit (Max 1000)</label>
                  <input id="numPosts" type="number" placeholder="25" value={numPosts} onChange={(e) => setNumPosts(e.target.value)} />
                </div>

                <div className="button-group">
                  <button id="runBtn" className="action-btn primary" onClick={handleRunScraping} disabled={isScrapingInProgress}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {isScrapingInProgress ? <path d="M21 12a9 9 0 11-6.219-8.56" /> : <polygon points="5,3 19,12 5,21 5,3"></polygon>}
                    </svg>
                    {isScrapingInProgress ? 'Scraping...' : 'Run Scraping'}
                  </button>

                  <button id="clearBtn" className="action-btn secondary" onClick={handleClear}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1,4 1,10 7,10"></polyline>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="previous-data-section">
              <button id="usePreviousDataBtn" className="use-previous-btn" onClick={handleUsePreviousData} style={{ background: usingPreviousData ? 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' : undefined }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {usingPreviousData ? <path d="M20 6L9 17l-5-5"></path> : <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>}
                </svg>
                {usingPreviousData ? 'Using Previous Data' : 'Use Previous Data'}
              </button>
            </div>
          </section>

          <section className={`filters-section ${filtersEnabled ? '' : 'disabled'}`}>
            <div className="filter-row">
              {/* Subreddit Filter */}
              <div className="filter-group">
                <h3>Filter by Subreddit</h3>
                <div className="filter-buttons" id="subredditFilters">
                  {subredditOptions.map((option, index) => (
                    <button
                      key={`${option.key}-${index}`} // <<< MODIFIED KEY TO BE ROBUST
                      className={`filter-btn ${selectedSubreddits.includes(option.key) ? 'active' : ''}`}
                      data-filter={option.key}
                      onClick={() => {
                        setSelectedSubreddits((prev) => {
                          if (option.key === "all") {
                            return ["all"]; // select all alone
                          }

                          // selecting a specific subreddit
                          const withoutAll = prev.filter((k) => k !== "all");
                          if (withoutAll.includes(option.key)) {
                            // deselect it
                            const updated = withoutAll.filter((k) => k !== option.key);
                            return updated.length === 0 ? ["all"] : updated; // fallback to "all" if nothing selected
                          }

                          return [...withoutAll, option.key];
                        });
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotion Filter */}
              <div className="filter-group">
                <h3>Filter by Emotion Category</h3>
                <div className="filter-buttons" id="emotionFilters">
                  {emotionOptions.map((emotion, index) => ( // <<< Added index here
                    <button
                      key={`${emotion}-${index}`} // <<< MODIFIED KEY TO BE ROBUST
                      className={`filter-btn ${selectedEmotions.includes(emotion) ? 'active' : ''}`}
                      data-emotion={emotion}
                      onClick={() => {
                        setSelectedEmotions((prev) => {
                          if (emotion === "all") {
                            return ["all"];
                          }

                          const withoutAll = prev.filter((e) => e !== "all");
                          if (withoutAll.includes(emotion)) {
                            const updated = withoutAll.filter((e) => e !== emotion);
                            return updated.length === 0 ? ["all"] : updated;
                          }

                          return [...withoutAll, emotion];
                        });
                      }}
                    >
                      {emotion === "all" ? "All" : `${emotionEmoji[emotion] ?? ""} ${emotion}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={runFilter}  // ← Now calls your NEW backend filtering function
                disabled={isFiltering}  // ← Add disabled state during loading
                className={`h-10 px-4 rounded-lg text-sm font-semibold text-white shadow-md transition 
                        ${isFiltering
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-br from-violet-500 to-fuchsia-400 hover:shadow-lg'
                  }`}
              >
                {isFiltering ? 'Filtering...' : 'Apply Filter'}  // ← Dynamic text
              </button>

              <button
                onClick={clearFilter}  // ← This should also be updated if needed
                className="h-10 px-4 rounded-lg text-sm font-semibold border-2 border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
              >
                Clear Filter
              </button>
            </div>
          </section>

          <section className="data-section">
            <div className="data-header">
              <h3 className="data-title">
                <svg className="title-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Latest Insights
              </h3>
              <div className="data-stats">
                Showing <span id="visibleCount">{filtered.length}</span> out of <span id="totalCount">{currentData.length}</span> Comments
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Author</th>
                    <th>Subreddit</th>
                    <th>Comment</th>
                    <th>Upvotes</th>
                    <th>Emotion</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="author-cell">{item.author}</td>
                      <td className="subreddit-cell">r/{item.subreddit}</td>
                      <td className="comment-cell">{item.comment}</td>
                      <td className="upvotes-cell">{item.upvotes}</td>
                      <td className="emotion-cell">
                        <span className={`emotion-badge ${item.emotion === 'optimism' || item.emotion === 'excitement' || item.emotion === 'relief' || item.emotion === 'pride' || item.emotion === 'gratitude' || item.emotion === 'joy' ? 'emotion-positive' : item.emotion === 'anger' || item.emotion === 'sadness' || item.emotion === 'fear' || item.emotion === 'disgust' ? 'emotion-negative' : 'emotion-neutral'}`}>
                          {emotionEmoji[item.emotion]} {item.emotion}
                        </span>
                      </td>
                      <td className="time-cell">{item.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default RedditScraper;
