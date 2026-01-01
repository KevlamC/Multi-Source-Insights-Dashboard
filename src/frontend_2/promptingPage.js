// State management
let isInputCentered = true;
let messages = [];

// DOM elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarItems = document.querySelectorAll('.sidebar-item');
const dropdownBtn = document.getElementById('dropdownBtn');
const dropdown = document.getElementById('promptDropdown');
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownLabel = document.getElementById('dropdownLabel');
const chatMessages = document.getElementById('chatMessages');
const inputContainer = document.getElementById('inputContainer');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  initializeInputPosition();
});

// Event listeners
function setupEventListeners() {
  // Mobile menu toggle
  mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  sidebarOverlay.addEventListener('click', closeMobileMenu);
  
  // Sidebar navigation
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => handleSidebarClick(item));
  });
  
  // Dropdown functionality
  dropdownBtn.addEventListener('click', toggleDropdown);
  dropdownMenu.addEventListener('click', handleDropdownSelection);
  
  // Message form
  messageForm.addEventListener('submit', handleMessageSubmit);
  
  // Close dropdown when clicking outside
  document.addEventListener('click', handleOutsideClick);
  
  // Window resize
  window.addEventListener('resize', handleResize);
}

// Mobile menu functions
function toggleMobileMenu() {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
}

function closeMobileMenu() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

function handleResize() {
  if (window.innerWidth > 1024) {
    closeMobileMenu();
  }
}

// Sidebar navigation
function handleSidebarClick(item) {
  // Remove active class from all items
  sidebarItems.forEach(i => i.classList.remove('active'));
  
  // Add active class to clicked item
  item.classList.add('active');
  
  // Close mobile menu if open
  closeMobileMenu();
  
  const section = item.dataset.section;
  console.log(`Navigating to: ${section}`);
  
  // You would typically navigate to different pages here
  // For now, we'll just keep "Ask me Anything" active
}

// Dropdown functions
function toggleDropdown(e) {
  e.stopPropagation();
  dropdown.classList.toggle('open');
}

function handleDropdownSelection(e) {
  if (e.target.classList.contains('dropdown-item')) {
    const value = e.target.dataset.value;
    dropdownLabel.textContent = value;
    dropdown.classList.remove('open');
    console.log(`Selected prompt type: ${value}`);
  }
}

function handleOutsideClick(e) {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
}

// Initialize input position
function initializeInputPosition() {
  if (messages.length === 0) {
    inputContainer.classList.add('centered');
  } else {
    inputContainer.classList.add('bottom');
    isInputCentered = false;
  }
}

// Message handling
function handleMessageSubmit(e) {
  e.preventDefault();
  
  const messageText = messageInput.value.trim();
  if (!messageText) return;
  
  // Add user message
  addMessage(messageText, 'user');
  
  // Clear input
  messageInput.value = '';
  
  // Move input to bottom if centered
  if (isInputCentered) {
    moveInputToBottom();
  }
  
  // Show loading spinner
  showLoadingSpinner();
  
  // Simulate AI response
  setTimeout(() => {
    hideLoadingSpinner();
    addMessage(generateResponse(messageText), 'assistant');
  }, 1500);
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Add to messages array
  messages.push({ text, sender, timestamp: new Date() });
}

function moveInputToBottom() {
  inputContainer.classList.remove('centered');
  inputContainer.classList.add('bottom');
  isInputCentered = false;
}

function showLoadingSpinner() {
  messageForm.style.display = 'none';
  loadingSpinner.classList.add('show');
}

function hideLoadingSpinner() {
  loadingSpinner.classList.remove('show');
  messageForm.style.display = 'flex';
}

function generateResponse(userMessage) {
  const responses = [
    "That's an interesting question. Based on the Reddit data I've analyzed, here are some insights...",
    "I can help you understand that better. Let me break down what I've found in the community discussions...",
    "Great question! From the conversations I've processed, there are several patterns that emerge...",
    "I've analyzed thousands of Reddit comments on this topic. Here's what the community is saying...",
    "That's a common concern I see in the data. Here are some perspectives from the Reddit community..."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Add some initial animation effects
document.addEventListener('DOMContentLoaded', function() {
  // Animate chat container on load
  const chatContainer = document.querySelector('.chat-container');
  chatContainer.style.opacity = '0';
  chatContainer.style.transform = 'translateY(20px)';
  
  setTimeout(() => {
    chatContainer.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    chatContainer.style.opacity = '1';
    chatContainer.style.transform = 'translateY(0)';
  }, 100);
});