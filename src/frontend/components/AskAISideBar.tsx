import React from "react";
import type { Chat } from "./AskAIContent";

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: number | null;
  onSelectChat: (id: number) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: number) => void;
  isLoading?: boolean;
}

// Fixed: Use a direct URL or a conditional approach for process.env
const API_BASE_URL = typeof process !== 'undefined' && process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL 
  : "http://localhost:3001";

const AskAISideBar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isLoading = false,
}) => {
  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chats/${chatId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }
      
      // Notify parent component that chat was deleted
      onDeleteChat(chatId);
      
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  return (
    <div className="w-64 bg-gray-100 border-r p-3 flex flex-col">
      <button
        onClick={onNewChat}
        disabled={isLoading}
        className="mb-4 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading..." : "+ New Chat"}
      </button>

      <div className="flex-1 overflow-y-auto">
        {chats
          .filter(chat => chat.messages.length > 0)
          .map((chat) => (
            <div
              key={chat.id}
              className={`cursor-pointer p-2 rounded mb-1 group relative ${
                chat.id === activeChatId
                  ? "bg-purple-200 font-semibold"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="truncate pr-6">
                {chat.title}
              </div>
              
              {/* Delete button - appears on hover */}
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 
                         opacity-0 group-hover:opacity-100 transition-opacity
                         text-red-500 hover:text-red-700 text-lg font-bold"
                title="Delete chat"
                disabled={isLoading}
              >
                ×
              </button>
            </div>
          ))}
      </div>

      {chats.filter(chat => chat.messages.length > 0).length === 0 && (
        <div className="text-gray-500 text-center py-4">
          No chats yet. Start a new conversation!
        </div>
      )}
    </div>
  );
};

export default AskAISideBar;
