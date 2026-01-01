import { useState, useEffect, useRef } from "react";
import type { Message } from "./ChatPanel";
import { BACKEND_AI_CHAT_ROUTE } from "./BackendURL";

// to use :
// const {
//     chatState,
//     messages,
//     chatInputRef,
//     isVisibleBar,
//     isVisiblePanel,
//     isLoading,
//     handleSendMessage,
//     toggleChatInputBar,
//     handleCloseBar,
//     minimizeChat,
//   } = useChat();

export function useChat() {
    const [chatState, setChatState] = useState<"hidden" | "input-bar" | "full-chat">("hidden");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [isVisibleBar, setIsVisibleBar] = useState(false);
    const [isVisiblePanel, setIsVisiblePanel] = useState(false);

    // Show bar when chatState is 'input-bar'
    useEffect(() => {
        if (chatState === "input-bar") {
            setIsVisibleBar(true);
        }
    }, [chatState]);

    // Load history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("react-chat-history");
            if (saved) setMessages(JSON.parse(saved));
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    }, []);

    // Save history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("react-chat-history", JSON.stringify(messages));
        } catch (error) {
            console.error("Error saving chat history:", error);
        }
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        const newUserMessage: Message = { 
            id: Date.now() + Math.random(), 
            type: "user", 
            content: text 
        };
        const loadingMessage: Message = { 
            id: Date.now() + Math.random(), 
            type: "loading", 
            content: "Thinking..." 
        };

        setChatState("full-chat");
        setIsVisiblePanel(true);
        setIsLoading(true);
        setMessages((prev) => [...prev, newUserMessage, loadingMessage]);

        try {
            // Call your backend AI endpoint
            const response = await fetch(BACKEND_AI_CHAT_ROUTE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_prompt: text,
                    user_task: "analyze",
                    filters: null // You can pass current filters here if needed
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            const botMessage: Message = {
                id: Date.now() + Math.random(),
                type: "bot",
                content: data.insights || data.message || data.data?.content || "I analyzed the data but couldn't generate a response.",
            };
            
            setMessages((prev) => [...prev.filter((m) => m.type !== "loading"), botMessage]);
            
        } catch (error) {
            console.error("Error sending message to backend:", error);
            
            const errorMessage: Message = {
                id: Date.now() + Math.random(),
                type: "bot",
                content: "Sorry, I encountered an error connecting to the backend. Please try again.",
            };
            
            setMessages((prev) => [...prev.filter((m) => m.type !== "loading"), errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleChatInputBar = () => {
        if (chatState === "hidden") {
            setChatState("input-bar");
            setIsVisibleBar(true);
            setTimeout(() => chatInputRef.current?.focus(), 300);
        } else {
            handleCloseBar();
        }
    };

    const handleCloseBar = () => {
        setIsVisibleBar(false);
        setTimeout(() => setChatState("hidden"), 300);
    };

    const minimizeChat = () => {
        setIsVisiblePanel(false);
        setTimeout(() => {
            setChatState("input-bar");
        }, 300);
    };

    return {
        chatState,
        messages,
        chatInputRef,
        isVisibleBar,
        isVisiblePanel,
        isLoading,
        handleSendMessage,
        toggleChatInputBar,
        handleCloseBar,
        minimizeChat,
    };
}
