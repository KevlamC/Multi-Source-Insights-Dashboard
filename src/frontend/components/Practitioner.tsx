import React, { useEffect, useRef, useState, useMemo } from "react";
import { ChatInputBar } from "./ChatInputBar";
import { ChatPanel } from "./ChatPanel";
import type { Message } from "./ChatPanel";
import TableEffectWrapper from "./TableEffectWrapper";
import { ChatIcon } from "./Icons";
import { emotionEmoji } from "./Emotion";
import type { Emotion } from "./Emotion";
import type { PractitionerItem } from "./ItemInterfaces";
// import { applyFiltersBackend } from "./filterUtils";

// Add this after your imports
// const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
const API_BASE_URL = "http://localhost:3001";
// const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
//   ? process.env.REACT_APP_API_URL 
//   : "http://localhost:3001";

const API_ENDPOINTS = {
  filteredComments: `${API_BASE_URL}/get_filtered_cmts`,
  exportData: `${API_BASE_URL}/export_data`,
  exportInsights: `${API_BASE_URL}/export_insights`,
  chat: `${API_BASE_URL}/chat`
};

import { Play, RotateCcw, Download } from "lucide-react";

import {
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type SortColumn =
  | "author"
  | "subreddit"
  | "upvotes"
  | "emotion"
  | "timestamp"
  | "practitioner_type"
  | "intensity"
  | null;

type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 7;

/* =========================================================================
   Dummy data
   ========================================================================= */

const SAMPLE_DATA: PractitionerItem[] = [
  {
    id: "1",
    author: "user123",
    subreddit: "r/healthcare",
    comment: "The practitioner was very kind and helpful for my chronic pain.",
    upvotes: 15,
    emotion: "joy",
    timestamp: "2 days ago",
    timestampSort: 48,
    practitioner_type: "doctor",
    intensity: 0.9,
    topic: "health"
  },
  {
    id: "2",
    author: "docFan",
    subreddit: "r/medicine",
    comment: "Not satisfied with the consultation about back pain.",
    upvotes: 4,
    emotion: "disappointment",
    timestamp: "1 day ago",
    timestampSort: 24,
    practitioner_type: "doctor",
    intensity: 0.7,
    topic: "health"
  },
  {
    id: "3",
    author: "careSeeker",
    subreddit: "r/backpain",
    comment: "Anyone know a good doctor near Boston?",
    upvotes: 5,
    emotion: "neutral",
    timestamp: "3 days ago",
    timestampSort: 72,
    practitioner_type: "doctor",
    intensity: 0.55,
    topic: "health"
  },
  {
    id: "4",
    author: "yogaFan",
    subreddit: "r/backpain",
    comment: "For back pain, my practitioner suggested yoga and it worked wonders!",
    upvotes: 12,
    emotion: "joy",
    timestamp: "1 day ago",
    timestampSort: 24,
    practitioner_type: "doctor",
    intensity: 0.9,
    topic: "health"
  },
  {
    id: "5",
    author: "frustratedPatient",
    subreddit: "r/healthcare",
    comment: "Still have back pain after 3 visits. Not sure this practitioner understands.",
    upvotes: 5,
    emotion: "sadness",
    timestamp: "2 days ago",
    timestampSort: 48,
    practitioner_type: "therapist",
    intensity: 0.6,
    topic: "health"
  },
  {
    id: "6",
    author: "painRelief",
    subreddit: "r/medicine",
    comment: "My doctor prescribed a new medication for my chronic pain and it's finally helping!",
    upvotes: 20,
    emotion: "relief",
    timestamp: "10 hours ago",
    timestampSort: 10,
    practitioner_type: "counselor",
    intensity: 0.95,
    topic: "health"
  },
  {
    id: "7",
    author: "newbie",
    subreddit: "r/healthcare",
    comment: "What's the best way to find a good physical therapist for knee pain?",
    upvotes: 3,
    emotion: "curiosity",
    timestamp: "5 hours ago",
    timestampSort: 5,
    practitioner_type: "psychologist",
    intensity: 0.7,
    topic: "health"

  },
  {
    id: "8",
    author: "happyPatient",
    subreddit: "r/medicine",
    comment: "Highly recommend Dr. Smith for anyone dealing with migraines. She's a lifesaver!",
    upvotes: 30,
    emotion: "admiration",
    timestamp: "1 day ago",
    timestampSort: 24,
    practitioner_type: "psychiatrist",
    intensity: 0.98,
    topic: "health"
  },
  {
    id: "9",
    author: "skeptic",
    subreddit: "r/backpain",
    comment: "Tried acupuncture for my back pain, didn't do much. Feeling skeptical.",
    upvotes: 8,
    emotion: "disapproval",
    timestamp: "3 days ago",
    timestampSort: 72,
    practitioner_type: "dentist",
    intensity: 0.5,
    topic: "health"
  },
  {
    id: "10",
    author: "researcher",
    subreddit: "r/healthcare",
    comment: "Looking for studies on the effectiveness of chiropractic care for chronic pain.",
    upvotes: 6,
    emotion: "curiosity",
    timestamp: "6 hours ago",
    timestampSort: 6,
    practitioner_type: "teacher",
    intensity: 0.8,
    topic: "school"
  },
];

const TOTAL_ITEMS = SAMPLE_DATA.length;
const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

/* =========================================================================
   Types for centralized metrics (practitioner_calculations.py)
   ========================================================================= */
type RefOverTimePoint = {
  // flexible: accept several possible keys from your backend
  name?: string;
  bucket?: string;     // e.g., "2025-08-26", "10 hours ago"
  date?: string;
  count?: number;
  value?: number;
};

type PractitionerMetrics = {
  // e.g., [{ bucket: "2025-08-24", count: 12 }, ...]
  references_over_time?: RefOverTimePoint[];
  // e.g., { High: 70, Medium: 30 } OR [{ name: "High", value: 70 }, ...]
  intensity_distribution?:
    | Record<string, number>
    | Array<{ name?: string; label?: string; value?: number; count?: number }>;
};

/* =========================================================================
   Utilities
   ========================================================================= */

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

function toCSV(rows: PractitionerItem[]): string {
  const headers = [
    "Author",
    "Subreddit",
    "Comment",
    "Topic",
    "Votes",
    "Emotion",
    "Time",
    "Practitioner Type",
    "Intensity",
    "Topic"
  ];
  const escape = (s: string) => `"${s.replace(/"/g, "\"\"")}"`;
  const csvRows = rows.map((r) =>
    [
      r.author,
      r.subreddit,
      r.comment,
      r.topic,
      String(r.upvotes),
      r.emotion,
      r.timestamp,
      r.practitioner_type,
      (r.intensity * 100).toFixed(1) + "%",
      r.topic
    ].map(escape).join(",")
  );
  return [headers.map(escape).join(","), ...csvRows].join("\n");
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

/* =========================================================================
   Component
   ========================================================================= */

const Practitioner: React.FC = () => {

  // Chat with AI states
  const [chatState, setChatState] = useState<"hidden" | "input-bar" | "full-chat">("hidden");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [isVisibleBar, setIsVisibleBar] = useState(false);
  const [isVisiblePanel, setIsVisiblePanel] = useState(false);

   //NEW
    const [searchTerm, setSearchTerm] = useState(''); // For the input value
    const [results, setResults] = useState<any[]>([]); // For storing search results
    const [isLoading, setIsLoading] = useState(false);
    // Add this to your state
    const [isExporting, setIsExporting] = useState(false);

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

  const generateChatResponse = (userMessage: string): string => {
    const responses = [
      "Based on the current data, I can see several interesting patterns in the practitioner references.",
      "The data shows various emotions and experiences related to healthcare practitioners.",
      "Looking at the filtered results, there are insights about patient experiences and recommendations.",
    ];
    if (userMessage.toLowerCase().includes('pain')) {
      return "The data shows significant discussion around chronic pain management.";
    } else if (userMessage.toLowerCase().includes('doctor')) {
      return "Many comments reference interactions with physicians, showing both positive and challenging experiences.";
    }
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (text: string, task = "Generate a short summary about practitioner references.") => {
  const newUser: Message = { id: Date.now() + Math.random(), type: "user", content: text };
  const loading: Message = { id: Date.now() + Math.random(), type: "loading", content: "Thinking..." };
  setChatState("full-chat");
  setIsVisiblePanel(true);
  setMessages((prev) => [...prev, newUser, loading]);
  
  try {
    const response = await fetch(API_ENDPOINTS.chat, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_prompt: text,
        user_task: task,
        // Include current filters for context
        filters: {
          keyword,
          subreddits: selectedSubreddits,
          emotions: selectedEmotions,
          topics,
          practitioners,
          min_intensity: intensityPct / 100,
          time: timeFilter,
          data_type: "practitioners"
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch insights from backend');
    }

    const data: { summary: string } = await response.json();
    const botMessage: Message = { id: Date.now() + Math.random(), type: 'bot', content: data.summary };
    setMessages(prev => [...prev.filter(m => m.type !== 'loading'), botMessage]);

  } catch (error) {
    console.error('Failed to get AI response:', error);
    const errorMessage: Message = { id: Date.now() + Math.random(), type: 'bot', content: "Sorry, I couldn't get an answer. Please try again." };
    setMessages(prev => [...prev.filter(m => m.type !== 'loading'), errorMessage]);
  }
};

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
    setIsVisibleBar(false);
    setTimeout(() => setChatState('hidden'), 300);
  };

  const minimizeChat = () => {
    setIsVisiblePanel(false);
    setTimeout(() => {
      setChatState("input-bar");
    }, 300);
  };


  // Filters
  const [keyword, setKeyword] = useState<string>("");
  const [intensityPct, setIntensityPct] = useState<number>(50);
  const [timeFilter, setTimeFilter] = useState<"all" | "past_day" | "past_week" | "past_month" | "past_year">("all");

  // --- Emotion filter ---
  const distinctEmotions = Array.from(new Set(SAMPLE_DATA.map((item) => item.emotion)));
  const emotionOptions = ["all", ...distinctEmotions] as const;
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["all"]);

  // Topic Filter
  const topicOptions = [
    { key: "all", label: "All Topics" },
    ...Array.from(new Set(SAMPLE_DATA.map(item => item.topic))).map((topic) => ({
      key: topic,
      label: topic
    }))
  ];
  const [topics, setTopics] = useState<string[]>(["all"]);

  // --- Subreddit filter ---
  const subredditOptions = [
    { key: "all", label: "All" },
    ...Array.from(new Set(SAMPLE_DATA.map((item) => item.subreddit))).map((sub) => ({
      key: sub,
      label: sub,
    })),
  ] as const;
  type SubredditKey = (typeof subredditOptions)[number]["key"];
  const [selectedSubreddits, setSelectedSubreddits] = useState<SubredditKey[]>(["all"]);

  // practitioner type filter
  const practitionerOptions = [
    { key: "all", label: "All" },
    ...Array.from(new Set(SAMPLE_DATA.map((item) => item.practitioner_type))).map((sub) => ({
      key: sub,
      label: sub,
    })),
  ] as const;
  const [practitioners, setPractitioners] = useState<string[]>(["all"]);


  // Sorting + pagination
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const [page, setPage] = useState<number>(1);

  // Selection (details sidebar)
  const [selected, setSelected] = useState<PractitionerItem | null>(null);

  // ---------- Filtered Results ----------
  const [filtered, setFiltered] = useState<PractitionerItem[]>(SAMPLE_DATA);

  // preparation for apply filter backend
  // const filters = {keyword, intensityPct, timeFilter, selectedEmotions, topics, selectedSubreddits, practitioners};
  // const runSearch = () => {
  //   applyFiltersBackend<PractitionerItem>("PractitionerItem", filters, setFiltered);
  //   setPage(1); // reset to first page
  // };

  /* ---------- Helper: Apply Filters ---------- */
  const applyFilters = () => {
      const kw = keyword.trim().toLowerCase();
      let rows = [...SAMPLE_DATA];

      if (kw) {
        rows = rows.filter(
          (r) =>
          (
            r.comment?.toLowerCase() || "").includes(kw)||
            r.author.toLowerCase().includes(kw) ||
            r.subreddit.toLowerCase().includes(kw) ||
            r.emotion.toLowerCase().includes(kw) ||
            r.practitioner_type.toLowerCase().includes(kw)
        );
      }

      // Multi-subreddit filtering
      if (!selectedSubreddits.includes("all")) {
        rows = rows.filter((r) => selectedSubreddits.includes(r.subreddit as SubredditKey));
      }

      // Multi-emotion filtering
      if (!selectedEmotions.includes("all")) {
        rows = rows.filter((r) => selectedEmotions.includes(r.emotion));
      }

      // intensity value filter
      const intensityThreshold = intensityPct / 100;
      rows = rows.filter((r) => r.intensity >= intensityThreshold);

      // topic filter
      if (!topics.includes("all")) {
        rows = rows.filter((r) => topics.includes(r.topic));
      }
      // practitioner filter
      if (!practitioners.includes("all")) {
        rows = rows.filter((r) => practitioners.includes(r.practitioner_type));
      }
      // Time filter
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

  /* ---------- Run Search updated to backend --------- */ 
const runSearch = async () => {
  console.log('🔍 Starting search with keyword:', keyword);
  console.log('🌐 Calling API endpoint:', API_ENDPOINTS.filteredComments);
  
  setIsLoading(true);
  try {
    const response = await fetch(API_ENDPOINTS.filteredComments, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: keyword,
        subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
        emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
        topics: topics.includes("all") ? [] : topics,
        practitioners: practitioners.includes("all") ? [] : practitioners,
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
        data_type: "practitioners"  // Specify this is for practitioners
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setFiltered(data.results || data); // Use backend data
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

  /* ---------- Clear Search ---------- */
  const clearSearch = () => {
    setKeyword("");
    setSelectedEmotions(["all"]);
    setSelectedSubreddits(["all"]);
    setTopics(["all"]);
    setIntensityPct(50);
    setTimeFilter("all");
    setPractitioners(["all"]);
    setPage(1); // Reset pagination
  };

  const sortedPractitionerItems = useMemo(() => {
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
        case "subreddit":
          aVal = a.subreddit.toLowerCase();
          bVal = b.subreddit.toLowerCase();
          break;
        case "upvotes":
          aVal = a.upvotes;
          bVal = b.upvotes;
          break;
        case "emotion":
          aVal = a.emotion.toLowerCase();
          bVal = b.emotion.toLowerCase();
          break;
        case "timestamp":
          aVal = a.timestampSort;
          bVal = b.timestampSort;
          break;
        case "practitioner_type":
          aVal = a.practitioner_type.toLowerCase();
          bVal = b.practitioner_type.toLowerCase();
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

  const lastPage = Math.max(1, Math.ceil(sortedPractitionerItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, lastPage);
  const pagedPractitionerItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPractitionerItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedPractitionerItems, currentPage]);

  const rangeStart = sortedPractitionerItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(sortedPractitionerItems.length, currentPage * ITEMS_PER_PAGE);

  const setSortColumn = (col: Exclude<SortColumn, null>) => {
    setSort((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column: col, direction: "asc" };
    });
  };

  const downloadCsv = async () => {
  try {
    setIsExporting(true);
    
    const response = await fetch(API_ENDPOINTS.exportData, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: keyword,
        subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
        emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
        topics: topics.includes("all") ? [] : topics,
        practitioners: practitioners.includes("all") ? [] : practitioners,
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
        data_type: "practitioners"
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "practitioner-data.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    // Fallback to local export
    const csvContent = toCSV(filtered);
    downloadBlob(csvContent, "practitioner-data.csv", "text/csv");
  } finally {
    setIsExporting(false);
  }
};

  /* =========================
   * METRICS: load & adapt for visuals
   * =======================*/
  const [metrics, setMetrics] = useState<PractitionerMetrics | null>(null);

  const resolveMetricsUrl = (): string | null => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("metricsUrl");
      if (fromQuery) return fromQuery;
      // @ts-ignore
      const fromEnv = import.meta?.env?.VITE_PRACTITIONER_METRICS_URL as string | undefined;
      return fromEnv ?? null;
    } catch { return null; }
  };

  useEffect(() => {
    const url = resolveMetricsUrl();
    if (!url) { setMetrics(null); return; }
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`metrics http ${res.status}`);
        const data: PractitionerMetrics = await res.json();
        if (!aborted) setMetrics(data);
      } catch {
        setMetrics(null);
      }
    })();
    return () => { aborted = true; };
  }, []);

  /* =========================
   * Graph data (prefer metrics, else fallback to local computation)
   * =======================*/
  const lineChartData = useMemo(() => {
    // Prefer backend metrics
    if (metrics?.references_over_time?.length) {
      return metrics.references_over_time.map((p) => {
        const name = (p.name ?? p.bucket ?? p.date ?? "") as string;
        const cnt = (typeof p.count === "number" ? p.count : (typeof p.value === "number" ? p.value : 0)) as number;
        return { name, References: cnt };
      });
    }

    // Fallback: compute from current rows (original behavior)
    const dataMap = new Map<string, number>();
    sortedPractitionerItems.forEach(comment => {
      const timestampLabel = comment.timestamp;
      dataMap.set(timestampLabel, (dataMap.get(timestampLabel) || 0) + 1);
    });
    return Array.from(dataMap.entries())
      .map(([name, References]) => ({ name, References }))
      .sort((a, b) => {
        if (a.name.includes('hours ago') && b.name.includes('days ago')) return -1;
        if (a.name.includes('days ago') && b.name.includes('hours ago')) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [metrics, sortedPractitionerItems]);

  const pieChartData = useMemo(() => {
    // Prefer backend metrics
    const m = metrics?.intensity_distribution;
    if (m && Array.isArray(m)) {
      return m.map(x => ({
        name: (x.name ?? x.label ?? "Unknown") as string,
        value: (typeof x.value === "number" ? x.value : (typeof x.count === "number" ? x.count : 0)) as number,
      }));
    }
    if (m && !Array.isArray(m)) {
      return Object.entries(m).map(([name, value]) => ({ name, value: Number(value) || 0 }));
    }

    // Fallback: compute from current rows (original behavior)
    const dataMap = new Map<string, number>();
    sortedPractitionerItems.forEach(comment => {
      const intensityCategory =
        comment.intensity >= 0.7 ? "High" :
        comment.intensity >= 0.4 ? "Medium" :
        "Low";
      dataMap.set(intensityCategory, (dataMap.get(intensityCategory) || 0) + 1);
    });
    return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value }));
  }, [metrics, sortedPractitionerItems]);

  return (
    <div className="min-h-screen bg-[#FBF3FE] text-slate-700">
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Practitioner References */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Practitioner References
            </h2>
            <div className="flex gap-2">
              <button
                  onClick={runSearch}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Run Search</span>
                    </>
                  )}
              </button>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-2 rounded-lg border border-violet-400/60 text-violet-600 text-xs font-semibold px-3 py-2 bg-white hover:bg-violet-50 shadow-sm hover:shadow transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
              >
                <RotateCcw size={16} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Search Keywords */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Search Keywords</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. chronic pain, back pain"
                className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200"
              />
            </div>

            {/* Filter by Subreddits */}
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
                        setSelectedSubreddits(["all"]); // reset to all
                      } else {
                        setSelectedSubreddits((prev) => {
                          if (prev.includes(opt.key)) {
                            // remove subreddit
                            const next = prev.filter((s) => s !== opt.key);
                            return next.length > 0 ? next : ["all"];
                          } else {
                            // add subreddit, drop "all" if present
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

            {/* Emotion + Time */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Filter by Emotions
                </label>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {emotionOptions.map((emotion, idx) => {
                      const isActive = selectedEmotions.includes(emotion);
                      return (
                        <button
                          key={`practitioner-${emotion}-${idx}`}  // ensures uniqueness
                          onClick={() => {
                            if (emotion === "all") {
                              setSelectedEmotions(["all"]);
                            } else {
                              setSelectedEmotions((prev) => {
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
                </div>
              </div>

              <div className="w-full lg:w-56">
                <label
                  className="block text-sm font-semibold text-slate-700 mb-2"
                  htmlFor="timeFilter"
                >
                  Filter for Time
                </label>
                <select
                  id="timeFilter"
                  value={timeFilter}
                  onChange={(e) =>
                    setTimeFilter(
                      e.target.value as
                        | "all"
                        | "past_day"
                        | "past_week"
                        | "past_month"
                        | "past_year"
                    )
                  }
                  className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200"
                >
                  <option value="all">All Time</option>
                  <option value="past_day">Past Day</option>
                  <option value="past_week">Past Week</option>
                  <option value="past_month">Past Month</option>
                  <option value="past_year">Past Year</option>
                </select>
              </div>
            </div>

            {/* intensity Level & intensity Value */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Intensity Level</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensityPct}
                  onChange={(e) =>
                    setIntensityPct(parseInt(e.target.value, 10))
                  }
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Weak</span>
                  <span>Mid</span>
                  <span>High</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-violet-600">{intensityPct}%</div>
              </div>
            </div>

            {/* Practitioner Type buttons */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Practitioner Type
              </label>

              <div className="flex flex-wrap gap-2">
                {practitionerOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      if (opt.key === "all") {
                        // Clicking "All" resets selection
                        setPractitioners(["all"]);
                      } else {
                        setPractitioners((prev) => {
                          // If "all" was previously selected, remove it
                          const current = prev.includes("all") ? [] : prev;
                          return current.includes(opt.key)
                            ? current.filter((v) => v !== opt.key) // unselect
                            : [...current, opt.key]; // select
                        });
                      }
                    }}
                    className={`h-8 px-3 rounded-full text-xs font-semibold transition border-2 hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] ${
                      practitioners.includes(opt.key)
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow"
                        : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Data Table */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">
              Data
            </h2>
            <div className="flex gap-2">
              <button
                onClick={toggleChatInputBar}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1]"
              >
                <ChatIcon />
                <span>Ask in Chat</span>
              </button>
              <button
  onClick={downloadCsv}
  disabled={isExporting}
  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-3 py-2 shadow hover:shadow-md transition-transform hover:-translate-y-0.5 hover:animate-[jiggle_120ms_ease-in-out_1] disabled:opacity-50"
>
  {isExporting ? (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ) : (
    <Download size={16} />
  )}
  {isExporting ? "Exporting..." : "Download Data"}
</button>
            </div>
          </div>

          <div className="text-sm text-slate-500 mb-3">
             {sortedPractitionerItems.length === 0 ? null : sortedPractitionerItems.length === 1 ? (
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
                    <span className="font-semibold text-slate-700">{sortedPractitionerItems.length}</span>{" "}
                          comments
                        </>
                        )}
                  </div>

          <TableEffectWrapper chatWithAI={isVisibleBar}>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow relative">
              <table className="min-w-[900px] w-full text-sm relative z-10">
                <thead className="bg-gradient-to-br from-violet-50 to-fuchsia-50">
                  <tr className="text-left text-slate-700">
                    <Th sortable onClick={() => setSortColumn("author")} active={sort.column === "author"} dir={sort.direction}>Author</Th>
                    <Th sortable onClick={() => setSortColumn("subreddit")} active={sort.column === "subreddit"} dir={sort.direction}>Subreddit</Th>
                    <Th>Comments</Th>
                    <Th sortable onClick={() => setSortColumn("upvotes")} active={sort.column === "upvotes"} dir={sort.direction}>Votes</Th>
                    <Th sortable onClick={() => setSortColumn("emotion")} active={sort.column === "emotion"} dir={sort.direction}>Emotion</Th>
                    <Th sortable onClick={() => setSortColumn("intensity")} active={sort.column === "intensity"} dir={sort.direction}>Intensity</Th>
                    <Th sortable onClick={() => setSortColumn("timestamp")} active={sort.column === "timestamp"} dir={sort.direction}>Time</Th>
                    <Th sortable onClick={() => setSortColumn("practitioner_type")} active={sort.column === "practitioner_type"} dir={sort.direction}>Practitioner Type</Th>
                    <Th>Topic</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPractitionerItems.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/60 hover:bg-violet-50/40 cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <Td>{r.author}</Td>
                      <Td>{r.subreddit}</Td>
                      <Td className="max-w-[320px] truncate">{r.comment}</Td>
                      <Td>{r.upvotes}</Td>
                      <Td>{emotionEmoji[r.emotion]} {r.emotion.charAt(0).toUpperCase() + r.emotion.slice(1)}</Td>
                      <Td>{Math.round(r.intensity * 100)}%</Td>
                      <Td>{r.timestamp}</Td>
                      <Td>{r.practitioner_type}</Td>
                      <Td>{r.topic}</Td>
                    </tr>
                  ))}
                  {pagedPractitionerItems.length === 0 && (
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

        {/* Data Visualization Section */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-black">
            Data Visualization
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* References Over Time Line Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm h-80">
              <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">References Over Time</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" tick={{ fill: '#666' }} />
                  <YAxis tick={{ fill: '#666' }} />
                  <Tooltip formatter={(value: number) => [`${value} References`, 'Count']} />
                  <Line type="monotone" dataKey="References" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>

            {/* intensity Value Distribution Pie Chart */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm h-80">
              <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">intensity Value Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => {
                      const calculatedPercent = typeof percent === 'number' ? (percent * 100).toFixed(0) : '0';
                      return `${name} ${calculatedPercent}%`;
                    }}
                    >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} comments`, name]} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>

      {/* Overlay for chat dimming effect */}
      {chatState !== 'hidden' && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={handleCloseBar}
        />
      )}

      {chatState !== 'hidden' && (
        <ChatInputBar onSendMessage={handleSendMessage} isVisibleBar={isVisibleBar} />
      )}

      {chatState === 'full-chat' && (
        <ChatPanel messages={messages} onMinimize={minimizeChat} isVisiblePanel={isVisiblePanel} />
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
              <h4 className="text-lg font-bold text-slate-800">PractitionerItem Details</h4>
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
              <Field label="Full PractitionerItem">
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

              <Field label="Time">
                <p className="text-sm font-medium">{selected.timestamp}</p>
              </Field>

              <Field label="Practitioner Type">
                <p className="text-sm font-medium">{selected.practitioner_type}</p>
              </Field>

              <Field label="Emotion">
                <p className="text-sm font-medium">
                  {emotionEmoji[selected.emotion]} {selected.emotion.charAt(0).toUpperCase() + selected.emotion.slice(1)}
                </p>
              </Field>

              <Field label="Intensity">
                <p className="text-sm font-medium">
                  {Math.round(selected.intensity * 100)}%{" "}
                  {selected.intensity > 0.8 ? "(High)" : selected.intensity > 0.5 ? "(Moderate)" : "(Low)"}
                </p>
              </Field>

              <Field label="Votes">
                <p className="text-sm font-medium">{selected.upvotes}</p>
              </Field>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Practitioner;

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
