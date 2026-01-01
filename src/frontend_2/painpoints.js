// Sample data for Pain Insights
const painInsightsComments = [
  {
    id: 1,
    author: 'u/chronic_sufferer',
    subreddit: 'r/chronicpain',
    comment: 'Living with chronic pain is a constant battle. It affects every aspect of my life, from sleep to work. I wish there was a magic cure.',
    votes: 120,
    emotion: 'frustrated',
    emotionEmoji: '😤',
    time: '3 hours ago',
    category: 'pain_points',
    confidence: 0.85
  },
  {
    id: 2,
    author: 'u/health_hope',
    subreddit: 'r/health',
    comment: "I'm looking for non-pharmacological ways to manage my fibromyalgia pain. Any success stories with diet or exercise?",
    votes: 85,
    emotion: 'neutral',
    emotionEmoji: '😐',
    time: '5 hours ago',
    category: 'desires_wishes',
    confidence: 0.72
  },
  {
    id: 3,
    author: 'u/pain_warrior',
    subreddit: 'r/chronicpain',
    comment: 'The medical system often dismisses chronic pain patients. It\'s frustrating to constantly fight for proper diagnosis and treatment.',
    votes: 150,
    emotion: 'frustrated',
    emotionEmoji: '😤',
    time: '7 hours ago',
    category: 'frustration_points',
    confidence: 0.91
  },
  {
    id: 4,
    author: 'u/mindful_relief',
    subreddit: 'r/wellness',
    comment: 'Mindfulness meditation has been a game-changer for my chronic migraines. It doesn\'t eliminate the pain, but it changes my relationship with it.',
    votes: 95,
    emotion: 'positive',
    emotionEmoji: '😊',
    time: '9 hours ago',
    category: 'desires_wishes',
    confidence: 0.78
  },
  {
    id: 5,
    author: 'u/support_group_member',
    subreddit: 'r/chronicpain',
    comment: 'Finding a support group for chronic pain has been invaluable. It\'s comforting to know I\'m not alone in this struggle.',
    votes: 70,
    emotion: 'positive',
    emotionEmoji: '😊',
    time: '1 day ago',
    category: 'desires_wishes',
    confidence: 0.83
  },
  {
    id: 6,
    author: 'u/frustrated_patient',
    subreddit: 'r/health',
    comment: 'My doctor keeps telling me my pain is \'all in my head.\' It\'s incredibly invalidating and makes me feel hopeless.',
    votes: 110,
    emotion: 'frustrated',
    emotionEmoji: '😤',
    time: '1 day ago',
    category: 'frustration_points',
    confidence: 0.89
  },
  {
    id: 7,
    author: 'u/seeking_answers',
    subreddit: 'r/chronicpain',
    comment: 'I\'ve tried countless treatments for my neuropathic pain, but nothing seems to work long-term. I\'m desperate for solutions.',
    votes: 130,
    emotion: 'sad',
    emotionEmoji: '😢',
    time: '2 days ago',
    category: 'pain_points',
    confidence: 0.87
  },
  {
    id: 8,
    author: 'u/alternative_therapies',
    subreddit: 'r/wellness',
    comment: 'Acupuncture and physical therapy have significantly reduced my chronic neck pain. Highly recommend exploring alternative therapies.',
    votes: 75,
    emotion: 'positive',
    emotionEmoji: '😊',
    time: '3 days ago',
    category: 'practitioner_references',
    confidence: 0.81
  }
];

// DOM elements
const mainSidebar = document.getElementById('mainSidebar');
const insightsSidebar = document.getElementById('insightsSidebar');
const toggleInsightsSidebarBtn = document.getElementById('toggleInsightsSidebar');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDropdown = document.getElementById('settingsDropdown');
const featureDescriptionsBtn = document.getElementById('featureDescriptions');
const featureDescriptionsModal = document.getElementById('featureDescriptionsModal');
const keywordSearchInput = document.getElementById('keywordSearch');
const runKeywordSearchBtn = document.getElementById('runKeywordSearchBtn');
const clearKeywordSearchBtn = document.getElementById('clearKeywordSearchBtn');
const confidenceInput = document.getElementById('confidenceInput');
const emotionSelect = document.getElementById('emotionSelect');
const filterDropdownBtn = document.getElementById('filterDropdownBtn');
const filterDropdown = document.getElementById('filterDropdown');
const subredditFilters = document.getElementById('subredditFilters');
const categoryFilters = document.getElementById('categoryFilters');
const dataTable = document.getElementById('dataTable');
const tableBody = document.getElementById('tableBody');
const visibleCount = document.getElementById('visibleCount');
const totalCount = document.getElementById('totalCount');
const downloadDataBtn = document.getElementById('downloadDataBtn');
const createHeadlinesBtn = document.getElementById('createHeadlinesBtn');
const headlinesResultsSection = document.getElementById('headlinesResultsSection');

// State management
let currentPainInsightsData = [...painInsightsComments];
let currentFilters = {
  keyword: '',
  confidence: '',
  emotion: 'all',
  subreddits: ['all'],
  categories: ['all']
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  renderTable();
  updateStats();
}

function setupEventListeners() {
  // Main sidebar hover
  mainSidebar.addEventListener('mouseenter', () => {
    mainSidebar.style.width = '240px';
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

  // Feature descriptions modal
  featureDescriptionsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    featureDescriptionsModal.style.display = 'flex';
    settingsDropdown.classList.remove('active');
  });

  // Close modal
  const modalClose = featureDescriptionsModal.querySelector('.modal-close');
  modalClose.addEventListener('click', () => {
    featureDescriptionsModal.style.display = 'none';
  });

  // Close modal on outside click
  featureDescriptionsModal.addEventListener('click', (e) => {
    if (e.target === featureDescriptionsModal) {
      featureDescriptionsModal.style.display = 'none';
    }
  });

  // Search functionality
  runKeywordSearchBtn.addEventListener('click', handleKeywordSearch);
  clearKeywordSearchBtn.addEventListener('click', clearKeywordSearch);
  keywordSearchInput.addEventListener('input', debounce(handleKeywordSearch, 300));

  // Filter functionality
  confidenceInput.addEventListener('input', debounce(handleConfidenceFilter, 300));
  emotionSelect.addEventListener('change', handleEmotionFilter);
  filterDropdownBtn.addEventListener('click', toggleFilterDropdown);

  // Filter dropdown checkboxes
  subredditFilters.addEventListener('change', handleSubredditFilter);
  categoryFilters.addEventListener('change', handleCategoryFilter);

  // Close filter dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterDropdownBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
      filterDropdown.classList.remove('active');
      filterDropdownBtn.classList.remove('active');
    }
    
    if (!settingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
      settingsDropdown.classList.remove('active');
    }
  });

  // Action buttons
  downloadDataBtn.addEventListener('click', handleDownloadData);
  createHeadlinesBtn.addEventListener('click', handleCreateHeadlines);

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
        // 1) Remove active class
        const sidebar = item.closest('.sidebar');
        sidebar.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // 2) Redirect based on data‑section
        const section = item.getAttribute('data-section');
        if (section === 'Reddit Scraper') {
            window.location.href = 'index.html';
        }
        else if (section === 'Ask me Anything') {
            window.location.href = 'promptingPage.html';
        }
        // else if you have more sections, handle them here…
        });
    });
}

function toggleInsightsSidebar() {
  insightsSidebar.classList.toggle('collapsed');
  const mainContent = document.querySelector('.main-content');
  
  if (insightsSidebar.classList.contains('collapsed')) {
    mainContent.style.marginLeft = '120px'; // 60px main + 60px collapsed insights
  } else {
    mainContent.style.marginLeft = '300px'; // 60px main + 240px insights
  }
  
  const arrow = toggleInsightsSidebarBtn.querySelector('svg polyline');
  if (insightsSidebar.classList.contains('collapsed')) {
    arrow.setAttribute('points', '9,18 15,12 9,6');
  } else {
    arrow.setAttribute('points', '15,18 9,12 15,6');
  }
}

function toggleFilterDropdown() {
  filterDropdown.classList.toggle('active');
  filterDropdownBtn.classList.toggle('active');
}

function handleKeywordSearch() {
  currentFilters.keyword = keywordSearchInput.value.toLowerCase().trim();
  applyFilters();
}

function clearKeywordSearch() {
  keywordSearchInput.value = '';
  currentFilters.keyword = '';
  applyFilters();
}

function handleConfidenceFilter() {
  currentFilters.confidence = confidenceInput.value.trim();
  applyFilters();
}

function handleEmotionFilter() {
  currentFilters.emotion = emotionSelect.value;
  applyFilters();
}

function handleSubredditFilter(e) {
  const checkbox = e.target;
  if (checkbox.type === 'checkbox') {
    if (checkbox.value === 'all') {
      if (checkbox.checked) {
        currentFilters.subreddits = ['all'];
        // Uncheck other checkboxes
        subredditFilters.querySelectorAll('input[type="checkbox"]:not([value="all"])').forEach(cb => {
          cb.checked = false;
        });
      }
    } else {
      // Remove 'all' if specific subreddit is selected
      currentFilters.subreddits = currentFilters.subreddits.filter(s => s !== 'all');
      const allCheckbox = subredditFilters.querySelector('input[value="all"]');
      allCheckbox.checked = false;
      
      if (checkbox.checked) {
        currentFilters.subreddits.push(checkbox.value);
      } else {
        currentFilters.subreddits = currentFilters.subreddits.filter(s => s !== checkbox.value);
      }
      
      // If no subreddits selected, select all
      if (currentFilters.subreddits.length === 0) {
        currentFilters.subreddits = ['all'];
        allCheckbox.checked = true;
      }
    }
    applyFilters();
  }
}

function handleCategoryFilter(e) {
  const checkbox = e.target;
  if (checkbox.type === 'checkbox') {
    if (checkbox.value === 'all') {
      if (checkbox.checked) {
        currentFilters.categories = ['all'];
        // Uncheck other checkboxes
        categoryFilters.querySelectorAll('input[type="checkbox"]:not([value="all"])').forEach(cb => {
          cb.checked = false;
        });
      }
    } else {
      // Remove 'all' if specific category is selected
      currentFilters.categories = currentFilters.categories.filter(c => c !== 'all');
      const allCheckbox = categoryFilters.querySelector('input[value="all"]');
      allCheckbox.checked = false;
      
      if (checkbox.checked) {
        currentFilters.categories.push(checkbox.value);
      } else {
        currentFilters.categories = currentFilters.categories.filter(c => c !== checkbox.value);
      }
      
      // If no categories selected, select all
      if (currentFilters.categories.length === 0) {
        currentFilters.categories = ['all'];
        allCheckbox.checked = true;
      }
    }
    applyFilters();
  }
}

function applyFilters() {
  let filteredData = [...painInsightsComments];

  // Keyword filter
  if (currentFilters.keyword) {
    filteredData = filteredData.filter(comment =>
      comment.comment.toLowerCase().includes(currentFilters.keyword) ||
      comment.author.toLowerCase().includes(currentFilters.keyword)
    );
  }

  // Confidence filter
  if (currentFilters.confidence) {
    const confidenceValue = parseConfidenceFilter(currentFilters.confidence);
    if (confidenceValue !== null) {
      filteredData = filteredData.filter(comment => comment.confidence >= confidenceValue);
    }
  }

  // Emotion filter
  if (currentFilters.emotion !== 'all') {
    filteredData = filteredData.filter(comment => comment.emotion === currentFilters.emotion);
  }

  // Subreddit filter
  if (!currentFilters.subreddits.includes('all')) {
    filteredData = filteredData.filter(comment =>
      currentFilters.subreddits.some(subreddit => comment.subreddit.includes(subreddit))
    );
  }

  // Category filter
  if (!currentFilters.categories.includes('all')) {
    filteredData = filteredData.filter(comment =>
      currentFilters.categories.includes(comment.category)
    );
  }

  currentPainInsightsData = filteredData;
  renderTable();
  updateStats();
}

function parseConfidenceFilter(filterString) {
  // Parse strings like ">= 0.3", "> 0.5", "< 0.8", etc.
  const match = filterString.match(/([><=]+)\s*([0-9.]+)/);
  if (match) {
    const operator = match[1];
    const value = parseFloat(match[2]);
    
    if (operator.includes('>=') || operator.includes('=>')) {
      return value;
    } else if (operator.includes('>')) {
      return value + 0.01; // Slightly higher for strict greater than
    }
    // For now, only handle >= and > operators
  }
  return null;
}

function renderTable() {
  tableBody.innerHTML = '';
  
  currentPainInsightsData.forEach(comment => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${comment.author}</td>
      <td>${comment.subreddit}</td>
      <td>${comment.comment}</td>
      <td>${comment.votes}</td>
      <td><span class="emotion-badge">${comment.emotionEmoji} ${capitalizeFirst(comment.emotion)}</span></td>
      <td>${comment.time}</td>
    `;
    tableBody.appendChild(row);
  });
}

function updateStats() {
  visibleCount.textContent = currentPainInsightsData.length;
  totalCount.textContent = '8'; // Fixed total as requested
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
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

function handleDownloadData() {
  const csvContent = generateCSV(currentPainInsightsData);
  downloadFile(csvContent, 'pain-insights-data.csv', 'text/csv');
}

function generateCSV(data) {
  const headers = ['Author', 'Subreddit', 'Comment', 'Votes', 'Emotion', 'Time', 'Category', 'Confidence'];
  const csvRows = [headers.join(',')];
  
  data.forEach(comment => {
    const row = [
      `"${comment.author}"`,
      `"${comment.subreddit}"`,
      `"${comment.comment.replace(/"/g, '""')}"`,
      comment.votes,
      `"${comment.emotion}"`,
      `"${comment.time}"`,
      `"${comment.category}"`,
      comment.confidence
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
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

function handleCreateHeadlines() {
  // Show loading state
  createHeadlinesBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56"/>
    </svg>
    Creating Headlines...
  `;
  createHeadlinesBtn.disabled = true;

  // Simulate processing time
  setTimeout(() => {
    // Reset button
    createHeadlinesBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2z"></path>
        <path d="M12 2v10"></path>
        <path d="M12 2l4 4"></path>
        <path d="M12 2l-4 4"></path>
      </svg>
      Create Headlines
    `;
    createHeadlinesBtn.disabled = false;

    // Show results section
    headlinesResultsSection.style.display = 'block';
    
    // Generate and populate headlines
    const headlines = generateHeadlines(currentPainInsightsData);
    populateHeadlines(headlines);
    
    // Scroll to results
    headlinesResultsSection.scrollIntoView({ behavior: 'smooth' });
  }, 1500);
}

function generateHeadlines(data) {
  // Hardcoded headlines as requested
  return [
    "Chronic Pain Community Reveals 12 Critical Insights from Reddit Analysis",
    "Frustrated Emotions Dominate Pain Management Discussions Online",
    "Medical System Dismissal: The Hidden Struggle of Chronic Pain Patients",
    "Alternative Therapies Show Promise in Community Pain Management Stories",
    "From Desperation to Hope: 5 Key Patterns in Pain Patient Experiences"
  ];
}

function populateHeadlines(headlines) {
  headlines.forEach((headline, index) => {
    setTimeout(() => {
      const headlineElement = document.getElementById(`headlineTitle${index + 1}`);
      if (headlineElement) {
        headlineElement.textContent = headline;
        headlineElement.parentElement.parentElement.style.opacity = '0';
        headlineElement.parentElement.parentElement.style.transform = 'translateY(20px)';
        headlineElement.parentElement.parentElement.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          headlineElement.parentElement.parentElement.style.opacity = '1';
          headlineElement.parentElement.parentElement.style.transform = 'translateY(0)';
        }, 50);
      }
    }, index * 200);
  });
}

// Add CSS for spin animation
const style = document.createElement('style');
style.textContent = `
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);