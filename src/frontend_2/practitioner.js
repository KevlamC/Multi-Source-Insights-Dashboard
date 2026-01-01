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
    category: 'chiropractor',
    confidence: 0.85,
    contextType: 'experience'
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
    category: 'physical_therapist',
    confidence: 0.72,
    contextType: 'question'
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
    confidence: 0.91,
    contextType: 'experience'
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
    category: 'physical_therapist',
    confidence: 0.78,
    contextType: 'recommendation'
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
    category: 'physical_therapist',
    confidence: 0.83,
    contextType: 'recommendation'
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
    confidence: 0.89,
    contextType: 'experience'
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
    category: 'chiropractor',
    confidence: 0.87,
    contextType: 'question'
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
    category: 'acupuncturist',
    confidence: 0.81,
    contextType: 'recommendation'
  }
];

// Calculate marketing value based on confidence and upvotes
function calculateMarketingValue(confidence, votes) {
  return confidence*votes;
}

// Add marketing value to each comment
painInsightsComments.forEach(comment => {
  comment.marketingValue = calculateMarketingValue(comment.confidence, comment.votes);
});

// Function to get marketing value category
function getMarketingValueCategory(marketingValue) {
  if (marketingValue <= 33) return 'Low';
  if (marketingValue <= 66) return 'Medium';
  return 'High';
}

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
const marketingValueSlider = document.getElementById('marketingValueSlider');
const marketingValueDisplay = document.getElementById('marketingValueDisplay');
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
  marketingValue: 50,
  contextTypes: ['recommendation', 'experience', 'question', 'neutral'],
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
  initializeCharts();
  setupChatFunctionality();
  initializePagination();
}

function setupChatFunctionality() {
  const askInChatBtn = document.getElementById('askInChatBtn');
  const chatInputBar = document.getElementById('chatInputBar');
  const chatPanel = document.getElementById('chatPanel');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatHistory = document.getElementById('chatHistory');
  const minimizeChatBtn = document.getElementById('minimizeChatBtn');
  const mainContent = document.querySelector('.main-content');

  let chatState = 'hidden'; // 'hidden', 'input-bar', 'full-chat'
  let chatMessages = loadChatHistory();

  // Event listeners
  askInChatBtn.addEventListener('click', showChatInputBar);
  chatSendBtn.addEventListener('click', () => sendChatMessage(chatInput));
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage(chatInput);
  });
  minimizeChatBtn.addEventListener('click', minimizeChat);

  function showChatInputBar() {
    const tableContainer = document.querySelector('.table-container');
    
    if (chatState === 'hidden') {
      chatState = 'input-bar';
      chatInputBar.classList.add('active');
      mainContent.classList.add('chat-dimmed');
      tableContainer.classList.add('chat-active');
      
      // Focus on input after animation
      setTimeout(() => {
        chatInput.focus();
      }, 300);
    } else if (chatState === 'input-bar') {
      // Close the chat bar if it's already showing
      chatState = 'hidden';
      chatInputBar.classList.remove('active');
      mainContent.classList.remove('chat-dimmed');
      tableContainer.classList.remove('chat-active');
    } else if (chatState === 'full-chat') {
      // If in full chat, minimize to hidden
      chatState = 'hidden';
      chatPanel.classList.remove('active');
      chatInputBar.classList.remove('active');
      mainContent.classList.remove('chat-active');
      mainContent.classList.remove('chat-dimmed');
      tableContainer.classList.remove('chat-active');
      
      // Reset minimize button icon
      minimizeChatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      `;
    }
  }

  function sendChatMessage(inputElement) {
    const message = inputElement.value.trim();
    if (!message) return;

    // Add user message to history
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    chatMessages.push(userMessage);
    saveChatHistory(chatMessages);
    
    // Clear input
    inputElement.value = '';
    
    // Show full chat panel if not already shown
    if (chatState !== 'full-chat') {
      showFullChatPanel();
    }
    
    // Render messages
    renderChatHistory();
    
    // Add loading indicator
    const loadingMessage = {
      id: Date.now() + 1,
      type: 'loading',
      content: 'Thinking...',
      timestamp: new Date().toISOString()
    };
    
    // Temporarily add loading message for display
    const tempMessages = [...chatMessages, loadingMessage];
    renderChatHistory(tempMessages);
    
    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: generateChatResponse(message),
        timestamp: new Date().toISOString()
      };
      
      chatMessages.push(botMessage);
      saveChatHistory(chatMessages);
      renderChatHistory();
    }, 1500);
  }

  function showFullChatPanel() {
    chatState = 'full-chat';
    chatPanel.classList.add('active');
    mainContent.classList.add('chat-active');
    
    // Load and render existing chat history
    renderChatHistory();
    
    // No need to sync input values since we only have one input now
  }

  function minimizeChat() {
    const tableContainer = document.querySelector('.table-container');
    
    if (chatState === 'full-chat') {
      // First minimize to input bar
      chatState = 'input-bar';
      chatPanel.classList.remove('active');
      mainContent.classList.remove('chat-active');
      mainContent.classList.add('chat-dimmed');
      
      // Update minimize button to show close icon
      minimizeChatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else if (chatState === 'input-bar') {
      // Hide completely
      chatState = 'hidden';
      chatInputBar.classList.remove('active');
      mainContent.classList.remove('chat-dimmed');
      tableContainer.classList.remove('chat-active');
      
      // Reset minimize button icon
      minimizeChatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      `;
    }
  }

  function renderChatHistory(messages = chatMessages) {
    chatHistory.innerHTML = '';
    
    messages.forEach(message => {
      const messageDiv = document.createElement('div');
      
      if (message.type === 'loading') {
        messageDiv.className = 'chat-loading';
      } else {
        messageDiv.className = `chat-message ${message.type}`;
      }
      
      messageDiv.textContent = message.content;
      chatHistory.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function loadChatHistory() {
    try {
      const saved = localStorage.getItem('practitioner-chat-history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  function saveChatHistory(messages) {
    try {
      localStorage.setItem('practitioner-chat-history', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  function generateChatResponse(userMessage) {
    // Simple response generation based on user message
    const responses = [
      "Based on the current data, I can see several interesting patterns in the practitioner references.",
      "The data shows various emotions and experiences related to healthcare practitioners.",
      "Looking at the filtered results, there are insights about patient experiences and recommendations.",
      "The marketing value analysis suggests different levels of engagement across the comments.",
      "From the practitioner references, we can identify common themes in patient feedback."
    ];
    
    // Simple keyword-based responses
    if (userMessage.toLowerCase().includes('pain')) {
      return "The data shows significant discussion around chronic pain management and various practitioner approaches to treatment.";
    } else if (userMessage.toLowerCase().includes('doctor') || userMessage.toLowerCase().includes('physician')) {
      return "Many comments reference interactions with physicians, showing both positive and challenging experiences.";
    } else if (userMessage.toLowerCase().includes('therapy') || userMessage.toLowerCase().includes('therapist')) {
      return "Physical therapy and alternative therapy approaches are frequently mentioned with generally positive outcomes.";
    } else if (userMessage.toLowerCase().includes('emotion')) {
      return "The emotional analysis reveals a mix of frustration, hope, and positive experiences across the practitioner references.";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Initialize chat history on load if exists
  if (chatMessages.length > 0) {
    renderChatHistory();
  }
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

  // Additional settings menu options
  const exportDataBtn = document.getElementById('exportData');
  const toggleThemeBtn = document.getElementById('toggleTheme');
  const resetFiltersBtn = document.getElementById('resetFilters');

  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleDownloadData();
      settingsDropdown.classList.remove('active');
    });
  }

  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
      settingsDropdown.classList.remove('active');
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
      settingsDropdown.classList.remove('active');
    });
  }

  // Chart toggle functionality
  const chartToggleBtns = document.querySelectorAll('.chart-toggle-btn');
  chartToggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chartType = e.target.getAttribute('data-chart');
      toggleChart(chartType);
    });
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
  marketingValueSlider.addEventListener('input', handleMarketingValueFilter);
  
  // Context type buttons (get after DOM is loaded)
  const contextTypeButtons = document.querySelectorAll('.context-btn');
  contextTypeButtons.forEach(btn => btn.addEventListener('click', handleContextTypeFilter));
  
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

function handleMarketingValueFilter() {
  const value = parseInt(marketingValueSlider.value);
  currentFilters.marketingValue = value;
  
  // Update display text using the new category function
  marketingValueDisplay.textContent = getMarketingValueCategory(value);
  
  applyFilters();
}

function handleContextTypeFilter(e) {
  const button = e.target;
  const contextType = button.getAttribute('data-context');
  
  button.classList.toggle('active');
  
  if (button.classList.contains('active')) {
    if (!currentFilters.contextTypes.includes(contextType)) {
      currentFilters.contextTypes.push(contextType);
    }
  } else {
    currentFilters.contextTypes = currentFilters.contextTypes.filter(type => type !== contextType);
  }
  
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

  // Marketing value filter (only show items with marketing value >= slider value)
  filteredData = filteredData.filter(comment => comment.marketingValue >= currentFilters.marketingValue);

  // Context type filter
  if (currentFilters.contextTypes.length > 0) {
    filteredData = filteredData.filter(comment =>
      currentFilters.contextTypes.includes(comment.contextType)
    );
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
  updateCharts();
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
  downloadFile(csvContent, 'practitioner-references-data.csv', 'text/csv');
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

// Chart variables
let timeChart = null;
let marketingChart = null;

function initializeCharts() {
  createTimeChart();
  createMarketingChart();
}

function createTimeChart() {
  const ctx = document.getElementById('timeChart').getContext('2d');
  
  const timeData = generateTimeDataWithMarketingValue();
  
  timeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timeData.labels,
      datasets: [{
        label: 'References',
        data: timeData.values,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const dataIndex = context.dataIndex;
              const marketingData = timeData.marketingDistribution[dataIndex];
              return [
                `References: ${context.parsed.y}`,
                '',
                'Marketing Value Distribution:',
                `High: ${marketingData.high}`,
                `Medium: ${marketingData.medium}`,
                `Low: ${marketingData.low}`
              ];
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#8b5cf6',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(203, 213, 225, 0.3)'
          }
        },
        x: {
          grid: {
            color: 'rgba(203, 213, 225, 0.3)'
          }
        }
      }
    }
  });
}

function createMarketingChart() {
  const ctx = document.getElementById('marketingChart').getContext('2d');
  
  // Generate marketing value distribution data
  const marketingData = generateMarketingData();
  
  marketingChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        data: marketingData,
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#10b981'
        ],
        borderColor: [
          '#dc2626',
          '#d97706',
          '#059669'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    }
  });
}

function generateTimeDataWithMarketingValue() {
  // Parse time strings and group comments by time periods
  const timeGroups = {
    'Hours ago': [],
    '1 day ago': [],
    '2 days ago': [],
    '3 days ago': []
  };
  
  // Group comments by time periods
  painInsightsComments.forEach(comment => {
    if (comment.time.includes('hours ago')) {
      timeGroups['Hours ago'].push(comment);
    } else if (comment.time === '1 day ago') {
      timeGroups['1 day ago'].push(comment);
    } else if (comment.time === '2 days ago') {
      timeGroups['2 days ago'].push(comment);
    } else if (comment.time === '3 days ago') {
      timeGroups['3 days ago'].push(comment);
    }
  });
  
  const labels = ['3 days ago', '2 days ago', '1 day ago', 'Hours ago'];
  const values = [];
  const marketingDistribution = [];
  
  labels.forEach(label => {
    const comments = timeGroups[label];
    const totalRefs = comments.length;
    values.push(totalRefs);
    
    // Calculate actual marketing value distribution for each time period
    const high = comments.filter(c => c.marketingValue > 66).length;
    const medium = comments.filter(c => c.marketingValue > 33 && c.marketingValue <= 66).length;
    const low = comments.filter(c => c.marketingValue <= 33).length;
    
    marketingDistribution.push({ high, medium, low });
  });
  
  return { labels, values, marketingDistribution };
}

function generateTimeData() {
  // Keep the old function for backward compatibility
  const labels = [];
  const values = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    values.push(Math.floor(Math.random() * 15) + 5); // Random values between 5-20
  }
  
  return { labels, values };
}

function generateMarketingData() {
  // Calculate marketing value distribution from original data
  const lowCount = painInsightsComments.filter(item => item.marketingValue <= 33).length;
  const mediumCount = painInsightsComments.filter(item => item.marketingValue > 33 && item.marketingValue <= 66).length;
  const highCount = painInsightsComments.filter(item => item.marketingValue > 66).length;
  
  return [lowCount, mediumCount, highCount];
}

function generateTimeDataFromFilteredData() {
  // Parse time strings and group filtered comments by time periods
  const timeGroups = {
    'Hours ago': [],
    '1 day ago': [],
    '2 days ago': [],
    '3 days ago': []
  };
  
  // Group filtered comments by time periods
  currentPainInsightsData.forEach(comment => {
    if (comment.time.includes('hours ago')) {
      timeGroups['Hours ago'].push(comment);
    } else if (comment.time === '1 day ago') {
      timeGroups['1 day ago'].push(comment);
    } else if (comment.time === '2 days ago') {
      timeGroups['2 days ago'].push(comment);
    } else if (comment.time === '3 days ago') {
      timeGroups['3 days ago'].push(comment);
    }
  });
  
  const labels = ['3 days ago', '2 days ago', '1 day ago', 'Hours ago'];
  const values = [];
  const marketingDistribution = [];
  
  labels.forEach(label => {
    const comments = timeGroups[label];
    const totalRefs = comments.length;
    values.push(totalRefs);
    
    // Calculate actual marketing value distribution for each time period
    const high = comments.filter(c => c.marketingValue > 66).length;
    const medium = comments.filter(c => c.marketingValue > 33 && c.marketingValue <= 66).length;
    const low = comments.filter(c => c.marketingValue <= 33).length;
    
    marketingDistribution.push({ high, medium, low });
  });
  
  return { labels, values, marketingDistribution };
}

function updateCharts() {
  if (marketingChart) {
    const newMarketingData = generateMarketingData();
    marketingChart.data.datasets[0].data = newMarketingData;
    marketingChart.update();
  }
  
  if (timeChart) {
    const newTimeData = generateTimeDataFromFilteredData();
    timeChart.data.labels = newTimeData.labels;
    timeChart.data.datasets[0].data = newTimeData.values;
    timeChart.options.plugins.tooltip.callbacks.label = function(context) {
      const dataIndex = context.dataIndex;
      const marketingData = newTimeData.marketingDistribution[dataIndex];
      return [
        `References: ${context.parsed.y}`,
        '',
        'Marketing Value Distribution:',
        `High: ${marketingData.high}`,
        `Medium: ${marketingData.medium}`,
        `Low: ${marketingData.low}`
      ];
    };
    timeChart.update();
  }
}


function resetAllFilters() {
  // Reset all filter values
  keywordSearchInput.value = '';
  confidenceInput.value = '';
  emotionSelect.value = 'all';
  marketingValueSlider.value = 50;
  marketingValueDisplay.textContent = 'Medium';
  
  // Reset context type buttons
  const contextButtons = document.querySelectorAll('.context-btn');
  contextButtons.forEach(btn => btn.classList.add('active'));
  
  // Reset checkboxes in dropdown
  const allCheckboxes = document.querySelectorAll('#filterDropdown input[type="checkbox"]');
  allCheckboxes.forEach(checkbox => {
    if (checkbox.value === 'all') {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  });
  
  // Reset filter state
  currentFilters = {
    keyword: '',
    confidence: '',
    emotion: 'all',
    marketingValue: 50,
    contextTypes: ['recommendation', 'experience', 'question', 'neutral'],
    subreddits: ['all'],
    categories: ['all']
  };
  
  // Apply filters to refresh the display
  applyFilters();
}


// Chat and Pagination State
let isChatActive = false;
let currentPage = 1;
const itemsPerPage = 4;

// Additional DOM elements for chat and pagination
const askInChatBtn = document.getElementById('askInChatBtn');
const chatPopup = document.getElementById('chatPopup');
const chatCollapseBtn = document.getElementById('chatCollapseBtn');
const chatInput = document.getElementById('chatInput');
const chatSendBtn = document.getElementById('chatSendBtn');
const chatMessages = document.getElementById('chatMessages');
const dataSection = document.querySelector('.data-section');
const paginationContainer = document.getElementById('paginationContainer');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbers = document.getElementById('pageNumbers');
const paginationInfo = document.getElementById('paginationInfo');

// Chat functionality
function initializeChatFunctionality() {
  askInChatBtn.addEventListener('click', toggleChat);
  chatCollapseBtn.addEventListener('click', toggleChat);
  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
}

function toggleChat() {
  isChatActive = !isChatActive;
  const tableContainer = document.querySelector('.table-container');
  const chatResponseModal = document.getElementById('chatResponseModal');
  
  if (isChatActive) {
    chatPopup.style.display = 'flex';
    dataSection.classList.add('chat-active');
    chatInput.focus();
    // Add shadow effects
    if (tableContainer) {
      tableContainer.classList.add('fusion-shadow-active');
    }
    if (chatResponseModal) {
      chatResponseModal.classList.add('fusion-shadow-active');
    }
  } else {
    chatPopup.style.display = 'none';
    dataSection.classList.remove('chat-active');
    // Remove shadow effects
    if (tableContainer) {
      tableContainer.classList.remove('fusion-shadow-active');
    }
    if (chatResponseModal) {
      chatResponseModal.classList.remove('fusion-shadow-active');
    }
  }
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Simulate bot response
    setTimeout(() => {
      const response = generateChatResponse(message);
      addChatMessage(response, 'bot');
      
      // Auto-scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
  }

function addChatMessage(message, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateChatResponse(userMessage) {
  const responses = [
    "Based on the current data, I can see patterns in chronic pain discussions.",
    "The data shows various emotions and practitioner references in the comments.",
    "Looking at the filtered results, there are insights about pain management approaches.",
    "The marketing value distribution suggests different levels of engagement.",
    "From the time analysis, we can see when most discussions occur."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Pagination functionality
// Fix pagination arrow functionality
function initializePagination() {
  prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
  nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
}

// Update changePage function
function changePage(newPage) {
  const totalPages = Math.ceil(currentPainInsightsData.length / itemsPerPage);
  
  if (newPage < 1 || newPage > totalPages) return;
  
  currentPage = newPage;
  renderTable();
  updatePaginationControls();
}

function changePage(newPage) {
  const totalPages = Math.ceil(currentPainInsightsData.length / itemsPerPage);
  
  if (newPage < 1 || newPage > totalPages) return;
  
  currentPage = newPage;
  renderTable();
  updatePaginationControls();
}


// Update pagination controls
function updatePaginationControls() {
  const totalPages = Math.ceil(currentPainInsightsData.length / itemsPerPage);
  
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
  
  pageNumbers.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => changePage(i));
    pageNumbers.appendChild(pageBtn);
  }
  
  paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

// Modified renderTable function to support pagination
function renderTableWithPagination() {
  tableBody.innerHTML = '';
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = currentPainInsightsData.slice(startIndex, endIndex);
  
  pageData.forEach(comment => {
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
  
  updatePaginationControls();
}

// Update the existing renderTable function
const originalRenderTable = renderTable;
renderTable = function() {
  renderTableWithPagination();
};

// Update the existing applyFilters function to reset pagination
const originalApplyFilters = applyFilters;
applyFilters = function() {
  currentPage = 1; // Reset to first page when filters change
  originalApplyFilters();
};

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  loadThemePreference();
});


// Theme toggle functionality
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  
  // Save theme preference to localStorage
  const isDarkTheme = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', isDarkTheme);
}

// Load theme preference on page load
function loadThemePreference() {
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  }
}

// Chart toggle functionality
function toggleChart(chartType) {
  const chartToggleBtns = document.querySelectorAll('.chart-toggle-btn');
  const timeChartContainer = document.getElementById('timeChartContainer');
  const marketingChartContainer = document.getElementById('marketingChartContainer');
  
  // Remove active class from all buttons
  chartToggleBtns.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to clicked button
  const activeBtn = document.querySelector(`[data-chart="${chartType}"]`);
  activeBtn.classList.add('active');
  
  // Show/hide charts
  if (chartType === 'time') {
    timeChartContainer.classList.remove('hidden');
    marketingChartContainer.classList.add('hidden');
  } else if (chartType === 'marketing') {
    timeChartContainer.classList.add('hidden');
    marketingChartContainer.classList.remove('hidden');
  }
}