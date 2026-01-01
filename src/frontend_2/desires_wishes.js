// Enhanced sample data for Desires/Wishes
// Pagination variables
let currentPage = 1;
const itemsPerPage = 7;
let totalItems = 8198;
let filteredData = [];

const desiresWishesData = [
  {
    id: 1,
    author: 'Balaji Nant',
    timestamp: '2 hours ago',
    timestampSort: 2,
    subreddit: 'r/health',
    text: 'I desperately wish for better sleep. Chronic insomnia is draining my energy and affecting my mood every single day.',
    fullText: 'I desperately wish for better sleep. Chronic insomnia is draining my energy and affecting my mood every single day. I\'ve tried everything - melatonin, sleep hygiene, meditation apps, but nothing seems to work consistently. The exhaustion is affecting my work performance and relationships. I just want to wake up feeling refreshed for once.',
    upvotes: 45,
    post: 'Sleep Issues',
    summary: 'Desires better sleep quality',
    emotion: 'sad',
    intensity: 0.85,
    category: 'physical_wellbeing',
    categoryDisplay: 'Physical Wellbeing',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/health/post123',
      commentDepth: 0,
      awards: 2,
      replies: 15
    }
  },
  {
    id: 2,
    author: 'Nithya Menon',
    timestamp: '4 hours ago',
    timestampSort: 4,
    subreddit: 'r/mentalhealth',
    text: 'My biggest desire is to overcome my anxiety. It prevents me from living a full life and pursuing my dreams.',
    fullText: 'My biggest desire is to overcome my anxiety. It prevents me from living a full life and pursuing my dreams. Social situations feel overwhelming, and I constantly worry about what others think. I want to be able to speak up in meetings, go to social events without panic, and just feel comfortable in my own skin. Therapy helps but progress feels so slow.',
    upvotes: 67,
    post: 'Anxiety Management',
    summary: 'Wants to overcome anxiety',
    emotion: 'frustrated',
    intensity: 0.91,
    category: 'emotional_stability',
    categoryDisplay: 'Emotional Stability',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/mentalhealth/post456',
      commentDepth: 1,
      awards: 5,
      replies: 23
    }
  },
  {
    id: 3,
    author: 'Meera Gonzalez',
    timestamp: '6 hours ago',
    timestampSort: 6,
    subreddit: 'r/selfimprovement',
    text: 'I wish I had more discipline to stick to my goals. I want to see consistent personal growth.',
    fullText: 'I wish I had more discipline to stick to my goals. I want to see consistent personal growth and stop the cycle of starting projects and abandoning them. Whether it\'s fitness, learning new skills, or building better habits, I always start strong but lose motivation after a few weeks. I desire the mental strength to push through when things get difficult.',
    upvotes: 32,
    post: 'Goal Setting',
    summary: 'Desires more discipline',
    emotion: 'hopeful',
    intensity: 0.72,
    category: 'personal_growth',
    categoryDisplay: 'Personal Growth',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/selfimprovement/post789',
      commentDepth: 0,
      awards: 1,
      replies: 8
    }
  },
  {
    id: 4,
    author: 'Karthik Subramanian',
    timestamp: '8 hours ago',
    timestampSort: 8,
    subreddit: 'r/mentalhealth',
    text: 'I desire deeper connections with people. Feeling isolated is tough, and I wish for more meaningful friendships.',
    fullText: 'I desire deeper connections with people. Feeling isolated is tough, and I wish for more meaningful friendships that go beyond surface-level conversations. I want relationships where I can be vulnerable, share my struggles, and feel truly understood. The loneliness is overwhelming sometimes, especially working from home. I wish I knew how to build genuine connections.',
    upvotes: 89,
    post: 'Social Connection',
    summary: 'Wants deeper relationships',
    emotion: 'sad',
    intensity: 0.88,
    category: 'social_connection',
    categoryDisplay: 'Social Connection',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/mentalhealth/post101',
      commentDepth: 2,
      awards: 3,
      replies: 31
    }
  },
  {
    id: 5,
    author: 'Sarah Johnson',
    timestamp: '1 day ago',
    timestampSort: 24,
    subreddit: 'r/health',
    text: 'I wish I had more energy throughout the day. I feel constantly tired, and it impacts my productivity.',
    fullText: 'I wish I had more energy throughout the day. I feel constantly tired, and it impacts my productivity and enjoyment of life. Even after 8 hours of sleep, I wake up exhausted. I\'ve had blood tests done but everything comes back normal. I just want to feel vibrant and energetic like I used to in my twenties.',
    upvotes: 54,
    post: 'Energy Levels',
    summary: 'Desires more energy',
    emotion: 'frustrated',
    intensity: 0.79,
    category: 'physical_wellbeing',
    categoryDisplay: 'Physical Wellbeing',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/health/post202',
      commentDepth: 0,
      awards: 1,
      replies: 12
    }
  },
  {
    id: 6,
    author: 'Alex Chen',
    timestamp: '1 day ago',
    timestampSort: 24,
    subreddit: 'r/wellness',
    text: 'My desire is to find inner peace and reduce stress. The constant pressure is overwhelming.',
    fullText: 'My desire is to find inner peace and reduce stress. The constant pressure from work, family expectations, and societal demands is overwhelming. I want to learn how to stay calm in chaotic situations and not let external circumstances dictate my emotional state. Meditation helps but I struggle to maintain consistency.',
    upvotes: 76,
    post: 'Stress Management',
    summary: 'Seeks inner peace',
    emotion: 'sad',
    intensity: 0.93,
    category: 'emotional_stability',
    categoryDisplay: 'Emotional Stability',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/wellness/post303',
      commentDepth: 1,
      awards: 4,
      replies: 19
    }
  },
  {
    id: 7,
    author: 'Maria Rodriguez',
    timestamp: '2 days ago',
    timestampSort: 48,
    subreddit: 'r/selfimprovement',
    text: 'I wish I could build more confidence in myself and stop second-guessing every decision I make.',
    fullText: 'I wish I could build more confidence in myself and stop second-guessing every decision I make. I constantly seek validation from others and doubt my own judgment. This lack of self-confidence is holding me back in my career and personal relationships. I want to trust myself and feel worthy of success and happiness.',
    upvotes: 41,
    post: 'Building Confidence',
    summary: 'Wants more self-confidence',
    emotion: 'hopeful',
    intensity: 0.68,
    category: 'personal_growth',
    categoryDisplay: 'Personal Growth',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/selfimprovement/post404',
      commentDepth: 0,
      awards: 2,
      replies: 14
    }
  },
  {
    id: 8,
    author: 'David Kim',
    timestamp: '3 days ago',
    timestampSort: 72,
    subreddit: 'r/wellness',
    text: 'I desire to break free from negative thought patterns and cultivate a more positive mindset.',
    fullText: 'I desire to break free from negative thought patterns and cultivate a more positive mindset. I find myself constantly focusing on what could go wrong rather than what could go right. This pessimistic outlook is affecting my mental health and relationships. I want to rewire my brain to see opportunities instead of obstacles.',
    upvotes: 63,
    post: 'Positive Thinking',
    summary: 'Wants positive mindset',
    emotion: 'hopeful',
    intensity: 0.75,
    category: 'emotional_stability',
    categoryDisplay: 'Emotional Stability',
    additionalInfo: {
      postUrl: 'https://reddit.com/r/wellness/post505',
      commentDepth: 1,
      awards: 3,
      replies: 21
    }
  }
];

// Hardcoded quotes for generation
const hardcodedQuotes = [
  "I just want to wake up feeling refreshed and not dreading the day. Better sleep would change everything.",
  "My biggest wish is to find a way to manage my anxiety so I can focus on my goals without constant worry.",
  "It would be amazing to have a supportive community where I feel understood and connected to others.",
  "I truly desire to have more energy to pursue my passions and live life to the fullest.",
  "My wish is for inner peace and a calmer mind, free from the constant pressure of daily life.",
  "I aspire to continuously learn and grow, to feel more competent and capable in everything I do.",
  "I want to build unshakeable confidence and trust in my own decisions and abilities.",
  "My desire is to break free from negative thinking and see the world with optimism and hope."
];

// DOM elements
const mainSidebar = document.getElementById('mainSidebar');
const insightsSidebar = document.getElementById('insightsSidebar');
const toggleInsightsSidebarBtn = document.getElementById('toggleInsightsSidebar');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const keywordSearchInput = document.getElementById('keywordSearch');
const runSearchBtn = document.getElementById('runSearchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const subredditButtons = document.getElementById('subredditButtons');
const desiresButtons = document.getElementById('desiresButtons');
const emotionButtons = document.getElementById('emotionButtons');
const intensitySlider = document.getElementById('intensitySlider');
const timeFilter = document.getElementById('timeFilter');
const dataTable = document.getElementById('dataTable');
const tableBody = document.getElementById('tableBody');
const exportDataBtn = document.getElementById('exportDataBtn');
const exportInsightsBtn = document.getElementById('exportInsightsBtn');
const numQuotesInput = document.getElementById('numQuotes');
const generateBtn = document.getElementById('generateBtn');
const exportQuotesBtn = document.getElementById('exportQuotesBtn');
const quotesResults = document.getElementById('quotesResults');
const commentSidebar = document.getElementById('commentSidebar');
const closeCommentSidebar = document.getElementById('closeCommentSidebar');
const commentSidebarContent = document.getElementById('commentSidebarContent');
const insightsGrid = document.getElementById('insightsGrid');
const themesGrid = document.getElementById('themesGrid');
const sentimentItems = document.getElementById('sentimentItems');

// State management
let currentData = [...desiresWishesData];
let currentFilters = {
  keyword: '',
  subreddit: 'all',
  desire: 'all',
  emotion: 'all',
  intensity: 50,
  timeFilter: 'all'
};
let sortState = {
  column: null,
  direction: 'asc'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  renderTable();
  updateActiveStates();
  updateTopInsights();
  handleIntensityFilter(); // Call once to set initial position
}

function setupEventListeners() {
  // Main sidebar hover
  mainSidebar.addEventListener('mouseenter', () => {
    mainSidebar.style.width = '260px';
  });
  
  mainSidebar.addEventListener('mouseleave', () => {
    mainSidebar.style.width = '60px';
  });

  // Insights sidebar toggle
  toggleInsightsSidebarBtn.addEventListener('click', toggleInsightsSidebar);

  // Settings dropdown
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('active');
  });

  // Search functionality
  runSearchBtn.addEventListener('click', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);
  keywordSearchInput.addEventListener('input', debounce(handleSearch, 300));

  // Filter buttons
  subredditButtons.addEventListener('click', handleSubredditFilter);
  desiresButtons.addEventListener('click', handleDesiresFilter);
  emotionButtons.addEventListener('click', handleEmotionFilter);
  
  // Intensity slider
  intensitySlider.addEventListener('input', handleIntensityFilter);
  
  // Time filter
  timeFilter.addEventListener('change', handleTimeFilter);

  // Table sorting
  const sortableHeaders = document.querySelectorAll('.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', () => handleSort(header.dataset.sort));
  });

  // Export buttons
  exportDataBtn.addEventListener('click', handleExportData);
  exportInsightsBtn.addEventListener('click', handleExportInsights);
  
  // Generate quotes
  generateBtn.addEventListener('click', handleGenerateQuotes);
  exportQuotesBtn.addEventListener('click', handleExportQuotes);

  // Comment sidebar
  closeCommentSidebar.addEventListener('click', closeCommentSidebarFunc);

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
      settingsDropdown.classList.remove('active');
    }
  });

  // Sidebar navigation
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all sidebar items in the same sidebar
      const sidebar = item.closest('.sidebar');
      sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Handle navigation
      const section = item.getAttribute('data-section');
      if (section === 'Reddit Scraper') {
        window.location.href = 'index.html';
      } else if (section === 'Ask me Anything') {
        window.location.href = 'promptingPage.html';
      } else if (section === 'Pain Points') {
        window.location.href = 'painpoints.html';
      } else if (section === 'Desires/Wishes') {
        window.location.href = 'desires_wishes.html';
      }
    });
  });
}

function toggleInsightsSidebar() {
  insightsSidebar.classList.toggle('collapsed');
  const mainContent = document.querySelector('.main-content');
  
  if (insightsSidebar.classList.contains('collapsed')) {
    mainContent.style.marginLeft = '120px';
  } else {
    mainContent.style.marginLeft = '320px';
  }
  
  const arrow = toggleInsightsSidebarBtn.querySelector('svg polyline');
  if (insightsSidebar.classList.contains('collapsed')) {
    arrow.setAttribute('points', '9,18 15,12 9,6');
  } else {
    arrow.setAttribute('points', '15,18 9,12 15,6');
  }
}

function handleSearch() {
  currentFilters.keyword = keywordSearchInput.value.toLowerCase().trim();
  applyFilters();
}

function clearSearch() {
  keywordSearchInput.value = '';
  currentFilters.keyword = '';
  applyFilters();
}

function handleSubredditFilter(e) {
  if (e.target.classList.contains('filter-btn')) {
    const subreddit = e.target.getAttribute('data-subreddit');
    currentFilters.subreddit = subreddit;
    
    subredditButtons.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    applyFilters();
  }
}

function handleDesiresFilter(e) {
  if (e.target.classList.contains('filter-btn')) {
    const desire = e.target.getAttribute('data-desire');
    currentFilters.desire = desire;
    
    desiresButtons.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    applyFilters();
  }
}

function handleEmotionFilter(e) {
  if (e.target.classList.contains('emotion-btn')) {
    const emotion = e.target.getAttribute('data-emotion');
    currentFilters.emotion = emotion;
    
    emotionButtons.querySelectorAll('.emotion-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
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
    const thumbPosition = percentage * trackWidth + thumbWidth / 2;
    sliderValue.style.left = `${thumbPosition}px`;
  }
  
  applyFilters();
}

function handleTimeFilter() {
  currentFilters.timeFilter = timeFilter.value;
  applyFilters();
}

function handleSort(column) {
  if (sortState.column === column) {
    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortState.column = column;
    sortState.direction = 'asc';
  }
  
  // Update sort icons
  document.querySelectorAll('.sort-icon').forEach(icon => {
    icon.style.transform = 'rotate(0deg)';
    icon.style.opacity = '0.5';
  });
  
  const activeHeader = document.querySelector(`[data-sort="${column}"] .sort-icon`);
  if (activeHeader) {
    activeHeader.style.opacity = '1';
    activeHeader.style.transform = sortState.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)';
  }
  
  sortData();
  renderTable();
}

function sortData() {
  currentData.sort((a, b) => {
    let aVal, bVal;
    
    switch (sortState.column) {
      case 'author':
        aVal = a.author.toLowerCase();
        bVal = b.author.toLowerCase();
        break;
      case 'timestamp':
        aVal = a.timestampSort;
        bVal = b.timestampSort;
        break;
      case 'subreddit':
        aVal = a.subreddit.toLowerCase();
        bVal = b.subreddit.toLowerCase();
        break;
      case 'upvotes':
        aVal = a.upvotes;
        bVal = b.upvotes;
        break;
      case 'intensity':
        aVal = a.intensity;
        bVal = b.intensity;
        break;
      default:
        return 0;
    }
    
    if (typeof aVal === 'string') {
      return sortState.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortState.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });
}

function applyFilters() {
  let filtered = [...desiresWishesData];

  // Keyword filter
  if (currentFilters.keyword) {
    filtered = filtered.filter(item =>
      item.text.toLowerCase().includes(currentFilters.keyword) ||
      item.author.toLowerCase().includes(currentFilters.keyword) ||
      item.summary.toLowerCase().includes(currentFilters.keyword) ||
      item.fullText.toLowerCase().includes(currentFilters.keyword)
    );
  }

  // Subreddit filter
  if (currentFilters.subreddit !== 'all') {
    filtered = filtered.filter(item =>
      item.subreddit.includes(currentFilters.subreddit)
    );
  }

  // Desires filter
  if (currentFilters.desire !== 'all') {
    filtered = filtered.filter(item =>
      item.category === currentFilters.desire
    );
  }

  // Emotion filter
  if (currentFilters.emotion !== 'all') {
    filtered = filtered.filter(item =>
      item.emotion === currentFilters.emotion
    );
  }

  // Intensity filter
  const intensityThreshold = currentFilters.intensity / 100;
  filtered = filtered.filter(item =>
    item.intensity >= intensityThreshold
  );

  // Time filter (simplified for demo)
  if (currentFilters.timeFilter !== 'all') {
    // In a real app, you'd filter by actual timestamps
  }

  currentData = filtered;
  filteredData = filtered;
  
  // Reset to first page when filters change
  currentPage = 1;
  
  // Re-apply sorting if active
  if (sortState.column) {
    sortData();
  }
  
  // Update pagination and display
  updatePaginationInfo();
  updatePaginationControls();
  displayCurrentPage();
  updateTopInsights();
}

function renderTable() {
  // Initialize filtered data if not already done
  if (filteredData.length === 0) {
    filteredData = [...currentData];
  }
  displayCurrentPage();
}

function showCommentSidebar(item) {
  const content = `
    <div class="comment-detail">
      <div class="comment-field">
        <div class="comment-field-label">Full Comment</div>
        <div class="comment-full-text">${item.fullText}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Author</div>
        <div class="comment-field-value">${item.author}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Subreddit</div>
        <div class="comment-field-value">${item.subreddit}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Post Title</div>
        <div class="comment-field-value">${item.post}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Desire/Wish Category</div>
        <div class="comment-field-value">${item.categoryDisplay}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Emotion</div>
        <div class="comment-field-value">${item.emotion.charAt(0).toUpperCase() + item.emotion.slice(1)}</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Sentiment Intensity</div>
        <div class="comment-field-value">${Math.round(item.intensity * 100)}% (${item.intensity > 0.8 ? 'High' : item.intensity > 0.5 ? 'Moderate' : 'Low'})</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Engagement</div>
        <div class="comment-field-value">${item.upvotes} upvotes • ${item.additionalInfo.replies} replies • ${item.additionalInfo.awards} awards</div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Post URL</div>
        <div class="comment-field-value"><a href="${item.additionalInfo.postUrl}" target="_blank" style="color: #7D68F1; text-decoration: none;">${item.additionalInfo.postUrl}</a></div>
      </div>
      
      <div class="comment-field">
        <div class="comment-field-label">Comment Depth</div>
        <div class="comment-field-value">Level ${item.additionalInfo.commentDepth}</div>
      </div>
    </div>
  `;
  
  commentSidebarContent.innerHTML = content;
  commentSidebar.classList.add('active');
}

function closeCommentSidebarFunc() {
  commentSidebar.classList.remove('active');
}

function updateTopInsights() {
  // Calculate insights based on current data
  const categoryStats = {};
  const emotionStats = {};
  let totalIntensity = 0;
  
  currentData.forEach(item => {
    // Category stats
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { count: 0, display: item.categoryDisplay };
    }
    categoryStats[item.category].count++;
    
    // Emotion stats
    if (!emotionStats[item.emotion]) {
      emotionStats[item.emotion] = 0;
    }
    emotionStats[item.emotion]++;
    
    totalIntensity += item.intensity;
  });
  
  // Update insights grid
  const sortedCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 3);
  
  insightsGrid.innerHTML = sortedCategories.map(([category, data], index) => {
    const percentage = Math.round((data.count / currentData.length) * 100);
    const badgeClass = ['red', 'green', 'yellow'][index];
    return `
      <div class="insight-item">
        <div class="insight-badge ${badgeClass}">${data.display}</div>
        <div class="insight-text">${percentage}% of users express desires related to ${data.display.toLowerCase()}</div>
      </div>
    `;
  }).join('');
  
  // Update themes grid
  const sortedEmotions = Object.entries(emotionStats)
    .sort(([,a], [,b]) => b - a);
  
  const emotionEmojis = {
    sad: '😢',
    frustrated: '😤',
    hopeful: '😊',
    happy: '😄'
  };
  
  themesGrid.innerHTML = `
    <div class="theme-item">
      ${sortedEmotions.map(([emotion]) => 
        `<span class="theme-emotion">${emotionEmojis[emotion]} ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>`
      ).join('')}
    </div>
  `;
  
  // Update sentiment analysis
  sentimentItems.innerHTML = sortedEmotions.map(([emotion, count]) => {
    const percentage = Math.round((count / currentData.length) * 100);
    return `
      <div class="sentiment-item">
        <span class="sentiment-label">${emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
        <div class="sentiment-bar">
          <div class="sentiment-fill" style="width: ${percentage}%"></div>
        </div>
        <span class="sentiment-percentage">${percentage}%</span>
      </div>
    `;
  }).join('');
}

function updateActiveStates() {
  // Set initial active states for filter buttons
  const activeSubredditBtn = subredditButtons.querySelector(`[data-subreddit="${currentFilters.subreddit}"]`);
  if (activeSubredditBtn) activeSubredditBtn.classList.add('active');
  
  const activeDesireBtn = desiresButtons.querySelector(`[data-desire="${currentFilters.desire}"]`);
  if (activeDesireBtn) activeDesireBtn.classList.add('active');
  
  const activeEmotionBtn = emotionButtons.querySelector(`[data-emotion="${currentFilters.emotion}"]`);
  if (activeEmotionBtn) activeEmotionBtn.classList.add('active');
}

function handleExportData() {
  const csvContent = generateCSV(currentData);
  downloadFile(csvContent, 'desires-wishes-data.csv', 'text/csv');
}

function handleExportInsights() {
  const insightsText = generateInsightsText();
  downloadFile(insightsText, 'desires-wishes-insights.txt', 'text/plain');
}

function handleGenerateQuotes() {
  const numQuotes = parseInt(numQuotesInput.value, 10);
  if (isNaN(numQuotes) || numQuotes <= 0 || numQuotes > 10) {
    alert('Please enter a valid number of quotes (1-10).');
    return;
  }

  quotesResults.innerHTML = '';
  quotesResults.style.display = 'block';

  // Use quotes based on current data emotions and categories
  const relevantQuotes = hardcodedQuotes.slice(0, numQuotes);

  relevantQuotes.forEach(quote => {
    const quoteItem = document.createElement('div');
    quoteItem.classList.add('quote-item');
    quoteItem.textContent = `"${quote}"`;
    quotesResults.appendChild(quoteItem);
  });
}

function handleExportQuotes() {
  const quotes = Array.from(quotesResults.querySelectorAll('.quote-item')).map(item => item.textContent);
  if (quotes.length === 0) {
    alert('Please generate quotes first.');
    return;
  }
  const quotesText = quotes.join('\n\n');
  downloadFile(quotesText, 'generated-desires-wishes-quotes.txt', 'text/plain');
}

function generateCSV(data) {
  const headers = ['Author', 'Timestamp', 'Subreddit', 'Text', 'Upvotes', 'Post', 'Desire/Wish', 'Sentiment Intensity', 'Summary'];
  const csvRows = [headers.join(',')];
  
  data.forEach(item => {
    const row = [
      `"${item.author}"`,
      `"${item.timestamp}"`,
      `"${item.subreddit}"`,
      `"${item.fullText.replace(/"/g, '""')}"`,
      item.upvotes,
      `"${item.post}"`,
      `"${item.categoryDisplay}"`,
      Math.round(item.intensity * 100) + '%',
      `"${item.summary}"`
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

function generateInsightsText() {
  const categoryStats = {};
  const emotionStats = {};
  
  currentData.forEach(item => {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { count: 0, display: item.categoryDisplay };
    }
    categoryStats[item.category].count++;
    
    if (!emotionStats[item.emotion]) {
      emotionStats[item.emotion] = 0;
    }
    emotionStats[item.emotion]++;
  });
  
  const sortedCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.count - a.count);
  
  const sortedEmotions = Object.entries(emotionStats)
    .sort(([,a], [,b]) => b - a);
  
  return `Desires/Wishes Insights Report

List of the most expressed desires/wishes:
${sortedCategories.map(([category, data]) => {
  const percentage = Math.round((data.count / currentData.length) * 100);
  return `- ${data.display}: ${percentage}% of users express desires related to ${data.display.toLowerCase()}`;
}).join('\n')}

Common themes:
${sortedEmotions.map(([emotion]) => emotion.charAt(0).toUpperCase() + emotion.slice(1)).join(', ')}

Sentiment Analysis - How common was each theme:
${sortedEmotions.map(([emotion, count]) => {
  const percentage = Math.round((count / currentData.length) * 100);
  return `${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${percentage}%`;
}).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
Total entries analyzed: ${currentData.length}`;
}

function downloadFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initial setup for sidebar active state
document.addEventListener('DOMContentLoaded', () => {
  const desiresWishesSidebarItem = document.querySelector('.sidebar-item[data-section="Desires/Wishes"]');
  if (desiresWishesSidebarItem) {
    desiresWishesSidebarItem.classList.add('active');
  }
});



// Pagination functions
function initializePagination() {
  filteredData = [...desiresWishesData];
  updatePaginationInfo();
  updatePaginationControls();
  displayCurrentPage();
}

function updatePaginationInfo() {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length);
  
  document.getElementById('currentRange').textContent = `${startItem}-${endItem}`;
  document.getElementById('totalComments').textContent = filteredData.length;
}

function updatePaginationControls() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginationNumbers = document.getElementById('paginationNumbers');
  
  paginationNumbers.innerHTML = '';
  
  // Previous button state
  const prevBtn = document.getElementById('prevPage');
  prevBtn.disabled = currentPage === 1;
  prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
  
  // Next button state
  const nextBtn = document.getElementById('nextPage');
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';
  
  // Page numbers
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.onclick = () => goToPage(i);
    paginationNumbers.appendChild(pageBtn);
  }
  
  // Add dots and last page if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement('span');
      dots.className = 'pagination-dots';
      dots.textContent = '...';
      paginationNumbers.appendChild(dots);
    }
    
    const lastPageBtn = document.createElement('button');
    lastPageBtn.className = 'pagination-btn';
    lastPageBtn.textContent = totalPages;
    lastPageBtn.onclick = () => goToPage(totalPages);
    paginationNumbers.appendChild(lastPageBtn);
  }
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    updatePaginationInfo();
    updatePaginationControls();
    displayCurrentPage();
  }
}

function displayCurrentPage() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  populateTable(pageData);
}

// Update the existing populateTable function to work with pagination
function populateTable(data) {
  tableBody.innerHTML = '';
  
  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" style="width: 16px; height: 16px;">
          ${item.author}
        </div>
      </td>
      <td>${item.timestamp}</td>
      <td>${item.subreddit}</td>
      <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.text}</td>
      <td>${item.upvotes}</td>
      <td>${item.post}</td>
      <td>${item.categoryDisplay}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 60px; height: 6px; background: rgba(125, 104, 241, 0.2); border-radius: 3px; overflow: hidden;">
            <div style="width: ${item.intensity * 100}%; height: 100%; background: linear-gradient(90deg, #7D68F1 0%, #C38CFF 100%); border-radius: 3px;"></div>
          </div>
          <span style="font-size: 0.75rem; color: #64748b;">${Math.round(item.intensity * 100)}%</span>
        </div>
      </td>
      <td>${item.summary}</td>
    `;
    
    row.addEventListener('click', () => showCommentSidebar(item));
    tableBody.appendChild(row);
  });
}

// Add pagination event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Existing initialization code...
  
  // Add pagination event listeners
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  });
  
  // Initialize pagination
  initializePagination();
});