// Sample data for Reddit Scraper (now questions)
let currentPage = 1;
const itemsPerPage = 7;
let totalItems = 8198; // This will be updated based on filteredData.length
let filteredData = [];

const questionsData = [
  {
    id: 1,
    author: 'Dr. Smith',
    timestamp: '2 hours ago',
    timestampSort: 2,
    subreddit: 'r/health',
    text: 'Why is my PEMF not working?',
    fullText: 'I have been using my PEMF device for a week now, but I am not feeling any noticeable effects. Is there something I am doing wrong, or is it possible the device is faulty? Any tips on troubleshooting?',
    upvotes: 45,
    post: 'PEMF Device Issues',
    summary: 'Troubleshooting PEMF device',
    emotion: 'frustrated',
    intensity: 0.85,
    topic: 'pemf',
    topicDisplay: 'PEMF Therapy',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/health/question123',
      commentDepth: 0,
      awards: 2,
      replies: 15
    }
  },
  {
    id: 2,
    author: 'Patient_Query',
    timestamp: '4 hours ago',
    timestampSort: 4,
    subreddit: 'r/mentalhealth',
    text: 'How is the massage therapy for anxiety?',
    fullText: 'I am considering massage therapy to help with my anxiety. Has anyone tried it, and what were your experiences? Did it provide significant relief, and how often do you recommend sessions?',
    upvotes: 67,
    post: 'Massage for Anxiety',
    summary: 'Effectiveness of massage for anxiety',
    emotion: 'hopeful',
    intensity: 0.91,
    topic: 'anxiety',
    topicDisplay: 'Anxiety',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/mentalhealth/question456',
      commentDepth: 1,
      awards: 5,
      replies: 23
    }
  },
  {
    id: 3,
    author: 'WellnessSeeker',
    timestamp: '6 hours ago',
    timestampSort: 6,
    subreddit: 'r/selfimprovement',
    text: 'What are the benefits of red light therapy?',
    fullText: 'I keep hearing about red light therapy. What exactly are its benefits, and is there any scientific evidence to support its claims for skin health, muscle recovery, or mood improvement?',
    upvotes: 32,
    post: 'Red Light Therapy',
    summary: 'Benefits of red light therapy',
    emotion: 'hopeful',
    intensity: 0.72,
    topic: 'red_light_therapy',
    topicDisplay: 'Red Light Therapy',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/selfimprovement/question789',
      commentDepth: 0,
      awards: 1,
      replies: 8
    }
  },
  {
    id: 4,
    author: 'HealthConcerned',
    timestamp: '8 hours ago',
    timestampSort: 8,
    subreddit: 'r/wellness',
    text: 'Is cryotherapy safe for everyone?',
    fullText: 'I am interested in trying cryotherapy but have some underlying health conditions. Are there any contraindications or specific health issues that would make cryotherapy unsafe for certain individuals?',
    upvotes: 89,
    post: 'Cryotherapy Safety',
    summary: 'Cryotherapy safety concerns',
    emotion: 'sad',
    intensity: 0.88,
    topic: 'cryotherapy',
    topicDisplay: 'Cryotherapy',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/wellness/question101',
      commentDepth: 2,
      awards: 3,
      replies: 31
    }
  },
  {
    id: 5,
    author: 'FitnessFanatic',
    timestamp: '1 day ago',
    timestampSort: 24,
    subreddit: 'r/health',
    text: 'How often should I use an infrared sauna?',
    fullText: 'I recently bought an infrared sauna and am unsure about the optimal frequency of use. How many times a week is recommended for general wellness and detoxification benefits?',
    upvotes: 54,
    post: 'Infrared Sauna Usage',
    summary: 'Infrared sauna frequency',
    emotion: 'hopeful',
    intensity: 0.79,
    topic: 'infrared_sauna',
    topicDisplay: 'Infrared Sauna',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/health/question202',
      commentDepth: 0,
      awards: 1,
      replies: 12
    }
  },
  {
    id: 6,
    author: 'NutritionNerd',
    timestamp: '1 day ago',
    timestampSort: 24,
    subreddit: 'r/wellness',
    text: 'What is the best diet for gut health?',
    fullText: 'I am looking to improve my gut health through diet. What are the best foods to incorporate, and are there any specific dietary approaches (e.g., Mediterranean, plant-based) that are particularly beneficial?',
    upvotes: 76,
    post: 'Gut Health Diet',
    summary: 'Diet for gut health',
    emotion: 'hopeful',
    intensity: 0.93,
    topic: 'gut_health',
    topicDisplay: 'Gut Health',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/wellness/question303',
      commentDepth: 1,
      awards: 4,
      replies: 19
    }
  },
  {
    id: 7,
    author: 'MindfulLiving',
    timestamp: '2 days ago',
    timestampSort: 48,
    subreddit: 'r/selfimprovement',
    text: 'Can meditation really reduce stress?',
    fullText: 'I am skeptical about meditation, but I am desperate to reduce my stress levels. Can meditation truly make a difference, and what are some beginner-friendly techniques to get started?',
    upvotes: 41,
    post: 'Meditation for Stress',
    summary: 'Meditation for stress reduction',
    emotion: 'hopeful',
    intensity: 0.68,
    topic: 'meditation',
    topicDisplay: 'Meditation',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/selfimprovement/question404',
      commentDepth: 0,
      awards: 2,
      replies: 14
    }
  },
  {
    id: 8,
    author: 'CuriousMind',
    timestamp: '3 days ago',
    timestampSort: 72,
    subreddit: 'r/health',
    text: 'What are the signs of nutrient deficiency?',
    fullText: 'I have been feeling unusually tired and weak lately. What are some common signs and symptoms of nutrient deficiencies, and how can I get tested or address them through diet?',
    upvotes: 63,
    post: 'Nutrient Deficiency',
    summary: 'Signs of nutrient deficiency',
    emotion: 'sad',
    intensity: 0.75,
    topic: 'nutrition',
    topicDisplay: 'Nutrition',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/health/question505',
      commentDepth: 1,
      awards: 3,
      replies: 21
    }
  }
];

// Hardcoded FAQs
const hardcodedFaqs = [
  { question: "Why is my PEMF not working?", bookmarked: false },
  { question: "How is the massage?", bookmarked: false },
  { question: "What are the benefits of red light therapy?", bookmarked: false },
  { question: "Is cryotherapy safe for everyone?", bookmarked: false },
  { question: "How often should I use an infrared sauna?", bookmarked: false },
  { question: "What is the best diet for gut health?", bookmarked: false },
  { question: "Can meditation really reduce stress?", bookmarked: false },
  { question: "What are the signs of nutrient deficiency?", bookmarked: false },
  { question: "How to improve sleep quality naturally?", bookmarked: false },
  { question: "Are essential oils effective for anxiety?", bookmarked: false }
];

// DOM elements
const mainSidebar = document.getElementById("mainSidebar");
const insightsSidebar = document.getElementById("insightsSidebar");
const toggleInsightsSidebarBtn = document.getElementById("toggleInsightsSidebar");
const settingsBtn = document.getElementById("settingsBtn");
const settingsDropdown = document.getElementById("settingsDropdown");
const keywordSearchInput = document.getElementById("keywordSearch");
const runSearchBtn = document.getElementById("runSearchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const subredditButtons = document.getElementById("subredditButtons");
const topicButtons = document.getElementById("topicButtons");
const emotionButtons = document.getElementById("emotionButtons");
const intensitySlider = document.getElementById("intensitySlider");
const timeFilter = document.getElementById("timeFilter");
const dataTable = document.getElementById("dataTable");
const tableBody = document.getElementById("tableBody");
const exportDataBtn = document.getElementById("exportDataBtn");
const exportTopicClusterBtn = document.getElementById("exportTopicClusterBtn");
const commentSidebar = document.getElementById("commentSidebar");
const closeCommentSidebar = document.getElementById("closeCommentSidebar");
const commentSidebarContent = document.getElementById("commentSidebarContent");
const topicClusterGrid = document.getElementById("topicClusterGrid");
const themesGrid = document.getElementById("themesGrid");
const sentimentItems = document.getElementById("sentimentItems");
const generateFaqBtn = document.getElementById("generateFaqBtn");
const bookmarkFaqBtn = document.getElementById("bookmarkFaqBtn");
const faqTableBody = document.getElementById("faqTableBody");

// State management
let currentData = [...questionsData]; // Changed to questionsData
let currentFilters = {
  keyword: "",
  subreddit: "all",
  topic: "all",
  emotion: "all",
  intensity: 50,
  timeFilter: "all",
};
let sortState = {
  column: null,
  direction: "asc"
};
let showingBookmarkedFaqs = false;

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  populateFilterButtons(); // New function to populate buttons dynamically
  applyFilters(); // Call applyFilters to render initial table and insights
  updateActiveStates();
  handleIntensityFilter(); // Call once to set initial position
  // FAQ table will be populated on button click
}

function populateFilterButtons() {
  // Populate Subreddit buttons
  const uniqueSubreddits = ['all', ...new Set(questionsData.map(item => item.subreddit))];
  subredditButtons.innerHTML = '';
  uniqueSubreddits.forEach(subreddit => {
    const button = document.createElement('button');
    button.classList.add('filter-btn');
    button.setAttribute('data-subreddit', subreddit);
    button.textContent = subreddit === 'all' ? 'All Subreddits' : subreddit;
    subredditButtons.appendChild(button);
  });

  // Populate Topic buttons
  const uniqueTopics = ['all', ...new Set(questionsData.map(item => item.topicDisplay))];
  topicButtons.innerHTML = '';
  uniqueTopics.forEach(topic => {
    const button = document.createElement('button');
    button.classList.add('filter-btn');
    button.setAttribute('data-topic', topic);
    button.textContent = topic === 'all' ? 'All Topics' : topic;
    topicButtons.appendChild(button);
  });
}

function setupEventListeners() {
  // Main sidebar hover
  mainSidebar.addEventListener("mouseenter", () => {
    mainSidebar.style.width = "260px";
  });

  mainSidebar.addEventListener("mouseleave", () => {
    mainSidebar.style.width = "60px";
  });

  // Insights sidebar toggle
  toggleInsightsSidebarBtn.addEventListener("click", toggleInsightsSidebar);

  // Settings dropdown
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle("active");
  });

  // Search functionality
  runSearchBtn.addEventListener("click", handleSearch);
  clearSearchBtn.addEventListener("click", clearSearch);
  keywordSearchInput.addEventListener("input", debounce(handleSearch, 300));

  // Filter buttons
  subredditButtons.addEventListener("click", handleSubredditFilter);
  topicButtons.addEventListener("click", handleTopicFilter);
  emotionButtons.addEventListener("click", handleEmotionFilter);

  // Intensity slider
  intensitySlider.addEventListener("input", handleIntensityFilter);

  // Time filter
  timeFilter.addEventListener("change", handleTimeFilter);

  // Table sorting
  const sortableHeaders = document.querySelectorAll(".sortable");
  sortableHeaders.forEach((header) => {
    header.addEventListener("click", () => handleSort(header.dataset.sort));
  });

  // Export buttons
  exportDataBtn.addEventListener("click", handleExportData);
  exportTopicClusterBtn.addEventListener("click", handleExportTopicCluster);

  // Comment sidebar
  closeCommentSidebar.addEventListener("click", closeCommentSidebarFunc);

  // Generate FAQ and Bookmark FAQ
  generateFaqBtn.addEventListener("click", () => {
    showNotification("Generating FAQs...", "info");
    setTimeout(() => {
      showingBookmarkedFaqs = false;
      generateFaqs();
      showNotification("FAQs generated successfully!", "success");
    }, 500); // Simulate a delay for generation
  });
  bookmarkFaqBtn.addEventListener("click", () => {
    showingBookmarkedFaqs = !showingBookmarkedFaqs;
    generateFaqs();
    showNotification(
      showingBookmarkedFaqs ? "Showing bookmarked FAQs" : "Showing all FAQs",
      "info"
    );
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !settingsBtn.contains(e.target) &&
      !settingsDropdown.contains(e.target)
    ) {
      settingsDropdown.classList.remove("active");
    }
  });

  // Sidebar navigation
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      // Remove active class from all sidebar items in the same sidebar
      const sidebar = item.closest(".sidebar");
      sidebar.querySelectorAll(".sidebar-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      // Handle navigation (if needed, otherwise remove or update)
      const section = item.getAttribute("data-section");
      if (section === "Reddit Scraper") {
        // Current page, no navigation needed
      } else if (section === "Ask me Anything") {
        // window.location.href = 'promptingPage.html'; // Example navigation
      } else if (section === "Pain Points") {
        // window.location.href = 'painpoints.html'; // Example navigation
      } else if (section === "Desires/Wishes") {
        // window.location.href = 'desires_wishes.html'; // Example navigation
      } else if (section === "FAQs") {
        // Scroll to FAQ section or handle dynamically
        document.querySelector(".faq-section").scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

function toggleInsightsSidebar() {
  insightsSidebar.classList.toggle("collapsed");
  const mainContent = document.querySelector(".main-content");

  if (insightsSidebar.classList.contains("collapsed")) {
    mainContent.style.marginLeft = "120px";
  } else {
    mainContent.style.marginLeft = "320px";
  }

  const arrow = toggleInsightsSidebarBtn.querySelector("svg polyline");
  if (insightsSidebar.classList.contains("collapsed")) {
    arrow.setAttribute("points", "9,18 15,12 9,6");
  } else {
    arrow.setAttribute("points", "15,18 9,12 15,6");
  }
}

function handleSearch() {
  currentFilters.keyword = keywordSearchInput.value.toLowerCase().trim();
  applyFilters();
}

function clearSearch() {
  keywordSearchInput.value = "";
  currentFilters.keyword = "";
  applyFilters();
}

function handleSubredditFilter(e) {
  if (e.target.classList.contains("filter-btn")) {
    const subreddit = e.target.getAttribute("data-subreddit");
    currentFilters.subreddit = subreddit;

    subredditButtons.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");

    applyFilters();
  }
}

function handleTopicFilter(e) {
  if (e.target.classList.contains("filter-btn")) {
    const topic = e.target.getAttribute("data-topic");
    currentFilters.topic = topic;

    topicButtons.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");

    applyFilters();
  }
}

function handleEmotionFilter(e) {
  if (e.target.classList.contains("emotion-btn")) {
    const emotion = e.target.getAttribute("data-emotion");
    currentFilters.emotion = emotion;

    emotionButtons.querySelectorAll(".emotion-btn").forEach((btn) => btn.classList.remove("active"));
    e.target.classList.add("active");

    applyFilters();
  }
}

function handleIntensityFilter() {
  currentFilters.intensity = parseInt(intensitySlider.value);

  // Update the slider value display
  const sliderValue = document.getElementById("sliderValue");
  if (sliderValue) {
    sliderValue.textContent = currentFilters.intensity + "%";
    const thumbWidth = 20; // Approximate width of the slider thumb
    const sliderWidth = intensitySlider.offsetWidth;
    const trackWidth = sliderWidth - thumbWidth;
    const value = currentFilters.intensity;
    const percentage = (value - intensitySlider.min) / (intensitySlider.max - intensitySlider.min);
    const thumbPosition = percentage * trackWidth + (thumbWidth / 2);
    sliderValue.style.left = `calc(${thumbPosition}px - ${sliderValue.offsetWidth / 2}px)`;
  }
  applyFilters();
}

function handleTimeFilter() {
  currentFilters.timeFilter = timeFilter.value;
  applyFilters();
}

function applyFilters() {
  filteredData = questionsData.filter((item) => {
    const matchesKeyword = currentFilters.keyword === "" || item.text.toLowerCase().includes(currentFilters.keyword);

    const matchesSubreddit = currentFilters.subreddit === "all" || item.subreddit === currentFilters.subreddit;
    const matchesTopic = currentFilters.topic === "all" || item.topicDisplay === currentFilters.topic;
    const matchesEmotion = currentFilters.emotion === "all" || item.emotion === currentFilters.emotion;
    const matchesIntensity = item.intensity * 100 >= currentFilters.intensity;

    let matchesTime = true;
    if (currentFilters.timeFilter !== "all") {
      const now = new Date();
      const itemTimeInMs = now.getTime() - item.timestampSort * 60 * 60 * 1000;

      if (currentFilters.timeFilter === "past_day") {
        matchesTime = (now.getTime() - itemTimeInMs) < (24 * 60 * 60 * 1000);
      } else if (currentFilters.timeFilter === "past_week") {
        matchesTime = (now.getTime() - itemTimeInMs) < (7 * 24 * 60 * 60 * 1000);
      } else if (currentFilters.timeFilter === "past_month") {
        matchesTime = (now.getTime() - itemTimeInMs) < (30 * 24 * 60 * 60 * 1000);
      } else if (currentFilters.timeFilter === "past_year") {
        matchesTime = (now.getTime() - itemTimeInMs) < (365 * 24 * 60 * 60 * 1000);
      }
    }

    return matchesKeyword && matchesSubreddit && matchesTopic && matchesEmotion && matchesIntensity && matchesTime;
  });

  totalItems = filteredData.length;
  currentPage = 1; // Reset to first page on filter change
  renderTable();
  updatePaginationControls();
  updateTopicCluster();
}

function renderTable() {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedData = filteredData.slice(start, end);

  paginatedData.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.author}</td>
      <td>${item.timestamp}</td>
      <td>${item.subreddit}</td>
      <td>${item.text}</td>
      <td>${item.upvotes}</td>
      <td>${item.post}</td>
      <td>${item.topicDisplay}</td>
      <td>${(item.intensity * 100).toFixed(0)}%</td>
      <td>${item.summary}</td>
    `;
    row.addEventListener("click", () => openCommentSidebar(item));
    tableBody.appendChild(row);
  });

  updatePaginationInfo();
}

function updatePaginationInfo() {
  const currentRangeSpan = document.getElementById("currentRange");
  const totalCommentsSpan = document.getElementById("totalComments");

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(start + itemsPerPage - 1, totalItems);

  currentRangeSpan.textContent = `${start}-${end}`;
  totalCommentsSpan.textContent = totalItems;
}

function updatePaginationControls() {
  const paginationNumbers = document.getElementById("paginationNumbers");
  paginationNumbers.innerHTML = "";
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const maxPageButtons = 5; // Max number of page buttons to display
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  if (startPage > 1) {
    const btn = document.createElement("button");
    btn.classList.add("pagination-btn");
    btn.textContent = "1";
    btn.addEventListener("click", () => goToPage(1));
    paginationNumbers.appendChild(btn);
    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.classList.add("pagination-dots");
      dots.textContent = "...";
      paginationNumbers.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.classList.add("pagination-btn");
    if (i === currentPage) {
      btn.classList.add("active");
    }
    btn.textContent = i;
    btn.addEventListener("click", () => goToPage(i));
    paginationNumbers.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.classList.add("pagination-dots");
      dots.textContent = "...";
      paginationNumbers.appendChild(dots);
    }
    const btn = document.createElement("button");
    btn.classList.add("pagination-btn");
    btn.textContent = totalPages;
    btn.addEventListener("click", () => goToPage(totalPages));
    paginationNumbers.appendChild(btn);
  }

  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

function goToPage(page) {
  currentPage = page;
  renderTable();
  updatePaginationControls();
}

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    goToPage(currentPage - 1);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (currentPage < totalPages) {
    goToPage(currentPage + 1);
  }
});

function handleSort(column) {
  if (sortState.column === column) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    sortState.column = column;
    sortState.direction = "asc";
  }

  filteredData.sort((a, b) => {
    let valA, valB;
    if (column === "timestamp") {
      valA = a.timestampSort;
      valB = b.timestampSort;
    } else if (column === "upvotes") {
      valA = a.upvotes;
      valB = b.upvotes;
    } else if (column === "intensity") {
      valA = a.intensity;
      valB = b.intensity;
    } else {
      valA = a[column].toLowerCase();
      valB = b[column].toLowerCase();
    }

    if (valA < valB) {
      return sortState.direction === "asc" ? -1 : 1;
    }
    if (valA > valB) {
      return sortState.direction === "asc" ? 1 : -1;
    }
    return 0;
  });
  renderTable();
}

function updateActiveStates() {
  // Set initial active state for filter buttons
  // Ensure buttons exist before trying to add 'active' class
  const currentSubredditBtn = subredditButtons.querySelector(`[data-subreddit="${currentFilters.subreddit}"]`);
  if (currentSubredditBtn) currentSubredditBtn.classList.add('active');

  const currentTopicBtn = topicButtons.querySelector(`[data-topic="${currentFilters.topic}"]`);
  if (currentTopicBtn) currentTopicBtn.classList.add('active');

  const currentEmotionBtn = emotionButtons.querySelector(`[data-emotion="${currentFilters.emotion}"]`);
  if (currentEmotionBtn) currentEmotionBtn.classList.add('active');

  timeFilter.value = currentFilters.timeFilter;
}

function updateTopicCluster() {
  // Clear previous topic cluster and sentiment analysis
  topicClusterGrid.innerHTML = "";
  sentimentItems.innerHTML = "";

  // Calculate topic counts and percentages
  const topicCounts = {};
  questionsData.forEach((item) => {
    topicCounts[item.topicDisplay] = (topicCounts[item.topicDisplay] || 0) + 1;
  });

  const totalQuestionsCount = questionsData.length;
  const sortedTopics = Object.entries(topicCounts).sort(([, countA], [, countB]) => countB - countA);

  sortedTopics.forEach(([topic, count]) => {
    const percentage = ((count / totalQuestionsCount) * 100).toFixed(0);
    const topicItem = document.createElement("div");
    topicItem.classList.add("topic-cluster-item");
    const colorClass = getColorClassForTopic(topic);
    topicItem.innerHTML = `
      <span class="topic-cluster-badge ${colorClass}">${topic}</span>
      <span class="topic-cluster-text">${percentage}% felt this....</span>
    `;
    topicClusterGrid.appendChild(topicItem);
  });

  // Populate sentiment analysis (example, can be dynamic based on data)
  const sentimentAnalysis = [
    { emoji: "😊", label: "Hopeful", percentage: "30%" },
    { emoji: "😢", label: "Sad", percentage: "25%" },
    { emoji: "😤", label: "Frustrated", percentage: "20%" },
    { emoji: "😄", label: "Happy", percentage: "15%" },
    { emoji: "😐", label: "Neutral", percentage: "10%" },
  ];

  sentimentAnalysis.forEach((sentiment) => {
    const sentimentItem = document.createElement("div");
    sentimentItem.classList.add("sentiment-item");
    sentimentItem.innerHTML = `
      <span class="sentiment-emoji">${sentiment.emoji}</span>
      <span class="sentiment-label">${sentiment.label}</span>
      <span class="sentiment-percentage">${sentiment.percentage}</span>
    `;
    sentimentItems.appendChild(sentimentItem);
  });
}

function getColorClassForTopic(topic) {
  switch (topic.toLowerCase()) {
    case "pemf therapy":
      return "blue";
    case "anxiety":
      return "red";
    case "red light therapy":
      return "green";
    case "cryotherapy":
      return "purple";
    case "infrared sauna":
      return "orange";
    case "gut health":
      return "yellow";
    case "meditation":
      return "blue";
    case "nutrition":
      return "green";
    case "health":
      return "red";
    case "games":
      return "green";
    case "common themes":
      return "yellow";
    default:
      return "purple";
  }
}

function handleExportData() {
  alert("Exporting data...");
}

function handleExportTopicCluster() {
  alert("Exporting topic cluster data...");
}

function openCommentSidebar(question) {
  commentSidebarContent.innerHTML = `
    <div class="comment-detail">
      <div class="comment-field">
        <span class="comment-field-label">Author</span>
        <span class="comment-field-value">${question.author}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Timestamp</span>
        <span class="comment-field-value">${question.timestamp}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Subreddit</span>
        <span class="comment-field-value">${question.subreddit}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Question</span>
        <span class="comment-field-value text">${question.fullText}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Upvotes</span>
        <span class="comment-field-value">${question.upvotes}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Post</span>
        <span class="comment-field-value">${question.post}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Topic</span>
        <span class="comment-field-value">${question.topicDisplay}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Sentiment Intensity</span>
        <span class="comment-field-value">${(question.intensity * 100).toFixed(0)}%</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Summary</span>
        <span class="comment-field-value">${question.summary}</span>
      </div>
      <div class="comment-field">
        <span class="comment-field-label">Additional Info</span>
        <span class="comment-field-value">
          Post URL: <a href="${question.additionalInfo.postUrl}" target="_blank">${question.additionalInfo.postUrl}</a><br>
          Comment Depth: ${question.additionalInfo.commentDepth}<br>
          Awards: ${question.additionalInfo.awards}<br>
          Replies: ${question.additionalInfo.replies}
        </span>
      </div>
    </div>
  `;
  commentSidebar.classList.add("active");
}

function closeCommentSidebarFunc() {
  commentSidebar.classList.remove("active");
}

// Utility function for debouncing
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Notification function
function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.classList.add("notification", type);
  notification.textContent = message;
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// FAQ Generation Function
function generateFaqs() {
  faqTableBody.innerHTML = ""; // Clear existing FAQs
  const faqsToRender = showingBookmarkedFaqs ? hardcodedFaqs.filter((faq) => faq.bookmarked) : hardcodedFaqs;

  faqsToRender.forEach((faq) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${faq.question}</td>
      <td>
        <button class="bookmark-btn ${faq.bookmarked ? "bookmarked" : ""}" data-question="${faq.question}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </td>
    `;
    faqTableBody.appendChild(row);
  });

  // Add event listeners for bookmark buttons
  faqTableBody.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const question = e.currentTarget.dataset.question;
      const faqItem = hardcodedFaqs.find((item) => item.question === question);
      if (faqItem) {
        faqItem.bookmarked = !faqItem.bookmarked;
        e.currentTarget.classList.toggle("bookmarked", faqItem.bookmarked);
        // If currently showing bookmarked, re-render to reflect change
        if (showingBookmarkedFaqs) {
          generateFaqs();
        }
      }
    });
  });
}

// Initial call to render table and insights on page load
// applyFilters(); // This is now called in initializeApp
// updatePaginationControls(); // This is now called in applyFilters