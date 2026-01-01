import React, { useState, useEffect } from "react";
import AskAISideBar from "./AskAISideBar";
import AskAIContent from "./AskAIContent";
import type { Chat, Message } from "./AskAIContent";

// Fixed: Use a direct URL or a conditional approach for process.env
const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL 
  : "http://localhost:3001";

const AskAIChatContainer: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load chat history from backend
  const loadChatHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/chat-history`);
      if (!response.ok) {
        throw new Error("Failed to fetch chat history");
      }
      const chatHistory = await response.json();
      setChats(chatHistory);
      
      if (chatHistory.length > 0) {
        setActiveChatId(chatHistory[0].id);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new chat
  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      const newChat = {
        title: "New Chat",
        messages: [],
      };

      const response = await fetch(`${API_BASE_URL}/ai/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newChat),
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const createdChat = await response.json();
      setChats(prev => [...prev, createdChat]);
      setActiveChatId(createdChat.id);
      
    } catch (error) {
      console.error("Error creating new chat:", error);
      alert("Failed to create new chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
  };

  const handleDeleteChat = (chatId: number) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(chats.length > 1 ? chats[0].id : null);
    }
  };

  const handleUpdateMessages = (chatId: number, messages: Message[]) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, messages } : chat
    ));
  };

  const handleFirstMessage = (chatId: number, message: string) => {
    // Update chat title based on first message
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title: message.slice(0, 30) + '...' } : chat
    ));
  };

  // Load chats on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Fixed: Handle case where there are no chats
  const activeChat = chats.find(chat => chat.id === activeChatId) || 
    (chats.length > 0 ? chats[0] : null);

  return (
    <div className="flex h-full">
      <AskAISideBar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isLoading={isLoading}
      />
      
      <div className="flex-1">
        {activeChat ? (
          <AskAIContent
            chat={activeChat}
            onUpdateMessages={(messages) => handleUpdateMessages(activeChat.id, messages)}
            onFirstMessage={(msg) => handleFirstMessage(activeChat.id, msg)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <button 
              onClick={handleNewChat}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
            >
              Create New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskAIChatContainer;
