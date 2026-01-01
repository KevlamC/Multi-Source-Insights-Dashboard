// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.tsx'
// // import ReactDOM from 'react-dom/client'
// // import React from 'react'

import { StrictMode } from 'react'; // Keep this import for StrictMode
import { createRoot } from 'react-dom/client'; // Keep this import for createRoot
import './index.css'; // Import your global CSS
import App from './frontend/components/App.tsx'; // Import your main App component

// Get the root HTML element where your React app will be mounted
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to create a root
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  // Log an error if the root element is not found
  console.error('Root element with ID "root" not found in the HTML. Cannot mount React application.');
}
