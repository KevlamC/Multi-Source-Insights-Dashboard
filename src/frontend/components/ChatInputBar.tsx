import React, { useState, useRef } from 'react';
import { PaperPlaneIcon } from './Icons';

interface ChatInputBarProps {
  onSendMessage: (msg: string) => void;
  isVisibleBar: boolean;
}

const predefinedMessages = [
  "Generate quotes",
  "Generate headlines", 
  "Generate LinkedIn post",
  "Generate email"
];

// Fixed: Use a direct URL or a conditional approach for process.env
const BACKEND_AI_CHAT_ROUTE = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/ai/chat` 
  : "http://localhost:3001/ai/chat";

export const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, isVisibleBar }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sendMessageToBackend = async (message: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(BACKEND_AI_CHAT_ROUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_prompt: message,
          user_task: selectedTag || 'general',
          filters: null
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      onSendMessage(data.response || data.message || data.data?.insights || 'Received response from backend');
      
    } catch (error) {
      console.error('There was a problem with the fetch operation', error);
      onSendMessage('Error: Could not connect to the backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (msg?: string) => {
    const combinedMessage = [selectedTag, msg || inputValue].filter(Boolean).join("\n\n").trim();
    if (!combinedMessage) return;

    sendMessageToBackend(combinedMessage);
    
    setInputValue('');
    setSelectedTag(null);
    setShowOptions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) handleSendMessage();
  };

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setShowOptions(false);
  };

  const handleRemoveTag = () => {
    setSelectedTag(null);
  };

  return (
    <div
      className={`fixed left-1/2 bottom-4 transform w-[100%] max-w-3xl z-[100]
        ${isVisibleBar ? 'animate-bar-slide-up-fade-in' : 'animate-bar-slide-down-fade-out'}`}
    >
      <div className="relative">
        {/* Purple Glow */}
        <div className="absolute inset-[-3px] rounded-full bg-purple-400/30 shadow-[0_0_15px_8px_rgba(139,92,246,0.3)] z-[-1]" />

        {/* Input container */}
        <div className="flex gap-3 items-center bg-white shadow-lg rounded-full px-4 py-3 border border-violet-500">
          {/* Purple Button for Options */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowOptions(prev => !prev)}
              disabled={isLoading}
              className="h-10 w-10 flex items-center justify-center bg-violet-500 text-white rounded-full hover:bg-violet-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <span className="text-3xl leading-none relative -top-0.5">+</span>
            </button>

            {/* Dropdown Options */}
            {showOptions && (
              <div className="absolute bottom-12 left-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                  Quick Generate Options
                </div>
                {predefinedMessages.map((msg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectTag(msg)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-violet-50 hover:text-violet-600 transition"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input + Tag Inline */}
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            {selectedTag && (
              <span className="flex items-center gap-1 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm">
                {selectedTag}
                <button
                  onClick={handleRemoveTag}
                  className="ml-1 text-violet-500 hover:text-violet-700"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Processing..." : "Ask me anything..."}
              disabled={isLoading}
              className="flex-1 bg-transparent text-slate-600 placeholder-slate-400 text-sm outline-none disabled:opacity-50"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputValue && !selectedTag)}
            className="h-10 w-10 flex items-center justify-center bg-violet-500 text-white rounded-full hover:bg-violet-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="text-sm">...</span>
            ) : (
              <span className="text-2xl leading-none -ml-1">
                <PaperPlaneIcon />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
