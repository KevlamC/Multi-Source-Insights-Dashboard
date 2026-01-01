// Fake data for demonstration
const fakeComments = [
    // Sleep-related comments
    {
        id: 1,
        comment: "I've been taking melatonin for months and I still can't sleep through the night. It worked at first but now I feel like I'm immune to it. So frustrating to wake up at 3am every night.",
        solution: "Melatonin",
        frustration: "Still can't sleep",
        emotion: "frustration",
        topic: "sleep"
    },
    {
        id: 2,
        comment: "Sleep tracking apps promised to help optimize my sleep but they just make me more anxious about my sleep quality. The constant notifications and data just stress me out more.",
        solution: "Sleep Tracking Apps",
        frustration: "Made me anxious",
        emotion: "anxiety",
        topic: "sleep"
    },
    {
        id: 3,
        comment: "I spent $800 on a weighted blanket that was supposed to help with my insomnia. After 3 months, it hasn't made any difference and now I just feel foolish for believing the hype.",
        solution: "Weighted Blanket",
        frustration: "No improvement",
        emotion: "disappointment",
        topic: "sleep"
    },
    {
        id: 4,
        comment: "White noise machines don't work for me at all. I've tried ocean sounds, rain, and even brown noise. Nothing helps and I'm so tired of being tired all the time.",
        solution: "White Noise Machine",
        frustration: "Still tired",
        emotion: "sadness",
        topic: "sleep"
    },
    
    // Fitness-related comments
    {
        id: 5,
        comment: "I've tried every fitness app available but none of them stick. They all promise personalized workouts but end up being the same generic routines. I give up after a week every time.",
        solution: "Fitness Apps",
        frustration: "Not personalized",
        emotion: "frustration",
        topic: "fitness"
    },
    {
        id: 6,
        comment: "Bought an expensive gym membership thinking I'd finally get in shape. After 6 months, I've barely used it and I'm still out of shape. Such a waste of money.",
        solution: "Gym Membership",
        frustration: "Didn't use it",
        emotion: "disappointment",
        topic: "fitness"
    },
    {
        id: 7,
        comment: "Personal trainers are supposed to motivate you but mine just made me feel worse about myself. Every session was criticism about what I was doing wrong. I quit after a month.",
        solution: "Personal Trainer",
        frustration: "Made me feel worse",
        emotion: "sadness",
        topic: "fitness"
    },
    {
        id: 8,
        comment: "These protein supplements taste awful and gave me stomach problems. I spent $200 on what I thought would help with muscle building but it just made me sick.",
        solution: "Protein Supplements",
        frustration: "Made me sick",
        emotion: "anger",
        topic: "fitness"
    },
    
    // Productivity-related comments
    {
        id: 9,
        comment: "These productivity apps are all the same. I tried Notion for a month and ended up spending more time setting it up than actually getting work done. Back to paper and pen I guess.",
        solution: "Productivity Apps",
        frustration: "Too complicated",
        emotion: "disappointment",
        topic: "productivity"
    },
    {
        id: 10,
        comment: "Time blocking was supposed to revolutionize my schedule but it just made me more stressed. When things don't go according to the rigid schedule, I panic and get nothing done.",
        solution: "Time Blocking",
        frustration: "Too rigid",
        emotion: "anxiety",
        topic: "productivity"
    },
    {
        id: 11,
        comment: "I bought every productivity course and book I could find but none of them address my specific situation. They're all generic advice that doesn't work for my chaotic lifestyle.",
        solution: "Productivity Courses",
        frustration: "Too generic",
        emotion: "frustration",
        topic: "productivity"
    },
    
    // Mental Health-related comments
    {
        id: 12,
        comment: "Therapy was supposed to help with my anxiety but after 6 sessions I feel exactly the same. I'm so angry that I wasted all that money for nothing.",
        solution: "Therapy",
        frustration: "Didn't work",
        emotion: "anger",
        topic: "mental-health"
    },
    {
        id: 13,
        comment: "Meditation apps promise to reduce stress but I can't even sit still for 5 minutes without my mind racing. These apps make me feel like there's something wrong with me.",
        solution: "Meditation Apps",
        frustration: "Can't focus",
        emotion: "sadness",
        topic: "mental-health"
    },
    {
        id: 14,
        comment: "Anti-anxiety medication was supposed to help but the side effects are worse than the anxiety itself. I feel like a zombie and nothing brings me joy anymore.",
        solution: "Anti-anxiety Medication",
        frustration: "Terrible side effects",
        emotion: "sadness",
        topic: "mental-health"
    },
    
    // Nutrition-related comments
    {
        id: 15,
        comment: "I've tried every diet trend from keto to intermittent fasting but nothing works long-term. I always end up gaining the weight back and feeling worse than before.",
        solution: "Diet Trends",
        frustration: "Weight came back",
        emotion: "disappointment",
        topic: "nutrition"
    },
    {
        id: 16,
        comment: "Meal planning apps are too complicated and time-consuming. By the time I plan all my meals, I could have just cooked something simple. Total waste of time.",
        solution: "Meal Planning Apps",
        frustration: "Too time-consuming",
        emotion: "frustration",
        topic: "nutrition"
    },
    
    // Additional comments for testing
    {
        id: 17,
        comment: "I tried melatonin gummies, pills, and even the liquid drops. Nothing helps me stay asleep for more than 4 hours. It's like my body just doesn't respond to it anymore.",
        solution: "Melatonin",
        frustration: "Still can't sleep",
        emotion: "disappointment",
        topic: "sleep"
    },
    {
        id: 18,
        comment: "Melatonin made my sleep worse somehow. I would fall asleep but wake up feeling groggy and more tired than before. Had to stop taking it completely.",
        solution: "Melatonin",
        frustration: "Made it worse",
        emotion: "frustration",
        topic: "sleep"
    },
    {
        id: 19,
        comment: "The therapy sessions were so expensive and after months of trying, I still have the same anxiety issues. Nothing changed and I'm out thousands of dollars.",
        solution: "Therapy",
        frustration: "Didn't work",
        emotion: "disappointment",
        topic: "mental-health"
    },
    {
        id: 20,
        comment: "My therapist just kept asking me how I felt without giving me any practical tools. It was like paying someone to listen to me complain for an hour.",
        solution: "Therapy",
        frustration: "Didn't work",
        emotion: "frustration",
        topic: "mental-health"
    }
];

// State management
let currentFilters = {
    emotion: '',
    topic: '',
    search: ''
};

let currentComments = [];
let isExpanded = {};

// DOM elements
const emotionTrigger = document.getElementById('emotionTrigger');
const emotionMenu = document.getElementById('emotionMenu');
const emotionLabel = document.getElementById('emotionLabel');
const topicTrigger = document.getElementById('topicTrigger');
const topicMenu = document.getElementById('topicMenu');
const topicLabel = document.getElementById('topicLabel');
const searchInput = document.getElementById('searchInput');
const tableBody = document.getElementById('tableBody');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Popup elements
const commentPopup = document.getElementById('commentPopup');
const popupTitle = document.getElementById('popupTitle');
const popupContent = document.getElementById('popupContent');
const popupClose = document.getElementById('popupClose');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeDropdowns();
    initializeSearch();
    initializeFilterTags();
    renderComments();
    initializeLoadMore();
    initializeViewButtons();
    initializePopup();
});

// Dropdown functionality
function initializeDropdowns() {
    // Emotion dropdown
    emotionTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown(emotionMenu, emotionTrigger);
    });

    emotionMenu.addEventListener('click', function(e) {
        const item = e.target.closest('.dropdown-item');
        if (item) {
            const emotion = item.dataset.emotion;
            selectEmotion(emotion, item);
            closeDropdown(emotionMenu, emotionTrigger);
        }
    });

    // Topic dropdown
    topicTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown(topicMenu, topicTrigger);
    });

    topicMenu.addEventListener('click', function(e) {
        const item = e.target.closest('.dropdown-item');
        if (item) {
            const topic = item.dataset.topic;
            selectTopic(topic, item);
            closeDropdown(topicMenu, topicTrigger);
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        closeDropdown(emotionMenu, emotionTrigger);
        closeDropdown(topicMenu, topicTrigger);
    });
}

function toggleDropdown(menu, trigger) {
    const isActive = menu.classList.contains('active');
    
    // Close all dropdowns first
    closeDropdown(emotionMenu, emotionTrigger);
    closeDropdown(topicMenu, topicTrigger);
    
    if (!isActive) {
        menu.classList.add('active');
        trigger.classList.add('active');
    }
}

function closeDropdown(menu, trigger) {
    menu.classList.remove('active');
    trigger.classList.remove('active');
}

function selectEmotion(emotion, item) {
    // Update selection state
    emotionMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
    
    // Update filter and label
    currentFilters.emotion = emotion;
    if (emotion) {
        emotionLabel.textContent = capitalizeFirst(emotion);
        emotionTrigger.classList.add('active');
    } else {
        emotionLabel.textContent = 'Emotion';
        emotionTrigger.classList.remove('active');
    }
    
    filterComments();
}

function selectTopic(topic, item) {
    // Update selection state
    topicMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
    item.classList.add('selected');
    
    // Update filter and label
    currentFilters.topic = topic;
    if (topic) {
        const topicName = topic === 'mental-health' ? 'Mental Health' : capitalizeFirst(topic);
        topicLabel.textContent = topicName;
        topicTrigger.classList.add('active');
    } else {
        topicLabel.textContent = 'Topic';
        topicTrigger.classList.remove('active');
    }
    
    filterComments();
}

// Search functionality
function initializeSearch() {
    searchInput.addEventListener('input', function() {
        currentFilters.search = this.value.toLowerCase();
        filterComments();
        
        // Visual feedback
        if (currentFilters.search) {
            this.style.borderColor = '#5C4CE6';
        } else {
            this.style.borderColor = '#D1D5DB';
        }
    });
}

// Filter tags functionality
function initializeFilterTags() {
    const filterTags = document.querySelectorAll('.filter-tag');
    
    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
            filterComments();
        });
    });
}

// Load more functionality
function initializeLoadMore() {
    loadMoreBtn.addEventListener('click', function() {
        this.textContent = 'Loading...';
        this.disabled = true;
        
        setTimeout(() => {
            // Add more fake comments (in real app, this would fetch from API)
            const moreComments = [
                {
                    id: Date.now() + 1,
                    comment: "I tried every meditation app available but I just can't focus for more than 2 minutes. My mind races constantly and these apps don't help at all.",
                    solution: "Meditation Apps",
                    frustration: "Can't focus",
                    emotion: "anxiety",
                    topic: "mental-health"
                },
                {
                    id: Date.now() + 2,
                    comment: "Bought an expensive ergonomic chair thinking it would fix my back problems. After 3 months, my back hurts just as much. What a waste of money.",
                    solution: "Ergonomic Chair",
                    frustration: "Still in pain",
                    emotion: "disappointment",
                    topic: "fitness"
                }
            ];
            
            fakeComments.push(...moreComments);
            filterComments();
            
            this.textContent = 'Load more results';
            this.disabled = false;
        }, 1000);
    });
}

// View buttons functionality
function initializeViewButtons() {
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const viewType = this.dataset.viewType;
            const viewValue = this.dataset.viewValue;
            showCommentPopup(viewType, viewValue);
        });
    });
}

// Popup functionality
function initializePopup() {
    popupClose.addEventListener('click', function() {
        hideCommentPopup();
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (commentPopup.classList.contains('active') && 
            !commentPopup.contains(e.target) && 
            !e.target.closest('.view-btn')) {
            hideCommentPopup();
        }
    });
    
    // Prevent popup from closing when clicking inside
    commentPopup.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

function showCommentPopup(viewType, viewValue) {
    // Filter comments based on view type
    let filteredComments = [];
    
    if (viewType === 'solution') {
        filteredComments = fakeComments.filter(comment => 
            comment.solution.toLowerCase().includes(viewValue.toLowerCase())
        );
    } else if (viewType === 'frustration') {
        filteredComments = fakeComments.filter(comment => 
            comment.frustration.toLowerCase().includes(viewValue.toLowerCase())
        );
    }
    
    // Update popup title
    popupTitle.textContent = `Comments about "${viewValue}"`;
    
    // Render comments in popup
    renderPopupComments(filteredComments);
    
    // Show popup
    commentPopup.classList.add('active');
}

function hideCommentPopup() {
    commentPopup.classList.remove('active');
}

function renderPopupComments(comments) {
    if (comments.length === 0) {
        popupContent.innerHTML = `
            <div class="popup-empty">
                <div class="popup-empty-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                </div>
                <h4>No comments found</h4>
                <p>There are no comments matching this criteria.</p>
            </div>
        `;
        return;
    }
    
    const commentsHtml = comments.map(comment => {
        const emotionClass = `${comment.emotion}-badge`;
        const topicDisplay = comment.topic === 'mental-health' ? 'Mental Health' : capitalizeFirst(comment.topic);
        
        return `
            <div class="popup-comment">
                <div class="popup-badges">
                    <span class="emotion-badge ${emotionClass}">${capitalizeFirst(comment.emotion)}</span>
                    <span class="topic-badge">${topicDisplay}</span>
                </div>
                <div class="popup-comment-text">
                    <p>${comment.comment}</p>
                </div>
                <div class="popup-details">
                    <span class="popup-detail-item">Solution: ${comment.solution}</span>
                    <span class="popup-detail-item">Frustration: ${comment.frustration}</span>
                </div>
                <div class="popup-save" data-comment-id="${comment.id}"></div>
            </div>
        `;
    }).join('');
    
    popupContent.innerHTML = commentsHtml;
    
    // Initialize save buttons for popup comments
    initializePopupSaveButtons();
}

function initializePopupSaveButtons() {
    const saveButtons = popupContent.querySelectorAll('.popup-save');
    
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            
            if (this.classList.contains('saved')) {
                this.classList.remove('saved');
                this.style.background = '#D1D5DB';
                showToast('Removed from saved items');
            } else {
                this.classList.add('saved');
                this.style.background = '#5C4CE6';
                showToast('Saved successfully');
            }
        });
    });
}

// Comment filtering
function filterComments() {
    let filteredComments = fakeComments;
    
    // Apply emotion filter
    if (currentFilters.emotion) {
        filteredComments = filteredComments.filter(comment => 
            comment.emotion === currentFilters.emotion
        );
    }
    
    // Apply topic filter
    if (currentFilters.topic) {
        filteredComments = filteredComments.filter(comment => 
            comment.topic === currentFilters.topic
        );
    }
    
    // Apply search filter
    if (currentFilters.search) {
        filteredComments = filteredComments.filter(comment => 
            comment.comment.toLowerCase().includes(currentFilters.search) ||
            comment.solution.toLowerCase().includes(currentFilters.search) ||
            comment.frustration.toLowerCase().includes(currentFilters.search)
        );
    }
    
    currentComments = filteredComments;
    renderComments();
}

// Render comments in table
function renderComments() {
    tableBody.innerHTML = '';
    
    currentComments.forEach((comment, index) => {
        const row = createCommentRow(comment, index);
        tableBody.appendChild(row);
    });
    
    // Reinitialize expand functionality
    initializeExpandFunctionality();
    initializeSaveButtons();
}

function createCommentRow(comment, index) {
    const row = document.createElement('div');
    row.className = `table-row ${index % 2 === 1 ? 'alt-row' : ''}`;
    row.dataset.commentId = comment.id;
    
    const emotionClass = `${comment.emotion}-badge`;
    const topicDisplay = comment.topic === 'mental-health' ? 'Mental Health' : capitalizeFirst(comment.topic);
    
    row.innerHTML = `
        <div class="cell comment-cell">
            <div class="expand-icon" data-comment-id="${comment.id}"></div>
            <div class="comment-text">${comment.comment}</div>
        </div>
        <div class="cell">
            <span class="solution-tag">${comment.solution}</span>
        </div>
        <div class="cell">
            <span class="frustration-text">${comment.frustration}</span>
        </div>
        <div class="cell">
            <span class="emotion-badge ${emotionClass}">${capitalizeFirst(comment.emotion)}</span>
        </div>
        <div class="cell">
            <span class="topic-text">${topicDisplay}</span>
        </div>
        <div class="cell">
            <button class="save-btn" data-comment-id="${comment.id}">
                <div class="save-icon"></div>
            </button>
        </div>
    `;
    
    return row;
}

// Expand functionality
function initializeExpandFunctionality() {
    const expandIcons = document.querySelectorAll('.expand-icon');
    
    expandIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            const row = this.closest('.table-row');
            const commentText = this.nextElementSibling;
            
            if (isExpanded[commentId]) {
                // Collapse
                this.classList.remove('expanded');
                row.classList.remove('expanded-row');
                isExpanded[commentId] = false;
            } else {
                // Expand
                this.classList.add('expanded');
                row.classList.add('expanded-row');
                isExpanded[commentId] = true;
            }
        });
    });
}

// Save button functionality
function initializeSaveButtons() {
    const saveButtons = document.querySelectorAll('.save-btn');
    
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentId = this.dataset.commentId;
            
            if (this.classList.contains('saved')) {
                this.classList.remove('saved');
                showToast('Removed from saved items');
            } else {
                this.classList.add('saved');
                showToast('Saved successfully');
            }
        });
    });
}

// Utility functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1F2937;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1001;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus search with Ctrl/Cmd + F
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Clear filters with Ctrl/Cmd + R
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        clearAllFilters();
    }
    
    // Close popup with Escape
    if (e.key === 'Escape' && commentPopup.classList.contains('active')) {
        hideCommentPopup();
    }
});

function clearAllFilters() {
    // Clear search
    searchInput.value = '';
    searchInput.style.borderColor = '#D1D5DB';
    
    // Clear emotion filter
    currentFilters.emotion = '';
    emotionLabel.textContent = 'Emotion';
    emotionTrigger.classList.remove('active');
    emotionMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
    
    // Clear topic filter
    currentFilters.topic = '';
    topicLabel.textContent = 'Topic';
    topicTrigger.classList.remove('active');
    topicMenu.querySelectorAll('.dropdown-item').forEach(el => el.classList.remove('selected'));
    
    // Clear search filter
    currentFilters.search = '';
    
    // Clear active tags
    document.querySelectorAll('.filter-tag.active').forEach(tag => {
        tag.classList.remove('active');
    });
    
    filterComments();
    showToast('All filters cleared');
}

// Initialize with all comments
filterComments();
