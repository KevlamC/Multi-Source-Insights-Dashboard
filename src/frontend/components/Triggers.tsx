import React, { useEffect, useMemo, useRef, useState } from "react";
import TableEffectWrapper from "./TableEffectWrapper";
import { ChatInputBar } from "./ChatInputBar";
import { ChatPanel } from "./ChatPanel";
import { ChatIcon } from "./Icons";
import type { Message } from "./ChatPanel";
import { TiggerWaffle } from "./TriggerWaffle";
import { TriggerCluster } from "./TriggerCluster";
import type { Emotion } from "./Emotion";
import { emotionEmoji } from "./Emotion";
import type { TriggersItem } from "./ItemInterfaces";
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

type SortColumn = "author" | "timestamp" | "subreddit" | "upvotes" | "intensity" | null;
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

/* =========================
 * Sample Data (expanded)
 * =======================*/
const SAMPLE_DATA: TriggersItem[] = [
  {
    id: "1",
    author: "u/insomnia_loop",
    timestamp: "3 hours ago",
    timestampSort: 3,
    subreddit: "r/insomnia",
    comment:
      "Melatonin helped the first week, but now I wake up at 3am and can't fall back asleep. I feel stuck and more tired than before.",
    upvotes: 88,
    triggerPhrase: "Melatonin stopped working",
    emotion: "annoyance",
    intensity: 0.86,
    topic: "Sleep Aids",
  },
  {
    id: "2",
    author: "u/blanket_regret",
    timestamp: "7 hours ago",
    timestampSort: 7,
    subreddit: "r/sleep",
    comment:
      "Everyone swore by weighted blankets but mine just traps heat. No change in sleep quality, just more night sweats.",
    upvotes: 51,
    triggerPhrase: "Weighted blanket did nothing",
    emotion: "disappointment",
    intensity: 0.78,
    topic: "Sleep Accessories",
  },
  {
    id: "3",
    author: "u/therapy_try",
    timestamp: "9 hours ago",
    timestampSort: 9,
    subreddit: "r/anxiety",
    comment:
      "Therapy is supposed to help but I leave sessions still spiraling. Maybe it's not the right modality for me?",
    upvotes: 64,
    triggerPhrase: "still anxious 24/7",
    emotion: "annoyance",
    intensity: 0.73,
    topic: "Mental Health",
  },
  {
    id: "4",
    author: "u/blue_light_blues",
    timestamp: "1 day ago",
    timestampSort: 24,
    subreddit: "r/insomnia",
    comment:
      "I wear blue light blockers after 7pm and reduced screens but my sleep onset latency is the same.",
    upvotes: 39,
    triggerPhrase: "didn't change my sleep",
    emotion: "confusion",
    intensity: 0.69,
    topic: "Screen Habits",
  },
  {
    id: "5",
    author: "u/spine_fine_not",
    timestamp: "2 days ago",
    timestampSort: 48,
    subreddit: "r/chronicpain",
    comment:
      "Tried 6 chiropractor sessions. Short relief followed by worse lower back pain. Feeling scammed.",
    upvotes: 120,
    triggerPhrase: "pain came back stronger",
    emotion: "anger",
    intensity: 0.9,
    topic: "Pain Management",
  },
  {
    id: "6",
    author: "u/magnesium_maybe",
    timestamp: "5 hours ago",
    timestampSort: 5,
    subreddit: "r/supplements",
    comment:
      "Everyone recommended magnesium glycinate for sleep and muscle cramps. 4 weeks in, zero noticeable effect.",
    upvotes: 44,
    triggerPhrase: "no change to sleep or cramps",
    emotion: "annoyance",
    intensity: 0.71,
    topic: "Supplements",
  },
  {
    id: "7",
    author: "u/yoga_yes_no",
    timestamp: "3 days ago",
    timestampSort: 72,
    subreddit: "r/fitness",
    comment:
      "Been consistent with yoga. I move better but the deep ache in my back is unchanged. Not sure what's next.",
    upvotes: 33,
    triggerPhrase: "not my back pain",
    emotion: "sadness",
    intensity: 0.68,
    topic: "Fitness",
  },
  {
    id: "8",
    author: "u/acupuncture_try",
    timestamp: "4 days ago",
    timestampSort: 96,
    subreddit: "r/wellness",
    comment:
      "I feel a 20% improvement after sessions but it fades within a day. Too expensive to maintain.",
    upvotes: 57,
    triggerPhrase: "never lasts",
    emotion: "disappointment",
    intensity: 0.8,
    topic: "Alternative Medicine",
  },
];


const ITEMS_PER_PAGE = 7;
const TOTAL_ITEMS = SAMPLE_DATA.length;

/* =========================
 * Utilities
 * =======================*/
function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(rows: TriggersItem[]): string {
  const header = [
    "Author",
    "Timestamp",
    "Subreddit",
    "Comment",
    "TriggerPhrase",
    "Emotion",
    "Upvotes",
    "Intensity",
    "Topic"
  ];
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows
    .map((r) =>
      [
        r.author,
        r.timestamp,
        r.subreddit,
        r.comment,
        r.triggerPhrase,
        r.emotion,
        String(r.upvotes),
        r.intensity.toFixed(2),
        r.topic,
      ]
        .map(escape)
        .join(",")
    )
    .join("\n");
  return [header.join(","), body].join("\n");
}

function pageWindow(current: number, last: number): (number | string)[] {
  if (last <= 6) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = [
    1,
    2,
    last - 1,
    last,
    current - 1,
    current,
    current + 1,
  ].filter((n) => n >= 1 && n <= last);
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  const out: (number | string)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
  }
  return out;
}

/* =========================
 * Component
 * =======================*/
export default function Triggers() {
  /* ---------- Chat like Painpoints ---------- */
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

  useEffect(() => {
    if (chatState === "input-bar") setIsVisibleBar(true);
  }, [chatState]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("react-chat-history");
      if (saved) setMessages(JSON.parse(saved));
    } catch (e) {
      console.error("Error loading chat history", e);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("react-chat-history", JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving chat history", e);
    }
  }, [messages]);


  const handleSendMessage = async (text: string, task = "Generate a short summary about triggers.") => {
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
          min_intensity: intensityPct / 100,
          time: timeFilter,
          data_type: "triggers"
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
    if (chatState === "hidden") {
      setChatState("input-bar");
      setIsVisibleBar(true);
      setTimeout(() => chatInputRef.current?.focus(), 300);
    } else {
      handleCloseBar();
    }
  };
  const handleCloseBar = () => {
    setIsVisibleBar(false);
    setTimeout(() => setChatState("hidden"), 300);
  };
  const minimizeChat = () => {
    setIsVisiblePanel(false);
    setTimeout(() => setChatState("input-bar"), 300);
  };

  
  /* ---------- Filters ---------- */
  const [keyword, setKeyword] = useState<string>("");
  const [intensityPct, setConfidencePct] = useState<number>(50);
  const [timeFilter, setTime] =
    useState<"all" | "past_day" | "past_week" | "past_month" | "past_year">("all");

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

  /* ---------- Filtered results ---------- */
  const [filtered, setFiltered] = useState<typeof SAMPLE_DATA>(SAMPLE_DATA);
  
  // preparation for apply filter backend
  // const filters = {keyword, intensityPct, timeFilter, selectedEmotions, topics, selectedSubreddits};
  // const runSearchBackend = () => {
  //   applyFiltersBackend<TriggersItem>("TriggersItem", filters, setFiltered);
  //   setPage(1); // reset to first page
  // };


  /* ---------- Helper: Apply Filters ---------- */
  const applyFilters = () => {
    const kw = keyword.trim().toLowerCase();
    const conf = intensityPct / 100;

    let rows = [...SAMPLE_DATA];

    // Keyword filter
    if (kw) {
      rows = rows.filter(
        (r) =>
          r.comment.toLowerCase().includes(kw) ||
          r.triggerPhrase.toLowerCase().includes(kw) ||
          r.author.toLowerCase().includes(kw) ||
          r.topic.toLowerCase().includes(kw)
      );
    }

    // Subreddit filter
    if (!selectedSubreddits.includes("all")) {
      rows = rows.filter((r) => selectedSubreddits.includes(r.subreddit as SubredditKey));
    }

    // Emotion filter
    if (!selectedEmotions.includes("all")) {
      rows = rows.filter((r) => selectedEmotions.includes(r.emotion));
    }

    // Topic filter
    if (!topics.includes("all")) {
      rows = rows.filter((r) => topics.includes(r.topic));
    }

    // Confidence filter
    rows = rows.filter((r) => r.intensity >= conf);

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
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
        data_type: "triggers"  // Specify this is for triggers
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

  /* ---------- Clear Filters ---------- */
  const clearFilters = () => {
    setKeyword("");
    setConfidencePct(50);
    setTime("all");
    setEmotions(["all"]);
    setSubs(["all"]);
    setTopics(["all"]);
    setPage(1); // reset to first page
  };



  /* ---------- Sorting ---------- */
  const [sort, setSort] = useState<SortState>({ column: null, direction: "asc" });
  const setSortColumn = (col: Exclude<SortColumn, null>) => {
    setSort((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column: col, direction: "asc" };
    });
  };

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
        return sort.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sort.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return rows;
  }, [filtered, sort]);

  /* ---------- Pagination ---------- */
  const [page, setPage] = useState<number>(1);
  const lastPage = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, lastPage);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [sorted, currentPage]);

  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const rangeEnd = Math.min(sorted.length, currentPage * ITEMS_PER_PAGE);

  /* ---------- Selection Sidebar ---------- */
  const [selected, setSelected] = useState<TriggersItem | null>(null);

  /* ---------- Actions ---------- */
  // Change this in your export functions:
const onExportData = async () => {
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
        min_intensity: intensityPct / 100,
        time: timeFilter === "all" ? null : timeFilter,
        data_type: "triggers"
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trigger-phrases-data.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    // Fallback to local export
    const csvContent = toCSV(filtered);
    downloadBlob(csvContent, "trigger-phrases-data.csv", "text/csv");
  } finally {
    setIsExporting(false);
  }
};


  /* =========================
   * Render
   * =======================*/
  return (
    <div className="min-h-screen bg-[#FBF3FE] text-slate-700">
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-violet-500 bg-clip-text text-transparent mb-4">
            Trigger Phrases
          </h2>

          <div className="flex flex-col gap-4">
            {/* Keywords + Actions */}
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Search Keywords
                </label>
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { runSearch(); } }}
                    placeholder="e.g. melatonin, therapy, weighted blanket, magnesium, blue light glasses, acupuncture"
                    className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200"
                  />
              </div>
              <div className="flex gap-2">
                <button
                    onClick={runSearch}
                    disabled={isLoading}
                    className="h-10 px-4 rounded-lg text-sm font-semibold text-white shadow-md bg-gradient-to-br from-violet-500 to-fuchsia-400 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
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
                      "Run Search"
                    )}
                  </button>
                <button
                  onClick={clearFilters}
                  className="h-10 px-4 rounded-lg text-sm font-semibold border-2 border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition"
                >
                  Clear
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


            {/* Emotion + Time + Intensity */}
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
                          key={`triggers-${emotion}-${idx}`}  // ensures uniqueness
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
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Intensity Level
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={intensityPct}
                        onChange={(e) =>
                          setConfidencePct(parseInt(e.target.value, 10))
                        }
                        className="w-full accent-violet-500"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Weak</span>
                        <span>Mild</span>
                        <span>High</span>
                      </div>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-violet-600">
                      {intensityPct}%
                    </div>
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
                    setTime(
                      e.target.value as "all" | "past_day" | "past_week" | "past_month" | "past_year"
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
          </div>
        </section>

        {/* Data Section */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Data</h3>
            <div className="flex justify-end lg:flex-row gap-x-2">
              <button
                onClick={toggleChatInputBar}
                className="h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-md bg-gradient-to-br from-violet-500 to-fuchsia-400 hover:shadow-lg transition flex items-center gap-2"
              >
                <ChatIcon />
                <span>Ask in chat</span>
              </button>
              <button
                  onClick={onExportData}
                  disabled={isExporting}
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-md bg-gradient-to-br from-violet-500 to-fuchsia-400 hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    "Export"
                  )}
                </button>
            </div>
          </div>

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
                    <Th>Trigger Phrases</Th>
                    <Th>Topic</Th>
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
                      <Td className="max-w-[320px] truncate">{r.comment}</Td>
                      <Td>{r.upvotes}</Td>
                      <Td>
                        {emotionEmoji[r.emotion] ?? "❓"} <br />{r.emotion}
                      </Td>
                      <Td>{Math.round(r.intensity * 100)}%</Td>
                      <Td>{r.triggerPhrase}</Td>
                      <Td className="max-w-[320px] truncate">{r.topic}</Td>
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

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:bg-violet-50"
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
                    "h-8 min-w-8 px-2 rounded-md border text-sm font-medium",
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
              className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:bg-violet-50"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </section>


        {/* Data Visualization Section*/}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl border border-white/20 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-left">Trigger Analysis</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Trigger Waffle */}
            <div className="flex flex-col items-center flex-1">
              <TiggerWaffle items={filtered} gridSize={10} />
            </div>

            {/* Trigger Cluster */}
            <div className="flex flex-col flex-1">
              <TriggerCluster
                triggers={[
                  { phrase: "long appointment wait", mentions: 45 },
                  { phrase: "high consultation cost", mentions: 32 },
                  { phrase: "no online booking", mentions: 28 },
                  { phrase: "poor bedside manner", mentions: 24 },
                  { phrase: "limited clinic hours", mentions: 20 },
                  { phrase: "slow lab results", mentions: 18 },
                  { phrase: "missing medical history", mentions: 16 },
                  { phrase: "insurance not accepted", mentions: 12 },
                  { phrase: "lack of follow-up", mentions: 10 },
                ]}
                totalMentions={285}
              />
            </div>
          </div>
        </section>

      </main>

      {/* Overlay for chat dimming effect */}
      {chatState !== "hidden" && (
        <div className="fixed inset-0 bg-black/20 z-30" onClick={handleCloseBar} />
      )}

      {chatState !== "hidden" && (
        <ChatInputBar onSendMessage={handleSendMessage} isVisibleBar={isVisibleBar} />
      )}

      {chatState === "full-chat" && (
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
              <h4 className="text-lg font-bold text-slate-800">Comment Details</h4>
              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100"
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

              <Field label="Trigger Phrase">
                <p className="text-sm font-medium">{selected.triggerPhrase}</p>
              </Field>

              <Field label="Emotion">
                <p className="text-sm font-medium">
                  {emotionEmoji[selected.emotion]}{" "}
                  {selected.emotion.charAt(0).toUpperCase() + selected.emotion.slice(1)}
                </p>
              </Field>

              <Field label="Intensity">
                <p className="text-sm font-medium">
                  {Math.round(selected.intensity * 100)}%{" "}
                  {selected.intensity > 0.8
                    ? "(High)"
                    : selected.intensity > 0.5
                    ? "(Moderate)"
                    : "(Low)"}
                </p>
              </Field>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/* =========================
 * Presentational helpers
 * =======================*/
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

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 text-sm text-slate-700 ${className}`}>{children}</td>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 mb-1">{label}</div>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}
