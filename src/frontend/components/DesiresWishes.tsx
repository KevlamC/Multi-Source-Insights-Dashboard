import React, { useMemo, useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { ChatInputBar } from "./ChatInputBar";
import { ChatPanel } from "./ChatPanel";
import TableEffectWrapper from "./TableEffectWrapper";
import {ChatIcon} from "./Icons";
import type { Message } from "./ChatPanel";
import type { Emotion } from "./Emotion";
import { emotionEmoji } from "./Emotion";
import type { DesireWishesItem } from "./ItemInterfaces";
// import { applyFiltersBackend } from "./filterUtils";


type SortColumn = "author" | "timestamp" | "subreddit" | "upvotes" | "intensity" | null;
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 7;
const TOTAL_ITEMS = 8; // display only (sample data is smaller)
//NEW FOR CLOUD
// Add this after your imports
// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const API_BASE_URL = "http://localhost:3001";
// const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
//   ? process.env.REACT_APP_API_URL 
//   : "http://localhost:3001";

const API_ENDPOINTS = {
  filteredComments: `${API_BASE_URL}/get_filtered_cmts`,
  exportData: `${API_BASE_URL}/export_data`,
  exportInsights: `${API_BASE_URL}/export_insights`
};

// ----- Sample Data (from your JS) -----
const SAMPLE_DATA: DesireWishesItem[] = [
  {
    id: "1",
    author: "Balaji Nant",
    timestamp: "2 hours ago",
    timestampSort: 2,
    subreddit: "r/health",
    comment:
      "I desperately wish for better sleep. Chronic insomnia is draining my energy and affecting my mood every single day. I've tried everything - melatonin, sleep hygiene, meditation apps, but nothing seems to work consistently. The exhaustion is affecting my work performance and relationships. I just want to wake up feeling refreshed for once.",
    upvotes: 45,
    emotion: "sadness",
    intensity: 0.85,
    topic: "physical_wellbeing",
    desire_wish: "better sleep"
  },
  {
    id: "2",
    author: "Nithya Menon",
    timestamp: "4 hours ago",
    timestampSort: 4,
    subreddit: "r/mentalhealth",
    comment:
      "My biggest desire is to overcome my anxiety. It prevents me from living a full life and pursuing my dreams. Social situations feel overwhelming, and I constantly worry about what others think. I want to be able to speak up in meetings, go to social events without panic, and just feel comfortable in my own skin. Therapy helps but progress feels so slow.",
    upvotes: 67,
    emotion: "disappointment",
    intensity: 0.91,
    topic: "emotional_stability",
    desire_wish: "overcome anxiety"
  },
  {
    id: "3",
    author: "Meera Gonzalez",
    timestamp: "6 hours ago",
    timestampSort: 6,
    subreddit: "r/selfimprovement",
    comment:
      "I wish I had more discipline to stick to my goals. I want to see consistent personal growth and stop the cycle of starting projects and abandoning them. Whether it's fitness, learning new skills, or building better habits, I always start strong but lose motivation after a few weeks. I desire the mental strength to push through when things get difficult.",
    upvotes: 32,
    emotion: "joy",
    intensity: 0.72,
    topic: "personal_growth",
    desire_wish: "more discipline to stick to goals"
  },
  {
    id: "4",
    author: "Karthik Subramanian",
    timestamp: "8 hours ago",
    timestampSort: 8,
    subreddit: "r/mentalhealth",
    comment:
      "I desire deeper connections with people. Feeling isolated is tough, and I wish for more meaningful friendships that go beyond surface-level conversations. I want relationships where I can be vulnerable, share my struggles, and feel truly understood. The loneliness is overwhelming sometimes, especially working from home. I wish I knew how to build genuine connections.",
    upvotes: 89,
    emotion: "sadness",
    intensity: 0.88,
    topic: "social_connection",
    desire_wish: "deeper, meaningful friendships"
  },
  {
    id: "5",
    author: "Sarah Johnson",
    timestamp: "1 day ago",
    timestampSort: 24,
    subreddit: "r/health",
    comment:
      "I wish I had more energy throughout the day. I feel constantly tired, and it impacts my productivity and enjoyment of life. Even after 8 hours of sleep, I wake up exhausted. I've had blood tests done but everything comes back normal. I just want to feel vibrant and energetic like I used to in my twenties.",
    upvotes: 54,
    emotion: "disappointment",
    intensity: 0.79,
    topic: "physical_wellbeing",
    desire_wish: "more daily energy"
  },
  {
    id: "6",
    author: "Alex Chen",
    timestamp: "1 day ago",
    timestampSort: 24,
    subreddit: "r/wellness",
    comment:
      "My desire is to find inner peace and reduce stress. The constant pressure from work, family expectations, and societal demands is overwhelming. I want to learn how to stay calm in chaotic situations and not let external circumstances dictate my emotional state. Meditation helps but I struggle to maintain consistency.",
    upvotes: 76,
    emotion: "sadness",
    intensity: 0.93,
    topic: "emotional_stability",
    desire_wish: "inner peace and reduced stress"
  },
  {
    id: "7",
    author: "Maria Rodriguez",
    timestamp: "2 days ago",
    timestampSort: 48,
    subreddit: "r/selfimprovement",
    comment:
      "I wish I could build more confidence in myself and stop second-guessing every decision I make. I constantly seek validation from others and doubt my own judgment. This lack of self-confidence is holding me back in my career and personal relationships. I want to trust myself and feel worthy of success and happiness.",
    upvotes: 41,
    emotion: "joy",
    intensity: 0.68,
    topic: "personal_growth",
    desire_wish: "more self-confidence"
  },
  {
    id: "8",
    author: "David Kim",
    timestamp: "3 days ago",
    timestampSort: 72,
    subreddit: "r/wellness",
    comment:
      "I desire to break free from negative thought patterns and cultivate a more positive mindset. I find myself constantly focusing on what could go wrong rather than what could go right. This pessimistic outlook is affecting my mental health and relationships. I want to rewire my brain to see opportunities instead of obstacles.",
    upvotes: 63,
    emotion: "joy",
    intensity: 0.75,
    topic: "emotional_stability",
    desire_wish: "break free from negative thought patterns"
  },
];


// Quotes (from your JS)
const HARDCODED_QUOTES: string[] = [
  "I just want to wake up feeling refreshed and not dreading the day. Better sleep would change everything.",
  "My biggest wish is to find a way to manage my anxiety so I can focus on my goals without constant worry.",
  "It would be amazing to have a supportive community where I feel understood and connected to others.",
  "I truly desire to have more energy to pursue my passions and live life to the fullest.",
  "My wish is for inner peace and a calmer mind, free from the constant pressure of daily life.",
  "I aspire to continuously learn and grow, to feel more competent and capable in everything I do.",
  "I want to build unshakeable confidence and trust in my own decisions and abilities.",
  "My desire is to break free from negative thinking and see the world with optimism and hope.",
];

void HARDCODED_QUOTES

// ----- Utilities -----
function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows: DesireWishesItem[]): string {
  const header = [
    "Author",
    "Timestamp",
    "Subreddit",
    "Comment",
    "Upvotes",
    "Topic",
    "Intensity",
    "Desires/Wish"
  ];
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows
    .map((r) =>
      [
        r.author,
        r.timestamp,
        r.subreddit,
        r.comment,
        String(r.upvotes),
        r.topic,
        `${Math.round(r.intensity * 100)}%`,
        r.desire_wish
      ]
        .map(escape)
        .join(","),
    )
    .join("\n");
  return [header.join(","), body].join("\n");
}

function insightsText(rows: DesireWishesItem[]): string {
  const total = rows.length || 1;
  const byTop = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.topic] = (acc[r.topic] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const byEmotion = rows.reduce<Record<Emotion, number>>((acc, r) => {
    acc[r.emotion] = (acc[r.emotion] ?? 0) + 1;
    return acc;
  }, {} as Record<Emotion, number>);

  const topLines = Object.entries(byTop)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${((v / total) * 100).toFixed(1)}% (${v})`)
    .join("\n");

  const emoLines = Object.entries(byEmotion)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${((v / total) * 100).toFixed(1)}% (${v})`)
    .join("\n");

  return `Top Insights
-------------
Categories:
${topLines}

Emotions:
${emoLines}
`;
}

function pageWindow(current: number, last: number): (number | string)[] {
  if (last <= 6) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set<number | string>([1, 2, last - 1, last, current, current - 1, current + 1]);
  const sorted = [...pages].filter((n) => typeof n === "number" && n >= 1 && n <= last) as number[];
  sorted.sort((a, b) => a - b);
  const out: (number | string)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
  }
  return out;
}



// ----- Component -----

export default function DesiresWishes() {
  // Chat with AI states
  const [chatState, setChatState] = useState<"hidden" | "input-bar" | "full-chat">("hidden");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [isVisibleBar, setIsVisibleBar] = useState(false);
  const [isVisiblePanel, setIsVisiblePanel] = useState(false);
  const [userTask, setUserTask] = useState<string>("Generate a short summary."); //NEW
  //NEW
  const [searchTerm, setSearchTerm] = useState(''); // For the input value
  const [results, setResults] = useState<any[]>([]); // For storing search results
  const [isLoading, setIsLoading] = useState(false);
  // Add this to your state
  const [isExporting, setIsExporting] = useState(false);


  // Show bar when chatState is 'input-bar'
  useEffect(() => {
    if (chatState === 'input-bar') {
      setIsVisibleBar(true);
    }
  }, [chatState]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('react-chat-history');
      if (saved) setMessages(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('react-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [messages]);

  //UPDATED
  const handleSendMessage = async (text: string, task = "Generate a short summary.") => {
  const newUser: Message = { id: Date.now() + Math.random(), type: "user", content: text };
  const loading: Message = { id: Date.now() + Math.random(), type: "loading", content: "Thinking..." };
  
  setChatState("full-chat");
  setIsVisiblePanel(true);
  setMessages((prev) => [...prev, newUser, loading]);
  
  try {
    const response = await fetch(API_ENDPOINTS.filteredComments, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: text,
        user_task: task,
        // Include filters if you want the AI to work on filtered data
        filters: {
          keyword,
          subreddits: selectedSubreddits,
          emotions: selectedEmotions,
          topics,
          min_intensity: intensityPct / 100,
          time: timeFilter
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch insights from backend');
    }

    const data: { summary: string } = await response.json();
    const botMessage: Message = { 
      id: Date.now() + Math.random(), 
      type: 'bot', 
      content: data.summary 
    };
    setMessages(prev => [...prev.filter(m => m.type !== 'loading'), botMessage]);

  } catch (error) {
    console.error('Failed to get AI response:', error);
    const errorMessage: Message = { 
      id: Date.now() + Math.random(), 
      type: 'bot', 
      content: "Sorry, I couldn't get an answer. Please try again." 
    };
    setMessages(prev => [...prev.filter(m => m.type !== 'loading'), errorMessage]);
  }
};
  
  // chat bar
  const toggleChatInputBar = () => {
    if (chatState === 'hidden') {
      setChatState('input-bar');
      setIsVisibleBar(true);
      setTimeout(() => chatInputRef.current?.focus(), 300);
    } else {
      handleCloseBar();
    }
  };
  
  const handleCloseBar = () => {
    setIsVisibleBar(false); // triggers slide-down/fade-out
    setTimeout(() => setChatState('hidden'), 300); // remove after animation
  };
  

  // chat panel
  const minimizeChat = () => {
    setIsVisiblePanel(false); // start fade-out
  
    // wait for animation duration before actually hiding
    setTimeout(() => {
      setChatState("input-bar"); 
    }, 300);
  };

  // Filters
  const [keyword, setKeyword] = useState<string>("");
  const [intensityPct, setIntensityPct] = useState<number>(50);
  const [timeFilter, setTimeFilter] = useState<"all" | "past_day" | "past_week" | "past_month" | "past_year">("all");
  const distinctEmotions = Array.from(new Set(SAMPLE_DATA.map((d) => d.emotion)));
  const emotionOptions = ["all", ...distinctEmotions] as const;
  const [selectedEmotions, setEmotions] = useState<string[]>(["all"]);
  
  const subredditOptions = [
    { key: "all", label: "All" },
    ...Array.from(new Set(SAMPLE_DATA.map((d) => d.subreddit))).map((s) => ({ key: s, label: s })),
  ] as const;
  type SubredditKey = (typeof subredditOptions)[number]["key"];
  const [selectedSubreddits, setSubs] = useState<SubredditKey[]>(["all"]);
  
  const topicOptions = [
    { key: "all", label: "All Topics" },
    ...Array.from(new Set(SAMPLE_DATA.map(item => item.topic))).map((topic) => ({
      key: topic,
      label: topic
    }))
  ];
  const [topics, setTopics] = useState<string[]>(["all"]);


/* ---------- Results ---------- */
const [filtered, setFiltered] = useState<typeof SAMPLE_DATA>(SAMPLE_DATA);

// preparation for apply filter backend
// const filters = {keyword, intensityPct, timeFilter, selectedEmotions, topics, selectedSubreddits};
// const runSearchBackend = () => {
//   applyFiltersBackend<DesireWishesItem>("DesireWishesItem", filters, setFiltered);
//   setPage(1); // reset to first page
// };


/* ---------- Helper: Apply Filters ---------- */
const applyFilters = () => {
  const kw = keyword.trim().toLowerCase();
  const intf = intensityPct / 100;

  let rows = [...SAMPLE_DATA];

  if (kw) {
    rows = rows.filter(
      (r) =>
        r.comment.toLowerCase().includes(kw) ||
        r.desire_wish.toLowerCase().includes(kw) ||
        r.author.toLowerCase().includes(kw) ||
        r.topic.toLowerCase().includes(kw)
    );
  }

  if (!selectedSubreddits.includes("all")) {
    rows = rows.filter((r) => selectedSubreddits.includes(r.subreddit as SubredditKey));
  }

  if (!selectedEmotions.includes("all")) {
    rows = rows.filter((r) => selectedEmotions.includes(r.emotion));
  }

  if (!topics.includes("all")) {
    rows = rows.filter((r) => topics.includes(r.topic));
  }

  rows = rows.filter((r) => r.intensity >= intf);

  if (timeFilter !== "all") {
    let cutoffHours = Infinity;
    switch (timeFilter) {
      case "past_day":
        cutoffHours = 24;
        break;
      case "past_week":
        cutoffHours = 7 * 24;
        break;
      case "past_month":
        cutoffHours = 30 * 24;
        break;
      case "past_year":
        cutoffHours = 365 * 24;
        break;
    }
    rows = rows.filter((r) => r.timestampSort <= cutoffHours);
  }

  return rows;
};

/* ---------- Run Search updated to backend NEW--------- */ 
  const runSearch = async () => {
    console.log('🔍 Starting search with keyword:', searchTerm);
    console.log('🌐 Calling API endpoint:', API_ENDPOINTS.filteredComments);
  setIsLoading(true);
  try {
    const response = await fetch(API_ENDPOINTS.filteredComments, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: searchTerm,
        subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
        emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
        topics: topics.includes("all") ? [] : topics,
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setFiltered(data.results || data); // Adjust based on your backend response structure
    setPage(1);
    
  } catch (error) {
    console.error("Search failed:", error);
    
    // Fallback to local filtering if backend fails
    const localResults = applyFilters();
    setFiltered(localResults);
    setPage(1);
  } finally {
    setIsLoading(false);
  }
};

/* ---------- Clear Filters ---------- */
const clearSearch = () => {
  setKeyword("");
  setIntensityPct(50);
  setTimeFilter("all");
  setEmotions(["all"]);
  setSubs(["all"]);
  setTopics(["all"]);
  setPage(1); // reset to first page
};



  // Sorting + pagination
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const [page, setPage] = useState<number>(1);

  // Selection (details sidebar)
  const [selected, setSelected] = useState<DesireWishesItem | null>(null);

  // Sort
  const sorted = useMemo(() => {
    if (!sort.column) return filtered;
    const rows = [...filtered];

    rows.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sort.column) {
        case "author":
          aVal = a.author.toLowerCase();
          bVal = b.author.toLowerCase();
          break;
        case "timestamp":
          aVal = a.timestampSort;
          bVal = b.timestampSort;
          break;
        case "subreddit":
          aVal = a.subreddit.toLowerCase();
          bVal = b.subreddit.toLowerCase();
          break;
        case "upvotes":
          aVal = a.upvotes;
          bVal = b.upvotes;
          break;
        case "intensity":
          aVal = a.intensity;
          bVal = b.intensity;
          break;
        default:
          return 0;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sort.direction === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return rows;
  }, [filtered, sort]);

  // Pagination
  const lastPage = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, lastPage);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(sorted.length, currentPage * ITEMS_PER_PAGE);

  // Handlers
  const setSortColumn = (col: Exclude<SortColumn, null>) => {
    setSort((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column: col, direction: "asc" };
    });
  };


  // Replace the existing onExportData and onExportInsights functions

// Change this in your export functions: NEW
const onExportData = async () => {
  try {
    setIsExporting(true);
    
    const response = await fetch(API_ENDPOINTS.exportData, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
        emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
        topics: topics.includes("all") ? [] : topics,
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desires-wishes-data.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    // Fallback to local export
    const csvContent = toCSV(filtered);
    downloadBlob(csvContent, "desires-wishes-data.csv", "text/csv");
  } finally {
    setIsExporting(false);
  }
};

const onExportInsights = async () => {
  try {
    setIsExporting(true);
    
    const response = await fetch(API_ENDPOINTS.exportInsights, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword,
        subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
        emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
        topics: topics.includes("all") ? [] : topics,
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desires-wishes-insights.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    // Fallback to local insights
    const insightsContent = insightsText(filtered);
    downloadBlob(insightsContent, "desires-wishes-insights.txt", "text/plain");
  } finally {
    setIsExporting(false);
  }
};


  // Insights
  const insights = useMemo(() => {
    const validRows = sorted.filter((r) => r.topic && r.emotion);
    const total = validRows.length || 1;
  
    const byTopic = new Map<string, number>();
    const byEmotion = new Map<Emotion, number>();
  
    validRows.forEach((r) => {
      byTopic.set(r.topic, (byTopic.get(r.topic) ?? 0) + 1);
      byEmotion.set(r.emotion, (byEmotion.get(r.emotion) ?? 0) + 1);
    });
  
    // Top 3 topics
    const topTopics = [...byTopic.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({
        topic,
        label: topic, // just use the topic string itself
        pct: Math.round((count / total) * 100),
      }));
  
    // Emotions sorted by count
    const emotionOrder = [...byEmotion.entries()].sort((a, b) => b[1] - a[1]);
    const emotionPercents = emotionOrder.map(([emotion, count]) => ({
      emotion,
      pct: Math.round((count / total) * 100),
    }));
  
    return { topTopics, emotionOrder, emotionPercents };
  }, [sorted]);
  


  return (
    <div className="min-h-screen bg-[#FBF3FE] text-slate-700">
      <main className="mx-auto max-w-7xl px-4 py-6">
  
        {/* Search & Filters */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-black">
            Desired Outcomes
          </h2>

          <div className="flex flex-col gap-4 mt-4">
            {/* Keywords */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Search Keywords</label>
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    runSearch();
                  }
                }}
                  placeholder="e.g. better sleep, less anxiety"
                  className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200 transform hover:animate-[jiggle_0.3s_ease-in-out]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={runSearch}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] disabled:opacity-50"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isLoading ? "Searching..." : "Run Search"}
                </button>
                <button
                  onClick={clearSearch}
                  className="h-10 px-4 rounded-lg text-sm font-semibold border-2 border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-50 shadow-sm hover:shadow transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
                ><span className="mr-1">⟲</span> Clear
                </button>
              </div>
            </div>

            {/* Subreddits */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Subreddits
              </label>
              <div className="flex flex-wrap gap-2">
                {subredditOptions.map((opt) => {
                  const isActive = selectedSubreddits.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (opt.key === "all") {
                          setSubs(["all"]);
                        } else {
                          setSubs((prev) => {
                            if (prev.includes(opt.key)) {
                              const next = prev.filter((s) => s !== opt.key);
                              return next.length > 0 ? next : ["all"];
                            } else {
                              return [...prev.filter((s) => s !== "all"), opt.key];
                            }
                          });
                        }
                      }}
                      className={[
                        "h-8 px-3 rounded-full text-xs font-semibold transition border-2",
                        isActive
                          ? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow"
                          : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Topics
              </label>
              <div className="flex flex-wrap gap-2">
                {topicOptions.map((opt) => {
                  const isActive = topics.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        if (opt.key === "all") {
                          setTopics(["all"]);
                        } else {
                          setTopics((prev) => {
                            if (prev.includes(opt.key)) {
                              const next = prev.filter((t) => t !== opt.key);
                              return next.length > 0 ? next : ["all"];
                            } else {
                              return [...prev.filter((t) => t !== "all"), opt.key];
                            }
                          });
                        }
                      }}
                      className={[
                        "h-8 px-3 rounded-full text-xs font-semibold transition border-2",
                        isActive
                          ? "bg-gradient-to-br from-purple-500 to-indigo-400 text-white border-transparent shadow"
                          : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sentiment + Time */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sentiment Intensity</label>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {emotionOptions.map((emotion, idx) => {
                      const isActive = selectedEmotions.includes(emotion);
                      return (
                        <button
                          key={`desires-${emotion}-${idx}`}  // ensures uniqueness
                          onClick={() => {
                            if (emotion === "all") {
                              setEmotions(["all"]);
                            } else {
                              setEmotions((prev) => {
                                const next = prev.includes(emotion)
                                  ? prev.filter((e) => e !== emotion)
                                  : [...prev.filter((e) => e !== "all"), emotion];
                                return next.length ? next : ["all"];
                              });
                            }
                          }}
                          className={`h-8 px-3 rounded-full text-xs font-semibold transition border-2 ${
                            isActive
                              ? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow"
                              : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"
                          }`}
                        >
                          {emotion === "all"
                            ? "😐 All"
                            : `${emotionEmoji[emotion as Emotion] ?? "❓"} ${emotion[0].toUpperCase() + emotion.slice(1)}`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="max-w-sm">
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={intensityPct}
                        onChange={(e) => setIntensityPct(parseInt(e.target.value, 10))}
                        className="w-full accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Weak</span>
                        <span>Mild</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-violet-600">{intensityPct}%</div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-56">
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="timeFilter">
                  Filter for Time
                </label>
                <select
                  id="timeFilter"
                  value={timeFilter}
                  onChange={(e) =>
                    setTimeFilter(e.target.value as "all" | "past_day" | "past_week" | "past_month" | "past_year")
                  }
                  className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200 transform hover:animate-[jiggle_0.3s_ease-in-out]"
                >
                  <option value="all">All Time</option>
                  <option value="past_day">Past Day</option>
                  <option value="past_week">Past Week</option>
                  <option value="past_month">Past Month</option>
                  <option value="past_year">Past Year</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Data
            </h2>
            <div className="flex items-center gap-4">
              {/* Comment counter */}
             <div className="text-sm text-slate-500 mb-3">
             {sorted.length === 0 ? null : sorted.length === 1 ? (
              <>
              Showing{" "}
              <span className="font-semibold text-slate-700">1</span>{" "}
              comment
                    </>
              ) : (
                    <>
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {rangeStart}-{rangeEnd}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-700">{sorted.length}</span>{" "}
                          comments
                        </>
                        )}
                  </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleChatInputBar}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
                >
                  <ChatIcon />
                  Ask in chat
                </button>
                <button
                  onClick={onExportData}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] disabled:opacity-50"
                >
                  {isExporting ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  )}
                  {isExporting ? "Exporting..." : "Export"}
</button>
              </div>
            </div>
          </div>

          {/* Glow wrapper around table only */}
          <TableEffectWrapper chatWithAI={isVisibleBar}>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow relative">
              <table className="min-w-[900px] w-full text-sm relative z-10">
                <thead className="bg-gradient-to-br from-violet-50 to-fuchsia-50">
                  <tr className="text-left text-slate-700">
                    <Th>Author</Th>
                    <Th
                      sortable
                      onClick={() => setSortColumn("timestamp")}
                      active={sort.column === "timestamp"}
                      dir={sort.direction}
                    >
                      Timestamp
                    </Th>
                    <Th>Subreddit</Th>
                    <Th>Topic</Th>
                    <Th>Comment</Th>
                    <Th
                      sortable
                      onClick={() => setSortColumn("upvotes")}
                      active={sort.column === "upvotes"}
                      dir={sort.direction}
                    >
                      Upvotes
                    </Th>
                    <Th>Emotion</Th>
                    <Th
                      sortable
                      onClick={() => setSortColumn("intensity")}
                      active={sort.column === "intensity"}
                      dir={sort.direction}
                    >
                      Intensity
                    </Th>
                    <Th>Desire/Wish</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/60 hover:bg-violet-50/40 cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <Td>{r.author}</Td>
                      <Td>{r.timestamp}</Td>
                      <Td>{r.subreddit}</Td>
                      <Td>{r.topic}</Td>
                      <Td className="max-w-[320px] truncate">{r.comment}</Td>
                      <Td>{r.upvotes}</Td>
                      <Td>
                        {emotionEmoji[r.emotion]} <br />{r.emotion}
                      </Td>
                      <Td>{Math.round(r.intensity * 100)}%</Td>
                      <Td className="max-w-[320px] truncate">{r.desire_wish}</Td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500">
                        No results. Adjust filters and click <span className="font-semibold text-violet-600">Run Search</span>.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableEffectWrapper>

          {/* ✅ Pagination INSIDE Data card */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
              aria-label="Previous page"
            >
              ‹
            </button>
            {pageWindow(currentPage, lastPage).map((n, i) =>
              typeof n === "string" ? (
                <span key={`${n}${i}`} className="px-2 text-slate-500">
                  {n}
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={[
                    "h-8 min-w-8 px-2 rounded-md border text-sm font-medium hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]",
                    n === currentPage
                      ? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow"
                      : "border-violet-200 text-slate-700 hover:bg-violet-50",
                  ].join(" ")}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:bg-violet-50 hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </section>

        {/* Top Insights */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Top Insights
            </h2>
            <button
              onClick={onExportInsights}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] disabled:opacity-50"
            >
              {isExporting ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>

          {/*Data Visualization Part */}
          <div className="flex flex-col gap-6">

            <div>
              {/* Top: Insights list */}
              <div>
                <p className="text-sm text-slate-500 mb-3">List of the most expressed desires/wishes</p>
                <div className="space-y-2">
                  {insights.topTopics.length > 0 ? (
                    insights.topTopics.map((c, idx) => (
                      <div
                        key={c.topic}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 bg-white/80 shadow-sm"
                      >
                        <span
                          className={[
                            "min-w-[160px] max-w-xs h-9 grid place-items-center rounded-full text-sm font-semibold text-center truncate",
                            idx === 0
                              ? "bg-gradient-to-br from-rose-200 to-rose-300 text-slate-800"
                              : idx === 1
                              ? "bg-gradient-to-br from-lime-200 to-lime-300 text-slate-800"
                              : "bg-gradient-to-br from-amber-200 to-amber-300 text-slate-800",
                          ].join(" ")}
                        >
                          {c.label}
                        </span>
                        <span className="text-sm font-medium text-slate-700 break-words">
                          {c.pct}% of users express desires related to {c.label.toLowerCase()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-500">No insights available for the current selection.</div>
                  )}
                </div>
              </div>

              {/* Common themes */}
              <div className="pt-4">
                <p className="text-sm text-slate-500 mb-2">Common themes</p>
                <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-slate-200/60 bg-white/70 transform hover:animate-[jiggle_0.3s_ease-in-out]">
                  {insights.emotionOrder.length > 0 ? (
                    insights.emotionOrder.map(([e]) => (
                      <span
                        key={e}
                        className="px-2.5 py-1 rounded-full border text-sm font-semibold border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50"
                      >
                        {emotionEmoji[e]} {e.charAt(0).toUpperCase() + e.slice(1)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No emotions found.</span>
                  )}
                </div>
              </div>

              {/* Sentiment bars */}
              <div className="pt-6">
                <p className="text-sm text-gray-600 font-medium mb-4">
                  Sentiment Analysis – How common was each theme
                </p>
                <div className="space-y-4">
                  {["sadness", "joy", "disappointment"].map((e) => {
                    const pct = insights.emotionPercents.find(ep => ep.emotion === e)?.pct || 0;
                    const color = e === "sadness" ? "bg-pink-400" : e === "joy" ? "bg-yellow-300" : "bg-green-400";
                    return (
                      <div key={e} className="flex items-center space-x-3">
                        <span className="w-28 text-sm font-medium text-gray-700">
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 rounded border overflow-hidden">
                          <div className={`h-4 ${color}`} style={{ width: pct + "%" }}></div>
                        </div>
                        <span className="w-14 text-sm text-gray-700 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>


        </section>

      </main>

      {/* Overlay for chat dimming effect */}
      {chatState !== 'hidden' && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick= {handleCloseBar}
        />
      )}

      {chatState !== 'hidden' && (
          <ChatInputBar onSendMessage={handleSendMessage} isVisibleBar={isVisibleBar}/>
      )}

      {chatState === 'full-chat' && (
        <ChatPanel messages={messages} onMinimize={minimizeChat} isVisiblePanel={isVisiblePanel}/>
      )}

      {/* Details Sidebar */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelected(null)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-800">Comment Details</h4>
              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100 transform hover:animate-[jiggle_0.3s_ease-in-out]"
                aria-label="Close"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Full Comment">
                <p className="text-sm leading-relaxed">{selected.comment}</p>
              </Field>

              <Field label="Author">
                <p className="text-sm font-medium">{selected.author}</p>
              </Field>

              <Field label="Subreddit">
                <p className="text-sm font-medium">{selected.subreddit}</p>
              </Field>

              <Field label="Topic">
                <p className="text-sm font-medium">{selected.topic}</p>
              </Field>

              <Field label="Desire/Wish">
                <p className="text-sm font-medium">{selected.desire_wish}</p>
              </Field>

              <Field label="Emotion">
                <p className="text-sm font-medium">
                  {emotionEmoji[selected.emotion]}{" "}
                  {selected.emotion.charAt(0).toUpperCase() + selected.emotion.slice(1)}
                </p>
              </Field>

              <Field label="Sentiment Intensity">
                <p className="text-sm font-medium">
                  {Math.round(selected.intensity * 100)}%{" "}
                  {selected.intensity > 0.8 ? "(High)" : selected.intensity > 0.5 ? "(Moderate)" : "(Low)"}
                </p>
              </Field>

            </div>
          </aside>
        </div>
      )}
      
    </div>
  );
}

// ----- Presentational helpers -----
function Th({
  children,
  sortable = false,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  sortable?: boolean;
  onClick?: () => void;
  active?: boolean;
  dir?: SortDirection;
}) {
  const base = "px-3 py-2 text-xs font-semibold select-none";
  if (!sortable) return <th className={`${base}`}>{children}</th>;
  return (
    <th>
      <button
        type="button"
        onClick={onClick}
        className={`${base} flex items-center gap-1 group`}
        title="Sort"
      >
        <span>{children}</span>
        <svg
          className={[
            "w-3 h-3 transition",
            active ? "opacity-100" : "opacity-50 group-hover:opacity-80",
            active && dir === "desc" ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 text-sm text-slate-700 ${className}`}>{children}</td>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 mb-1">{label}</div>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}
