"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";

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

const GitHubModelsChat: React.FC = () => {
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
    "What is Smart Library AI?",
    "How can I use Smart Library AI?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    setInputMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-[700px] max-w-4xl mx-auto border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Smart Library AI
          </h2>
          <p className="text-emerald-100 text-sm mt-1">
            Your Intelligent Library Assistant
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
          >
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="text-center mt-8">
            <Bot className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              Welcome to Smart Library AI
            </h3>
            <p className="text-gray-500 mb-6">
              Ask me anything about books, library services, or get recommendations!
            </p>
            
            {/* Suggested prompts */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm text-gray-600 mb-3">Try these suggestions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-sm"
                    disabled={isLoading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
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
                  className={`max-w-[75%] p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-emerald-800 to-emerald-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.role === "assistant" && (
                      <Bot className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                    )}
                    {message.role === "user" && (
                      <User className="w-5 h-5 text-emerald-100 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p 
                        className={`text-xs mt-2 ${
                          message.role === "user" ? "text-green-100" : "text-gray-500"
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
                <div className="bg-white p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-200 max-w-[75%]">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Bot className="w-5 h-5 text-emerald-700" />
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Smart Library AI is thinking...</span>
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
        <div className="bg-red-50 border-t border-red-200 p-3">
          <p className="text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here... (Press Shift+Enter for new line)"
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none min-h-[48px] max-h-32"
            disabled={isLoading}
            maxLength={2000}
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
            className="px-4 py-3 bg-gradient-to-r from-emerald-800 to-emerald-600 text-white rounded-xl hover:from-emerald-900 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 min-w-[80px] justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Powered by Smart Library AI</span>
          <span>{inputMessage.length}/2000</span>
        </div>
      </form>
    </div>
  );
};

export default GitHubModelsChat;