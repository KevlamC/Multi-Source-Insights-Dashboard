import React, { useState, useRef, useEffect, useMemo } from "react";
import TableEffectWrapper from "./TableEffectWrapper";
import EmotionSunburst from "./EmotionSunburst";
import { ChatInputBar } from "./ChatInputBar";
import { ChatPanel } from "./ChatPanel";
import { ChatIcon } from "./Icons";
import type { Message } from "./ChatPanel";
import { Download, BarChart3, TrendingUp, MessageCircle, Activity, Heart } from "lucide-react";
import { emotionEmoji } from "./Emotion";
import type { Emotion } from "./Emotion";
import type { MetaphorData } from "./ItemInterfaces";

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
  chat: `${API_BASE_URL}/chat`  // Specific chat endpoint
};

// ---------------- Sample (table fallback only) ----------------
const SAMPLE_DATA: MetaphorData[] = [
  { id:"1", metaphorPhrase:"drowning in anxiety", emotion:"nervousness", intensity:0.88, comment:"...", subreddit:"r/anxiety", author:"anxious_user123", timestamp:"2 hours ago", upvotes:45, topic:"anxiety" },
  { id:"2", metaphorPhrase:"mountain to climb",   emotion:"joy",         intensity:0.85, comment:"...", subreddit:"r/mentalhealth", author:"climbing_higher", timestamp:"4 hours ago", upvotes:67, topic:"recovery" },
  { id:"3", metaphorPhrase:"fog lifting",         emotion:"relief",      intensity:0.91, comment:"...", subreddit:"r/depression", author:"clearer_days", timestamp:"6 hours ago", upvotes:89, topic:"mental clarity" },
  { id:"4", metaphorPhrase:"storm inside",        emotion:"confusion",   intensity:0.87, comment:"...", subreddit:"r/mentalhealth", author:"stormy_mind", timestamp:"8 hours ago", upvotes:32, topic:"overthinking" },
  { id:"5", metaphorPhrase:"walking on eggshells",emotion:"nervousness", intensity:0.82, comment:"...", subreddit:"r/anxiety", author:"careful_steps", timestamp:"1 day ago", upvotes:54, topic:"social anxiety" },
  { id:"6", metaphorPhrase:"light at the end...", emotion:"joy",         intensity:0.90, comment:"...", subreddit:"r/depression", author:"hope_seeker", timestamp:"1 day ago", upvotes:78, topic:"hope" },
  { id:"7", metaphorPhrase:"weight on shoulders", emotion:"annoyance",   intensity:0.86, comment:"...", subreddit:"r/mentalhealth", author:"heavy_burden", timestamp:"2 days ago", upvotes:43, topic:"responsibility" },
  { id:"8", metaphorPhrase:"butterfly emerging",  emotion:"excitement",  intensity:0.89, comment:"...", subreddit:"r/mentalhealth", author:"new_wings", timestamp:"3 days ago", upvotes:92, topic:"personal growth" },
];
const ITEMS_PER_PAGE = 7;

// ---------------- Utilities ----------------
function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function toCSV(rows: MetaphorData[]): string {
  const header = ["Author","timestamp","Subreddit","Metaphor Phrase","Emotion","Intensity Score","Upvotes","Comment","Topic"];
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows.map(r => [r.author,r.timestamp,r.subreddit,r.metaphorPhrase,r.emotion,r.intensity.toFixed(2),String(r.upvotes),r.comment,r.topic].map(escape).join(",")).join("\n");
  return [header.join(","), body].join("\n");
}
function pageWindow(current: number, last: number): (number | string)[] {
  if (last <= 6) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = [1,2,last-1,last,current-1,current,current+1].filter(n=>n>=1&&n<=last);
  const sorted = Array.from(new Set(pages)).sort((a,b)=>a-b);
  const out:(number|string)[]=[]; for (let i=0;i<sorted.length;i++){ out.push(sorted[i]); if(i<sorted.length-1 && sorted[i+1]-sorted[i]>1) out.push("…"); }
  return out;
}

// ---------------- Metrics types (from metaphor_calculations.py) ----------------
type EmotionAgg = {
  name: string;
  upvotes: number;
  post_count: number;          // number of metaphors for that emotion
  percentage: number;          // % share (of total upvotes per script design)
  avg_upvotes_per_post?: number;
  top_contributing_subreddit?: string;
  top_subreddit_contribution_percentage?: number;
};
type SubredditAgg = {
  name: string;
  upvotes: number;
  post_count: number;
  percentage: number;          // % share (of total upvotes)
  avg_upvotes_per_post?: number;
};
type TopInsights = {
  total_metaphors: number;
  filtered_results: number;
  avg_upvotes: number;
  avg_intensity: number;
};
type MetaphorStats = {
  top_insights?: TopInsights;
  emotions?: EmotionAgg[];
  subreddits?: SubredditAgg[];
  // emotion_subreddit_breakdown, summary ... (not required for this UI)
};

// --------------- Component ----------------
type SortColumn = "author" | "timestamp" | "subreddit" | "upvotes" | "intensity" | null;
type SortDirection = "asc" | "desc";
interface SortState { column: SortColumn; direction: SortDirection; }

// Add this type definition
type SubredditKey = string;

export default function Metaphors() {
  // Chat UI
  const [chatState, setChatState] = useState<"hidden"|"input-bar"|"full-chat">("hidden");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [isVisibleBar, setIsVisibleBar] = useState(false);
  const [isVisiblePanel, setIsVisiblePanel] = useState(false);
  
  // Loading states
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filters (table only; visuals come from metrics) - ADD THESE STATE DECLARATIONS
  const [keyword, setKeyword] = useState("");
  const [intensityPct, setIntensityScore] = useState(0);
  const [timeFilter, setTimeFilter] = useState<"all"|"past_day"|"past_week"|"past_month"|"past_year">("all");

  const distinctEmotions = Array.from(new Set(SAMPLE_DATA.map(i=>i.emotion)));
  const emotionOptions = ["all", ...distinctEmotions] as const;
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(["all"]);

  const subredditOptions = [{key:"all",label:"All"} as const,
    ...Array.from(new Set(SAMPLE_DATA.map(i=>i.subreddit))).map(s=>({key:s,label:s}))] as const;
  const [selectedSubreddits, setSelectedSubreddits] = useState<SubredditKey[]>(["all"]);

  const topicOptions = [{key:"all",label:"All Topics"},
    ...Array.from(new Set(SAMPLE_DATA.map(i=>i.topic))).map(t=>({key:t,label:t}))];
  const [topics, setTopics] = useState<string[]>(["all"]);

  // Sorting + pagination (table)
  const [sort, setSort] = useState<SortState>({column:null, direction:"asc"});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MetaphorData | null>(null);
  const [filtered, setFiltered] = useState<MetaphorData[]>(SAMPLE_DATA);

  // -------------------- METRICS (centralized) --------------------
  const [stats, setStats] = useState<MetaphorStats | null>(null);
  const [chartRows, setChartRows] = useState<Array<{subreddit:string; upvotes:number; emotion:string; percentage?:number}>>([]);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const resolveMetricsUrl = (): string | null => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("metricsUrl");
      if (fromQuery) return fromQuery;
      // @ts-ignore
      const fromEnv = import.meta?.env?.VITE_METAPHORS_METRICS_URL as string | undefined;
      return fromEnv ?? null;
    } catch { return null; }
  };

  useEffect(() => {
    const url = resolveMetricsUrl();
    if (!url) { 
      setStats(null); 
      setChartRows([]); 
      setMetricsError("No metrics URL configured");
      return; 
    }
    
    let aborted=false;
    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`metrics http ${res.status}`);
        const data: MetaphorStats = await res.json();
        if (aborted) return;

        setStats(data);

        // Build synthetic rows so EmotionSunburst can compute ring sizes & tooltips.
        const em = data.emotions ?? [];
        const MAX_SYNTH = 2500;
        const totalCount = em.reduce((s,e)=>s+(e.post_count||0),0);
        const scale = totalCount>MAX_SYNTH ? MAX_SYNTH/Math.max(1,totalCount) : 1;

        const rows: Array<{subreddit:string; upvotes:number; emotion:string; percentage?:number}> = [];
        em.forEach(e=>{
          const n = Math.max(1, Math.round((e.post_count||0)*scale));
          const avgUp = Math.round((e.upvotes||0)/Math.max(1,(e.post_count||0)));
          const sr = e.top_contributing_subreddit || "agg";
          for(let i=0;i<n;i++){
            rows.push({
              subreddit: sr,
              upvotes: avgUp,
              emotion: e.name || "unknown",
              percentage: e.percentage
            });
          }
        });
        setChartRows(rows);
        setMetricsError(null);
      } catch (err:any) {
        setMetricsError(err?.message || "failed to load metrics");
        setStats(null);
        setChartRows([]);
      }
    })();
    return ()=>{aborted=true;};
  }, []);

  // -------------------- Table: filter/sort/paginate --------------------
  const applyFilters = () => {
    const kw = keyword.trim().toLowerCase();
    const thr = intensityPct/100;
    let rows = [...SAMPLE_DATA];
    if (kw) rows = rows.filter(r =>
      r.metaphorPhrase.toLowerCase().includes(kw) ||
      r.comment.toLowerCase().includes(kw) ||
      r.author.toLowerCase().includes(kw));
    if (!selectedSubreddits.includes("all"))
      rows = rows.filter(r => selectedSubreddits.includes(r.subreddit as SubredditKey));
    if (!selectedEmotions.includes("all"))
      rows = rows.filter(r => selectedEmotions.includes(r.emotion));
    if (!topics.includes("all"))
      rows = rows.filter(r => topics.includes(r.topic));
    rows = rows.filter(r => r.intensity >= thr);
    if (timeFilter !== "all") {
      let cutoffHours = Infinity;
      switch (timeFilter) {
        case "past_day": cutoffHours=24; break;
        case "past_week": cutoffHours=7*24; break;
        case "past_month": cutoffHours=30*24; break;
        case "past_year": cutoffHours=365*24; break;
      }
      rows = rows.filter(r => {
        const h = r.timestamp.includes("hour") ? parseInt(r.timestamp) :
                  r.timestamp.includes("day")  ? parseInt(r.timestamp)*24 : 999;
        return h <= cutoffHours;
      });
    }
    return rows;
  };
  
  /* ---------- Run Search updated to backend NEW--------- */ 
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
        data_type: "metaphors"  // Specify this is for metaphors
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

    
  const clearSearch = () => { setKeyword(""); setSelectedEmotions(["all"]); setSelectedSubreddits(["all"]); setIntensityScore(0); setTimeFilter("all"); setTopics(["all"]); setPage(1); };
  // ======== ADD THESE MISSING FUNCTIONS HERE ========
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
  
  // ======== MAKE SURE handleSendMessage IS DEFINED HERE ========
const handleSendMessage = async (text: string, task = "Generate a short summary about metaphors.") => {
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
          keyword: keyword,
          subreddits: selectedSubreddits,
          emotions: selectedEmotions,
          topics: topics,
          min_intensity: intensityPct / 100,
          time: timeFilter,
          data_type: "metaphors"
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
// ======== END OF handleSendMessage ========
// ======== END OF MISSING FUNCTIONS ========
  const sorted = useMemo(()=>{
    if(!sort.column) return filtered;
    const rows=[...filtered];
    rows.sort((a,b)=>{
      let aVal:string|number, bVal:string|number;
      switch (sort.column){
        case "author": aVal=a.author.toLowerCase(); bVal=b.author.toLowerCase(); break;
        case "timestamp":
          aVal = a.timestamp.includes("hour")?parseInt(a.timestamp):a.timestamp.includes("day")?parseInt(a.timestamp)*24:999;
          bVal = b.timestamp.includes("hour")?parseInt(b.timestamp):b.timestamp.includes("day")?parseInt(b.timestamp)*24:999;
          break;
        case "subreddit": aVal=a.subreddit.toLowerCase(); bVal=b.subreddit.toLowerCase(); break;
        case "upvotes": aVal=a.upvotes; bVal=b.upvotes; break;
        case "intensity": aVal=a.intensity; bVal=b.intensity; break;
        default: return 0;
      }
      if (typeof aVal==="string" && typeof bVal==="string") return sort.direction==="asc"? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sort.direction==="asc" ? (aVal as number)-(bVal as number) : (bVal as number)-(aVal as number);
    });
    return rows;
  },[filtered,sort]);
  const lastPage = Math.max(1, Math.ceil(sorted.length/ITEMS_PER_PAGE));
  const currentPage = Math.min(page,lastPage);
  const paged = useMemo(()=>sorted.slice((currentPage-1)*ITEMS_PER_PAGE, (currentPage-1)*ITEMS_PER_PAGE+ITEMS_PER_PAGE),[sorted,currentPage]);
  const rangeStart = sorted.length===0?0:(currentPage-1)*ITEMS_PER_PAGE+1;
  const rangeEnd = Math.min(sorted.length, currentPage*ITEMS_PER_PAGE);
  const setSortColumn=(col:Exclude<SortColumn,null>)=>setSort(prev=> prev.column===col ? {column:col,direction:prev.direction==="asc"?"desc":"asc"} : {column:col,direction:"asc"});
  
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
        data_type: "metaphors"
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metaphors-data.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    // Fallback to local export
    const csvContent = toCSV(filtered);
    downloadBlob(csvContent, "metaphors-data.csv", "text/csv");
  } finally {
    setIsExporting(false);
  }
};

const onExportInsights = async () => {
  try {
    setIsExporting(true); // FIXED: Changed from false to true
    
    // Prepare filters for backend
    const filters = {
      keyword,
      subreddits: selectedSubreddits.includes("all") ? [] : selectedSubreddits,
      emotions: selectedEmotions.includes("all") ? [] : selectedEmotions,
      topics: topics.includes("all") ? [] : topics,
      min_intensity: intensityPct / 100,
      time: timeFilter === "all" ? null : timeFilter,
    };

    const response = await fetch(API_ENDPOINTS.exportInsights, { // FIXED: Correct endpoint
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Create download from response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "metaphors-insights.csv"; // Changed filename to avoid confusion
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed. Please try again.");
  } finally {
    setIsExporting(false);
  }
};

  // -------------------- UI --------------------
  return (
    <div className="min-h-screen bg-[#FBF3FE] text-slate-700">
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Filters */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-violet-500 bg-clip-text text-transparent mb-4">
            Metaphors
          </h2>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Search Keywords</label>
                <input
                  value={keyword}
                  onChange={(e)=>setKeyword(e.target.value)}
                  placeholder="e.g. fog, mountain, drowning"
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
                <button onClick={clearSearch} className="h-10 px-4 rounded-lg text-sm font-semibold border-2 border-violet-200 text-violet-600 bg-violet-50 hover:bg-violet-100 transition">Clear</button>
              </div>
            </div>

            {/* Subreddits */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Subreddits</label>
              <div className="flex flex-wrap gap-2">
                {subredditOptions.map(opt=>{
                  const isActive = selectedSubreddits.includes(opt.key);
                  return (
                    <button key={opt.key}
                      onClick={()=>{
                        if (opt.key==="all") setSelectedSubreddits(["all"]);
                        else setSelectedSubreddits(prev=> prev.includes(opt.key)? (prev.filter(s=>s!==opt.key) || ["all"]) : [...prev.filter(s=>"all"!==s), opt.key]);
                      }}
                      className={["h-8 px-3 rounded-full text-xs font-semibold transition border-2",
                        isActive? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow"
                                : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Topics</label>
              <div className="flex flex-wrap gap-2">
                {topicOptions.map(opt=>{
                  const isActive = topics.includes(opt.key);
                  return (
                    <button key={opt.key}
                      onClick={()=>{
                        if (opt.key==="all") setTopics(["all"]);
                        else setTopics(prev=> prev.includes(opt.key)? (prev.filter(t=>t!==opt.key) || ["all"]) : [...prev.filter(t=>"all"!==t), opt.key]);
                      }}
                      className={["h-8 px-3 rounded-full text-xs font-semibold transition border-2",
                        isActive? "bg-gradient-to-br from-purple-500 to-indigo-400 text-white border-transparent shadow"
                                : "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emotions + Time */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Emotions</label>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...distinctEmotions] as const).map((emotion, idx)=>{
                    const isActive = selectedEmotions.includes(emotion);
                    return (
                      <button key={`metaphors-${emotion}-${idx}`}
                        onClick={()=>{
                          if (emotion==="all") setSelectedEmotions(["all"]);
                          else setSelectedEmotions(prev=> (prev.includes(emotion)? prev.filter(e=>e!==emotion) : [...prev.filter(e=>e!=="all"),emotion]) || ["all"]);
                        }}
                        className={`h-8 px-3 rounded-full text-xs font-semibold transition border-2 ${isActive? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow":"bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"}`}
                      >
                        {emotion==="all" ? "😐 All" : `${emotionEmoji[emotion as Emotion] ?? "❓"} ${emotion[0].toUpperCase()+emotion.slice(1)}`}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Intensity Score</label>
                    <div className="relative">
                      <input type="range" min={0} max={100} value={intensityPct} onChange={(e)=>setIntensityScore(parseInt(e.target.value,10))} className="w-full accent-violet-500" />
                      <div className="flex justify-between text-xs text-slate-500 mt-1"><span>Weak</span><span>Mild</span><span>High</span></div>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-violet-600">{intensityPct}%</div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-56">
                <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="timeFilter">Filter for Time</label>
                <select id="timeFilter" value={timeFilter} onChange={(e)=>setTimeFilter(e.target.value as any)}
                  className="w-full h-10 rounded-lg border-2 border-violet-200/60 bg-white/80 px-3 text-sm font-medium outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-200">
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

        {/* ---------------- Top Insights (from metrics) ---------------- */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <h2 className="text-xl font-bold text-black mb-4">Top Insights</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<BarChart3 className="w-6 h-6" />}   color="from-[#8b5cf6] to-[#a855f7]" value={stats?.top_insights?.total_metaphors ?? SAMPLE_DATA.length} label="Total Metaphors" />
            <StatCard icon={<TrendingUp className="w-6 h-6" />}   color="from-green-500 to-green-600" value={stats?.top_insights?.filtered_results ?? filtered.length} label="Filtered Results" />
            <StatCard icon={<MessageCircle className="w-6 h-6" />} color="from-blue-500 to-blue-600"  value={(stats?.top_insights?.avg_upvotes ?? (SAMPLE_DATA.reduce((s,i)=>s+i.upvotes,0)/SAMPLE_DATA.length)).toFixed(2)} label="Avg Upvotes" />
            <StatCard icon={<Activity className="w-6 h-6" />}     color="from-orange-500 to-orange-600" value={(stats?.top_insights?.avg_intensity ?? (SAMPLE_DATA.reduce((s,i)=>s+i.intensity,0)/SAMPLE_DATA.length)).toFixed(2)} label="Avg Intensity" />
          </div>
        </section>

        {/* ---------------- Data Section (table) ---------------- */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-black">Data</h3>
            <div className="flex justify-end lg:flex-row gap-x-2">
              <button onClick={toggleChatInputBar} className="h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-md bg-gradient-to-br from-violet-500 to-fuchsia-400 hover:shadow-lg transition flex items-center gap-2">
                <ChatIcon /><span>Ask in chat</span>
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

          <div className="text-sm text-slate-500 mb-3">
            {sorted.length===0? null : sorted.length===1 ? <>Showing <span className="font-semibold text-slate-700">1</span> comment</> :
              <>Showing <span className="font-semibold text-slate-700">{rangeStart}-{rangeEnd}</span> of <span className="font-semibold text-slate-700">{sorted.length}</span> comments</>}
          </div>

          <TableEffectWrapper chatWithAI={isVisibleBar}>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow relative">
              <table className="min-w-[900px] w-full text-sm relative z-10">
                <thead className="bg-gradient-to-br from-violet-50 to-fuchsia-50">
                  <tr className="text-left text-slate-700">
                    <Th>Author</Th>
                    <Th sortable onClick={()=>setSortColumn("timestamp")} active={sort.column==="timestamp"} dir={sort.direction}>Timestamp</Th>
                    <Th>Subreddit</Th>
                    <Th>Metaphor</Th>
                    <Th sortable onClick={()=>setSortColumn("upvotes")} active={sort.column==="upvotes"} dir={sort.direction}>Upvotes</Th>
                    <Th>Emotion</Th>
                    <Th sortable onClick={()=>setSortColumn("intensity")} active={sort.column==="intensity"} dir={sort.direction}>Intensity Score</Th>
                    <Th>Topic</Th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(r=>(
                    <tr key={r.id} className="border-t border-slate-200/60 hover:bg-violet-50/40 cursor-pointer" onClick={()=>setSelected(r)}>
                      <Td>{r.author}</Td>
                      <Td>{r.timestamp}</Td>
                      <Td>{r.subreddit}</Td>
                      <Td className="max-w-[320px] truncate">"{r.metaphorPhrase}"</Td>
                      <Td>{r.upvotes}</Td>
                      <Td>{emotionEmoji[r.emotion] ?? "❓"} {r.emotion}</Td>
                      <Td>{Math.round(r.intensity*100)}%</Td>
                      <Td>{r.topic}</Td>
                    </tr>
                  ))}
                  {paged.length===0 && (
                    <tr><td colSpan={9} className="p-6 text-center text-slate-500">No results. Adjust filters and click <span className="font-semibold text-violet-600">Run Search</span>.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TableEffectWrapper>

          <div className="mt-4 flex items-center justify-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={currentPage<=1} className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:bg-violet-50" aria-label="Previous page">‹</button>
            {pageWindow(currentPage,lastPage).map((n,i)=> typeof n==="string"
              ? <span key={`${n}${i}`} className="px-2 text-slate-500">{n}</span>
              : <button key={n} onClick={()=>setPage(n)} className={["h-8 min-w-8 px-2 rounded-md border text-sm font-medium", n===currentPage? "bg-gradient-to-br from-violet-500 to-fuchsia-400 text-white border-transparent shadow":"border-violet-200 text-slate-700 hover:bg-violet-50"].join(" ")}>{n}</button>
            )}
            <button onClick={()=>setPage(p=>Math.min(lastPage,p+1))} disabled={currentPage>=lastPage} className="h-8 w-8 grid place-items-center rounded-md border border-violet-200 text-slate-700 disabled:opacity-40 hover:bg-violet-50" aria-label="Next page">›</button>
          </div>
        </section>

        {/* ---------------- Visualization (metrics-driven) ---------------- */}
        <section className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-black">Data Visualization</h3>
          </div>

          <div className="w-full h-[400px]">
            <EmotionSunburst
              pageId="metaphors"
              data={chartRows.length ? chartRows : filtered.map(i=>({subreddit:i.subreddit, upvotes:i.upvotes, emotion:i.emotion}))}
            />
            {/* optional debug: {metricsError && <div className="text-xs text-rose-600 mt-2">{metricsError}</div>} */}
          </div>

          {/* Right-side summaries (percentages) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div />
            <div className="grid gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-3">Emotions</h4>
                <div className="space-y-2">
                  {(stats?.emotions ?? []).map((e)=>(
                    <BarLine key={e.name} label={e.name} pct={e.percentage} emoji={emotionEmoji[e.name as Emotion] ?? "•"} />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3">Subreddits</h4>
                <div className="space-y-2">
                  {(stats?.subreddits ?? []).map((s)=>(
                    <BarLine key={s.name} label={s.name} pct={s.percentage} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Overlay for chat dimming effect */}
      {chatState!=="hidden" && <div className="fixed inset-0 bg-black/20 z-30" onClick={handleCloseBar} />}
      {chatState!=="hidden" && <ChatInputBar onSendMessage={handleSendMessage} isVisibleBar={isVisibleBar} />}
      {chatState==="full-chat" && <ChatPanel messages={messages} onMinimize={minimizeChat} isVisiblePanel={isVisiblePanel}/>}

      {/* Details Sidebar */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setSelected(null)} aria-hidden="true" />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-white shadow-2xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-800">Metaphor Details</h4>
              <button onClick={()=>setSelected(null)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-slate-100" aria-label="Close" title="Close">✕</button>
            </div>
            <div className="space-y-4">
              <Field label="Metaphor Phrase"><p className="text-lg font-semibold leading-relaxed">"{selected.metaphorPhrase}"</p></Field>
              <Field label="Full Comment"><p className="text-sm leading-relaxed">{selected.comment}</p></Field>
              <Field label="Author"><p className="text-sm font-medium">{selected.author}</p></Field>
              <Field label="Subreddit"><p className="text-sm font-medium">{selected.subreddit}</p></Field>
              <Field label="Topic"><p className="text-sm font-medium">{selected.topic}</p></Field>
              <Field label="Emotion"><p className="text-sm font-medium">{emotionEmoji[selected.emotion] || "❓"} {selected.emotion.charAt(0).toUpperCase()+selected.emotion.slice(1)}</p></Field>
              <Field label="Intensity Score"><p className="text-sm font-medium">{Math.round(selected.intensity*100)}% {selected.intensity>0.8?"(High)":selected.intensity>0.5?"(Moderate)":"(Low)"}</p></Field>
              <Field label="Upvotes"><div className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-500" /><span className="text-sm font-medium">{selected.upvotes}</span></div></Field>
              <Field label="Timestamp"><p className="text-sm font-medium">{selected.timestamp}</p></Field>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// ---------------- Presentational helpers ----------------
function Th({ children, sortable=false, onClick, active, dir }: { children:React.ReactNode; sortable?:boolean; onClick?:()=>void; active?:boolean; dir?:SortDirection; }) {
  const base="px-3 py-2 text-xs font-semibold select-none";
  if(!sortable) return <th className={`${base}`}>{children}</th>;
  return (
    <th>
      <button type="button" onClick={onClick} className={`${base} flex items-center gap-1 group`} title="Sort">
        <span>{children}</span>
        <svg className={["w-3 h-3 transition", active?"opacity-100":"opacity-50 group-hover:opacity-80", active&&dir==="desc"?"rotate-180":""].join(" ")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
    </th>
  );
}
function Td({ children, className="" }: { children:React.ReactNode; className?:string; }) {
  return <td className={`px-3 py-2 text-sm text-slate-700 ${className}`}>{children}</td>;
}
function Field({ label, children }: { label:string; children:React.ReactNode; }) {
  return (<div><div className="text-xs font-semibold text-slate-500 mb-1">{label}</div><div className="text-slate-800">{children}</div></div>);
}

function StatCard({ icon, color, value, label }: { icon:React.ReactNode; color:string; value:any; label:string; }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

function BarLine({ label, pct, emoji }: { label:string; pct?:number; emoji?:string; }) {
  const val = Math.max(0, Math.min(100, Number.isFinite(pct||0) ? (pct as number) : 0));
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-slate-700 truncate">{label}</div>
      <div className="flex-1 h-3 bg-slate-200/70 rounded-full overflow-hidden">
        <div className="h-3 bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${val}%` }} />
      </div>
      <div className="w-16 text-right text-sm text-slate-700">{val.toFixed(1)}%</div>
      {emoji && <div className="text-lg">{emoji}</div>}
    </div>
  );
}
