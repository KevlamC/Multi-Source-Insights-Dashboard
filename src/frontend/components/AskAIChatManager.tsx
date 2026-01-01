import React, { useState, useEffect } from "react";
import AskAIContent from "./AskAIContent";
import AskAISideBar from "./AskAISideBar";
import type { Chat, Message } from "./AskAIContent";

const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL 
  : "http://localhost:3001";

const AskAIChatManager: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load chat history from backend
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/chat-history`);
        
        if (response.ok) {
          const userChats = await response.json();
          setChats(userChats);
          
          if (userChats.length > 0) {
            setActiveChatId(userChats[0].id);
          } else {
            handleNewChat();
          }
        } else {
          // Fallback to empty chat if backend fails
          handleNewChat();
        }
      } catch (error) {
        console.error('Failed to load chat history, using fallback', error);
        handleNewChat();
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, []);

  const handleUpdateMessages = async (chatId: number, updatedMessages: Message[]) => {
    try {
      // Update local state first
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId
            ? {
                ...chat,
                messages: updatedMessages,
                title: updatedMessages.length > 0 ? 
                  updatedMessages[0].content.slice(0, 25) + (updatedMessages[0].content.length > 25 ? '...' : '') : 
                  chat.title,
              }
            : chat
        )
      );

      // Save to backend
      const response = await fetch(`${API_BASE_URL}/ai/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save chat to backend');
      }
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  const handleNewChat = () => {
    const newChat: Chat = { 
      id: Date.now(), 
      title: "New Chat", 
      messages: [] 
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      // Optimistic update
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      if (activeChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setActiveChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }

      // Delete from backend
      const response = await fetch(`${API_BASE_URL}/ai/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete chat from backend');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  if (isLoading) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-50 flex font-sans">
      <AskAISideBar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isLoading={isLoading}
      />
      <div className="flex-1">
        {activeChat ? (
          <AskAIContent
            chat={activeChat}
            onUpdateMessages={msgs => handleUpdateMessages(activeChat.id, msgs)}
            onFirstMessage={msg => console.log("First message:", msg)}
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

export default AskAIChatManager;
