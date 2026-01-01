document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  lucide.createIcons();

  // Data
  const fakeComments = {
    'back-pain': [
      "I couldn't pick up my toddler without sharp pain shooting down my leg. That's when I knew I needed help.",
      "After months of waking up stiff and in pain, I finally went to see a specialist. The morning pain was unbearable."
    ],
    'flare-ups': [
      "After my third flare-up this month, I canceled all my plans and finally made that appointment I'd been putting off.",
      "The flare-up was so bad I couldn't get out of bed for two days. That's when I knew I needed professional help.",
      "When the pain flared up during my daughter's graduation, I missed most of the ceremony. That was my breaking point."
    ],
    'mobility issues': [
      "I couldn't tie my own shoes anymore. That moment of helplessness made me seek help.",
      "When I struggled to get out of my car, I realized how limited my mobility had become.",
      "Missing my grandson's soccer games because I couldn't sit on the bleachers was my wake-up call."
    ],
    'sleep issues': [
      "I was so sleep deprived from pain that I fell asleep at the wheel. That scare made me get help.",
      "When my partner started sleeping in the guest room because of my constant tossing and turning, I knew I had to do something.",
      "The sleep deprivation was affecting my work performance. Getting written up was my wake-up call.",
      "I tried every sleep aid on the market with no relief. That's when I realized I needed to treat the cause, not the symptom.",
      "After 6 months of broken sleep, my mental health was deteriorating. That's when I sought professional help.",
      "Pain kept me awake night after night. When I started hallucinating from exhaustion, I finally sought help."
    ],
    'mental health': [
      "The constant pain was making me irritable with my kids. Seeing how it affected them made me seek help.",
      "I started having anxiety attacks about the pain getting worse. That's when I knew I needed more than just painkillers.",
      "The depression from chronic pain made me withdraw from friends and family. My isolation was my wake-up call.",
      "I caught myself snapping at coworkers over small things. Realizing the pain was affecting my personality made me get help.",
      "When I stopped enjoying hobbies I'd loved for years, I knew the pain was taking too much from me."
    ],
    'health': [
      "My doctor suggested I look into alternative treatments after meds didn't help. This community gave me the push I needed.",
      "Reading success stories here made me finally book that appointment I'd been putting off for months."
    ],
    'chiropractic': [
      "I was nervous about my first adjustment, but the stories here put my mind at ease. Best decision ever!",
      "Reading about others' experiences with maintenance care convinced me to give it a try beyond just crisis management."
    ],
    'fitness': [
      "As someone who prides themselves on fitness, not being able to do basic exercises was humbling. This community helped.",
      "I thought I could just push through the pain until a trainer in this sub pointed out I was making things worse.",
      "The form check videos here showed me how much my pain was affecting my technique. Time for professional help!"
    ],
    'parent': [
      "When I couldn't get down on the floor to play with my kids, that was my breaking point.",
      "Missing my son's baseball games because I couldn't sit in the bleachers made me seek help."
    ],
    'student': [
      "I couldn't sit through lectures without debilitating pain. My grades were suffering and I knew I needed help.",
      "Carrying my heavy backpack across campus became impossible. I realized I needed more than just painkillers.",
      "The pain made it hard to concentrate on studying. When I failed my midterms, I knew I had to address the root cause."
    ],
    'teacher': [
      "Standing all day in front of the classroom became unbearable. My students deserved better from me.",
      "The pain made me impatient with my students. I didn't like the teacher I was becoming.",
      "When I had to sit down to teach because standing hurt too much, I knew I needed professional help.",
      "Grading papers became agony. I realized I needed to address the pain to keep doing the job I love.",
      "Missing school days because of pain was unfair to my students. That's when I sought real treatment.",
      "My students started noticing my discomfort and asking if I was okay. Their concern was my wake-up call.",
      "I couldn't demonstrate proper writing posture anymore. How could I teach what I couldn't do myself?",
      "The pain made me cut short classroom activities. My lessons suffered and so did my students' learning.",
      "I stopped supervising after-school clubs because of the pain. Missing those connections with students hurt more.",
      "When I couldn't kneel to help a struggling student, I knew I needed to make a change."
    ],
    'athlete': [
      "My performance was declining because of pain. When I got benched, I knew I needed more than just rest.",
      "I thought I could train through the pain until it sidelined me completely. Worst mistake ever.",
      "The pain was altering my form and increasing injury risk. My coach finally sat me down and told me to get help.",
      "Missing the championship game because of preventable pain was the lowest point of my career.",
      "I stopped setting personal records and started just hoping to finish workouts. That's not why I compete.",
      "My teammates started picking up my slack. Letting them down was worse than the physical pain.",
      "The pain made me skip optional training sessions. Then they became mandatory misses.",
      "I lost my starting position to someone less talented but healthier. That humiliation changed everything.",
      "When pain became my constant training partner, I knew I needed professional intervention."
    ]
  };

  const filterCounts = {
    trigger: {
      'back-pain': 2,
      'flare-ups': 3,
      'mobility issues': 3,
      'sleep issues': 6,
      'mental health': 5
    },
    subreddit: {
      'health': 2,
      'chiropractic': 2,
      'fitness': 3
    },
    persona: {
      'parent': 2,
      'student': 3,
      'teacher': 10,
      'athlete': 9
    }
  };

  const triggerExamples = [
    {
      id: '1',
      text: "I couldn't play with my kids anymore",
      description: "Life's too short to let pain ruin your family time",
      percentage: 85,
      content: "I couldn't play with my kids, so I looked for alternatives. I really had a problem when they fixed my back in no time! I'm really grateful for that.",
      subreddit: 'r/chiropractic',
      username: 'u/gratefuluser',
      date: '2025-07-13'
    },
    {
      id: '2',
      text: "After my 3rd flare up, I quit",
      description: "Life's too short to let flare-ups ruin your quality of life",
      percentage: 78,
      content: "After my 3rd flare up this month, I finally quit my desk job. The chronic pain was just too much to handle while sitting 8 hours a day.",
      subreddit: 'r/chiropractic',
      username: 'u/backpainwarrior',
      date: '2025-01-12'
    },
    {
      id: '3',
      text: "I was so sleep deprived that I couldn't function at work",
      description: "Your sleep is important, don't let lack of sleep affect your work performance",
      percentage: 72,
      content: "I was so sleep deprived from the constant pain that I couldn't function at work. My boss noticed and suggested I see a specialist.",
      subreddit: 'r/health',
      username: 'u/sleeplessworker',
      date: '2025-01-10'
    },
    {
      id: '4',
      text: "My morning routine became impossible",
      description: "Simple daily tasks shouldn't be a struggle",
      percentage: 68,
      content: "My morning routine became impossible due to the stiffness. Getting out of bed, brushing teeth, even putting on clothes became painful tasks.",
      subreddit: 'r/fitness',
      username: 'u/morningstruggle',
      date: '2025-01-08'
    },
    {
      id: '5',
      text: "I stopped going to social events",
      description: "Don't let pain isolate you from the people you love",
      percentage: 64,
      content: "I stopped going to social events because sitting for long periods became unbearable. My friends started to think I was avoiding them.",
      subreddit: 'r/health',
      username: 'u/sociallyisolated',
      date: '2025-01-05'
    }
  ];

  const triggerClusters = [
    { name: 'Flare-ups', percentage: 22, color: 'cluster-tag-red' },
    { name: 'Back-pain', percentage: 29, color: 'cluster-tag-green' },
    { name: 'Mobility issues', percentage: 12, color: 'cluster-tag-yellow' },
    { name: 'Sleep issues', percentage: 20, color: 'cluster-tag-blue' },
    { name: 'Mental Health', percentage: 17, color: 'cluster-tag-purple' },
  ];

  // State
  let currentExampleIndex = 0;
  let appliedFilters = {};
  let isGenerating = false;
  let currentModalType = null;
  let previousModalType = null;

  // DOM Elements
  const triggerFilterBtn = document.getElementById('trigger-filter');
  const subredditFilterBtn = document.getElementById('subreddit-filter');
  const personaFilterBtn = document.getElementById('persona-filter');
  const filterToggleBtn = document.getElementById('filter-toggle');
  const generateDataBtn = document.getElementById('generate-data');
  const nextExampleBtn = document.getElementById('next-example');
  const commentsContainer = document.getElementById('comments-container');
  const commentsList = document.getElementById('comments-list');
  const commentsCount = document.getElementById('comments-count');
  const totalTriggers = document.getElementById('total-triggers');
  const currentComment = document.getElementById('current-comment');
  const commentSubreddit = document.getElementById('comment-subreddit');
  const commentUsername = document.getElementById('comment-username');
  const commentDate = document.getElementById('comment-date');
  const filterModal = document.getElementById('filter-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalOptions = document.getElementById('modal-options');
  const filterInput = document.getElementById('filter-input');
  const modalOkBtn = document.getElementById('modal-ok');
  const modalCancelBtn = document.getElementById('modal-cancel');
  const triggerExamplesContainer = document.getElementById('trigger-examples');
  const triggerClustersContainer = document.getElementById('trigger-clusters');

  // Initialize the page
  function initPage() {
    // Load trigger examples
    triggerExamples.forEach(example => {
      const exampleEl = document.createElement('div');
      exampleEl.className = 'bg-blue-50 rounded-lg p-4 border border-blue-200';
      exampleEl.innerHTML = `
        <p class="font-medium text-gray-900 mb-2">${example.text}</p>
        <p class="text-sm text-blue-700 mb-3">${example.description}</p>
        <div class="flex items-center justify-between text-sm">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      `;
      triggerExamplesContainer.appendChild(exampleEl);
    });

    // Load trigger clusters
    triggerClusters.forEach(cluster => {
      const clusterEl = document.createElement('div');
      clusterEl.className = 'flex items-center justify-between py-2';
      clusterEl.innerHTML = `
        <span class="${cluster.color} px-3 py-1 rounded-full text-sm font-medium">
          ${cluster.name}
        </span>
        <span class="text-gray-600">${cluster.percentage}% felt this...</span>
      `;
      triggerClustersContainer.appendChild(clusterEl);
    });

    // Set initial example
    showCurrentExample();
  }

  // Show current example
  function showCurrentExample() {
    const example = triggerExamples[currentExampleIndex];
    currentComment.textContent = example.content;
    commentSubreddit.textContent = `Subreddit: ${example.subreddit}`;
    commentUsername.textContent = example.username;
    commentDate.textContent = `Date: ${example.date}`;
  }

  // Update filter buttons display
  function updateFilterButtons() {
    const buttons = [
      { btn: triggerFilterBtn, type: 'trigger' },
      { btn: subredditFilterBtn, type: 'subreddit' },
      { btn: personaFilterBtn, type: 'persona' }
    ];

    buttons.forEach(({ btn, type }) => {
      const value = appliedFilters[type];
      if (value) {
        btn.innerHTML = `
          <div class="flex flex-col items-center">
            <span>${type === 'trigger' ? 'Trigger Type' : type === 'subreddit' ? 'Subreddits' : 'Persona'}</span>
            <span class="text-xs">(${value})</span>
          </div>
        `;
        btn.classList.add('active');
      } else {
        btn.textContent = type === 'trigger' ? 'Trigger Type' : type === 'subreddit' ? 'Subreddits' : 'Persona';
        btn.classList.remove('active');
      }
    });

    filterToggleBtn.classList.toggle('active', Object.keys(appliedFilters).length > 0);
    filterToggleBtn.querySelector('span').textContent = Object.keys(appliedFilters).length > 0 ? 'Filter On' : 'Filter';
  }

  // Show modal
  function showModal(type, previousType = null) {
    currentModalType = type;
    previousModalType = previousType;

    if (type === 'remove') {
      modalTitle.textContent = 'Remove Filters';
      modalMessage.textContent = 'Are you sure you want to remove all filters? If so, click OK';
      modalOptions.textContent = '';
      filterInput.style.display = 'none';
    } else if (type === 'error') {
      modalTitle.textContent = 'Invalid Option';
      modalMessage.textContent = 'Please select an allowed option.';
      modalOptions.textContent = '';
      filterInput.style.display = 'none';
    } else {
      let title, message, options;
      if (type === 'trigger') {
        title = 'Trigger Type Filter';
        message = 'Please type in at least one, click OK, then click on "Generate Data":';
        options = 'back-pain, flare-ups, mobility issues, sleep issues, mental health';
      } else if (type === 'subreddit') {
        title = 'Subreddits Filter';
        message = 'Please type in at least one, click OK, then click on "Generate Data":';
        options = 'health, chiropractic, fitness';
      } else {
        title = 'Persona Filter';
        message = 'Please type in at least one, click OK, then click on "Generate Data":';
        options = 'parent, student, teacher, athlete';
      }

      modalTitle.textContent = title;
      modalMessage.textContent = message;
      modalOptions.textContent = options;
      filterInput.style.display = 'block';
      filterInput.value = '';
    }

    filterModal.classList.remove('hidden');
  }

  // Hide modal
  function hideModal() {
    filterModal.classList.add('hidden');
  }

  // Validate filter input
  function validateFilterInput(type, value) {
    const lowerValue = value.toLowerCase().trim();
   
    switch (type) {
      case 'trigger':
        return Object.keys(filterCounts.trigger).some(key => key.toLowerCase() === lowerValue);
      case 'subreddit':
        const cleanSubreddit = lowerValue.startsWith('r/') ? lowerValue.substring(2) : lowerValue;
        return Object.keys(filterCounts.subreddit).some(key => key.toLowerCase() === cleanSubreddit);
      case 'persona':
        return Object.keys(filterCounts.persona).some(key => key.toLowerCase() === lowerValue);
      default:
        return false;
    }
  }

  // Get filter key
  function getFilterKey(type, value) {
    const lowerValue = value.toLowerCase().trim();
   
    switch (type) {
      case 'trigger':
        return Object.keys(filterCounts.trigger).find(key => key.toLowerCase() === lowerValue) || '';
      case 'subreddit':
        const cleanSubreddit = lowerValue.startsWith('r/') ? lowerValue.substring(2) : lowerValue;
        return Object.keys(filterCounts.subreddit).find(key => key.toLowerCase() === cleanSubreddit) || '';
      case 'persona':
        return Object.keys(filterCounts.persona).find(key => key.toLowerCase() === lowerValue) || '';
      default:
        return '';
    }
  }

  // Generate data
  function generateData() {
    if (isGenerating) return;
    isGenerating = true;
    
    generateDataBtn.disabled = true;
    generateDataBtn.innerHTML = `
      <i data-lucide="loader" class="w-4 h-4 animate-spin"></i>
      <span>Generating...</span>
    `;
    lucide.createIcons();

    setTimeout(() => {
      let selectedComments = [];
      let commentCount = 0;

      // Get comments based on applied filters
      if (appliedFilters.trigger) {
        selectedComments = fakeComments[appliedFilters.trigger];
        commentCount = filterCounts.trigger[appliedFilters.trigger] || 0;
      } else if (appliedFilters.subreddit) {
        selectedComments = fakeComments[appliedFilters.subreddit];
        commentCount = filterCounts.subreddit[appliedFilters.subreddit] || 0;
      } else if (appliedFilters.persona) {
        selectedComments = fakeComments[appliedFilters.persona];
        commentCount = filterCounts.persona[appliedFilters.persona] || 0;
      } else {
        // No filters - show all 50 comments
        selectedComments = Object.values(fakeComments).flat();
        commentCount = 50;
      }

      // Clear previous comments
      commentsList.innerHTML = '';

      // Add new comments
      selectedComments.slice(0, commentCount).forEach((content, i) => {
        const commentEl = document.createElement('div');
        commentEl.className = 'border-b border-gray-100 pb-2';
        commentEl.innerHTML = `
          <p class="text-gray-700 text-sm">${content}</p>
          <div class="flex items-center space-x-2 text-xs text-gray-500 mt-1">
            <span>${appliedFilters.subreddit ? `r/${appliedFilters.subreddit}` : 
                 appliedFilters.trigger ? 'r/health' : 
                 appliedFilters.persona ? 'r/fitness' : 'r/health'}</span>
            <span>•</span>
            <span>user${Math.floor(Math.random() * 1000)}</span>
            <span>•</span>
            <span>2025-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}</span>
          </div>
        `;
        commentsList.appendChild(commentEl);
      });

      // Update UI
      commentsCount.textContent = commentCount;
      totalTriggers.textContent = commentCount;
      commentsContainer.classList.remove('hidden');

      // Reset generate button
      isGenerating = false;
      generateDataBtn.disabled = false;
      generateDataBtn.innerHTML = `
        <i data-lucide="search" class="w-4 h-4"></i>
        <span>Generate Data</span>
      `;
      lucide.createIcons();
    }, 1500);
  }

  // Show next example
  function showNextExample() {
    currentExampleIndex = (currentExampleIndex + 1) % triggerExamples.length;
    showCurrentExample();
  }

  // Event listeners
  triggerFilterBtn.addEventListener('click', () => {
    const filterKey = 'trigger';
    if (appliedFilters[filterKey] || Object.keys(appliedFilters).length > 0) {
      showModal('remove');
    } else {
      showModal('trigger');
    }
  });

  subredditFilterBtn.addEventListener('click', () => {
    const filterKey = 'subreddit';
    if (appliedFilters[filterKey] || Object.keys(appliedFilters).length > 0) {
      showModal('remove');
    } else {
      showModal('subreddit');
    }
  });

  personaFilterBtn.addEventListener('click', () => {
    const filterKey = 'persona';
    if (appliedFilters[filterKey] || Object.keys(appliedFilters).length > 0) {
      showModal('remove');
    } else {
      showModal('persona');
    }
  });

  filterToggleBtn.addEventListener('click', () => {
    if (Object.keys(appliedFilters).length > 0) {
      showModal('remove');
    }
  });

  generateDataBtn.addEventListener('click', generateData);
  nextExampleBtn.addEventListener('click', showNextExample);
  closeModalBtn.addEventListener('click', hideModal);
  modalCancelBtn.addEventListener('click', hideModal);

  modalOkBtn.addEventListener('click', () => {
    if (currentModalType === 'remove') {
      appliedFilters = {};
      commentsContainer.classList.add('hidden');
      totalTriggers.textContent = '50';
      updateFilterButtons();
      hideModal();
    } else if (currentModalType === 'error') {
      showModal(previousModalType);
    } else if (currentModalType && filterInput.value.trim()) {
      const isValid = validateFilterInput(currentModalType, filterInput.value);
     
      if (!isValid) {
        showModal('error', currentModalType);
        return;
      }

      const filterKey = getFilterKey(currentModalType, filterInput.value);
      appliedFilters = { [currentModalType]: filterKey };
      updateFilterButtons();
      hideModal();
    }
  });

  // Initialize the page
  initPage();
});
