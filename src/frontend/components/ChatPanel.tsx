import React, { useEffect, useRef } from "react";
import { MinimizeIcon } from "./Icons";

export interface Message {
  id: number;
  type: 'user' | 'bot' | 'loading';
  content: string;
}

export interface ChatPanelProps {
  messages: Message[];
  onMinimize: () => void;
  isVisiblePanel: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onMinimize,
  isVisiblePanel,
}) => {
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 bottom-0 bg-white z-50
        ${isVisiblePanel ? 'animate-slide-up-fade-in' : 'animate-slide-down-fade-out'}`}
    >
      <div className="w-full h-full flex flex-col font-sans">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Chat Assistant</h2>
          <button onClick={onMinimize} className="text-gray-500 hover:text-gray-800">
            <MinimizeIcon />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-6 pb-32 overflow-y-auto">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-2xl ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none'
                      : msg.type === 'bot'
                      ? 'bg-purple-100 border border-purple-500 text-gray-900 rounded-bl-none'
                      : 'bg-transparent text-gray-500'
                  }`}
                >
                  <p
                    className={`${msg.type === 'loading' ? 'italic' : ''} whitespace-pre-wrap`}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
