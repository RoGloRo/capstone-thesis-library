"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ApiResponse {
  success: boolean;
  response?: string;
  error?: string;
  model?: string;
}

const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response || "Sorry, I couldn't generate a response.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMsg);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${errorMsg}`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const suggestedPrompts = [
    "What is LiVro AI?",
    "How can I borrow a book?",
    "Recommend me a good book",
    "How do I return a book?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    setInputMessage(suggestion);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Open Smart Library AI Chat"
        >
          <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
          
          {/* Notification Badge (if there are unread messages - you can implement this logic) */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">AI</span>
          </div>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl transition-all duration-300 overflow-hidden",
          isMinimized ? "w-80 h-16" : "w-80 sm:w-96 h-[500px] sm:h-[600px]"
        )}>
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">LiVro</h3>
                {!isMinimized && (
                  <p className="text-emerald-100 text-xs">Your Intelligent Assistant Bro!</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 max-h-80 sm:max-h-96">
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <Bot className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Welcome wormies! I'm LiVro
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Ask me anything about books or library services!
                    </p>
                    
                    {/* Suggested prompts */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">Try these suggestions:</p>
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(prompt)}
                          className="block w-full p-2 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-xs text-gray-900 dark:text-gray-100"
                          disabled={isLoading}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.role === "assistant" && (
                              <Bot className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            )}
                            {message.role === "user" && (
                              <User className="w-4 h-4 text-emerald-100 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <p 
                                className={`text-[10px] mt-1 ${
                                  message.role === "user" ? "text-emerald-100" : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-700 max-w-[80%]">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Bot className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 p-2">
                  <p className="text-red-700 dark:text-red-300 text-xs">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}

              {/* Clear Chat Button */}
              {messages.length > 0 && (
                <div className="px-4 pb-2">
                  <button
                    onClick={clearChat}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Clear conversation
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={sendMessage} className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent resize-none text-sm max-h-20"
                    disabled={isLoading}
                    maxLength={1000}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  <span>Powered by Smart Library AI</span>
                  <span>{inputMessage.length}/1000</span>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChat;