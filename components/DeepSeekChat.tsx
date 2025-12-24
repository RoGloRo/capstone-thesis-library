"use client";

import React, { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

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
  details?: any;
}

const DeepSeekChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch("/api/deepseek-chat", {
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
      setError(err instanceof Error ? err.message : "Failed to send message");
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : "Unknown error"}`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border border-gray-200 rounded-xl bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="w-6 h-6" />
          DeepSeek AI Chat
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          Ask me anything about books, library services, or general questions!
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">Start a conversation!</p>
            <p className="text-sm">Ask me anything and I'll do my best to help.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border"
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (
                    <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  {message.role === "user" && (
                    <User className="w-5 h-5 text-blue-100 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p 
                      className={`text-xs mt-2 ${
                        message.role === "user" ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-sm shadow-sm border max-w-[70%]">
              <div className="flex items-center gap-2 text-gray-600">
                <Bot className="w-5 h-5 text-blue-600" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">DeepSeek is thinking...</span>
              </div>
            </div>
          </div>
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
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Powered by DeepSeek AI via OpenRouter</span>
          <span>{inputMessage.length}/1000</span>
        </div>
      </form>
    </div>
  );
};

export default DeepSeekChat;