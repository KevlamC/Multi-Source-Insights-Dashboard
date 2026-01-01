import React, { useEffect, useRef, useState } from "react";
import { PaperPlaneIcon } from "./Icons";

export interface Message {
  id: number;
  type: "user" | "bot" | "loading";
  content: string;
}

export interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

interface AskAIContentProps {
  chat: Chat;
  onUpdateMessages: (messages: Message[]) => void;
  onFirstMessage?: (msg: string) => void;
}

// Fixed: Use a direct URL or a conditional approach for process.env
const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL 
  : "http://localhost:3001";

const predefinedTags = [
  "Generate quotes",
  "Generate headlines",
  "Generate LinkedIn post",
  "Generate email",
];

const AskAIContent: React.FC<AskAIContentProps> = ({
  chat,
  onUpdateMessages,
  onFirstMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Add tag
  const handleSelectTag = (tag: string) => {
    setSelectedTags([tag]); // always replace with the new tag
    setShowOptions(false);
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_prompt: userMessage,
          user_task: selectedTags[0] || "general_query", // Use the selected tag as task, or default
          filters: null // You can pass filters here if needed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.content || "I couldn't generate a response. Please try again.";
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "Sorry, I'm having trouble connecting to the AI service. Please try again later.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const combinedMessage = [...selectedTags, text || inputValue].filter(Boolean).join("\n\n");
    if (!combinedMessage.trim()) return;

    const newUserMessage: Message = { 
      id: Date.now(), 
      type: "user", 
      content: combinedMessage 
    };
    const loadingMessage: Message = { 
      id: Date.now() + 1, 
      type: "loading", 
      content: "Thinking..." 
    };

    if (chat.messages.length === 0 && onFirstMessage) {
      onFirstMessage(combinedMessage);
    }

    // Add user message and loading indicator
    onUpdateMessages([...chat.messages, newUserMessage, loadingMessage]);
    setInputValue("");
    setSelectedTags([]); // clear tags after sending
    setShowOptions(false);

    try {
      // Get actual AI response from backend
      const botResponse = await getAIResponse(combinedMessage);
      
      const botMessage: Message = { 
        id: Date.now() + 2, 
        type: "bot", 
        content: botResponse 
      };
      
      // Replace loading message with actual response
      onUpdateMessages([...chat.messages, newUserMessage, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        id: Date.now() + 2, 
        type: "bot", 
        content: "Sorry, I encountered an error. Please try again." 
      };
      onUpdateMessages([...chat.messages, newUserMessage, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full font-sans bg-white">
      {/* Messages */}
      {chat.messages.length > 0 && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {chat.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl ${
                    msg.type === "user"
                      ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none"
                      : msg.type === "bot"
                      ? "bg-purple-100 border border-purple-500 text-gray-900 rounded-bl-none"
                      : "bg-transparent text-gray-500"
                  }`}
                >
                  <p
                    className={msg.type === "loading" ? "italic" : ""}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div
        className="w-full max-w-3xl px-4 mx-auto transition-all duration-500 ease-in-out flex flex-col items-center"
        style={{
          marginTop: chat.messages.length === 0 ? "30vh" : "auto",
          marginBottom: chat.messages.length === 0 ? "0" : "32px",
        }}
      >
        {chat.messages.length === 0 && (
          <div className="mb-4 text-3xl font-semibold text-purple-600 select-none" style={{ marginBottom: "64px" }}>
            Ready when you are.
          </div>
        )}
        <div className="relative w-full">
          <div className="absolute inset-0 rounded-full bg-purple-400/30 shadow-[0_0_15px_8px_rgba(139,92,246,0.3)] pointer-events-none" />
          <div className="relative flex gap-3 items-center bg-white shadow-lg rounded-full px-4 py-3 border border-violet-500 z-10">
            <div className="relative">
              <button
                onClick={() => setShowOptions(prev => !prev)}
                className="h-10 w-10 flex items-center justify-center bg-violet-500 text-white rounded-full hover:bg-violet-600 transition"
                disabled={isLoading}
              >
                <span className="text-3xl leading-none relative -top-0.5">+</span>
              </button>
              {showOptions && (
                <div className="absolute bottom-12 left-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b">
                    Quick Generate Options
                  </div>
                  {predefinedTags.map((msg, idx) => (
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

            {/* Tags + Input */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {selectedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-violet-500 hover:text-violet-700"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </span>
              ))}

              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? "Generating response..." : "Ask me anything..."}
                className="flex-1 bg-transparent text-slate-600 placeholder-slate-400 text-sm outline-none"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              className="h-10 w-10 flex items-center justify-center bg-violet-500 text-white rounded-full hover:bg-violet-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isLoading || !inputValue.trim()}
            >
              <PaperPlaneIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AskAIContent;
