import GitHubModelsChat from "@/components/GitHubModelsChat";
import { MessageSquare, Sparkles, BookOpen, Users } from "lucide-react";
import React from "react";

export default function Page() {
  return (
    <main className="root-container">
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">LiVro</h1>
          <p className="text-gray-100 mb-4">
            (Library Virtual Robot Assistant)
          </p>
          
          {/* Feature highlight */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Now Available Everywhere!</span>
            </div>
            <p className="text-emerald-200 text-sm">
              Smart Library AI is now accessible from any page using the floating chat button in the bottom-right corner. 
              Your conversations persist as you navigate through the library.
            </p>
          </div>

          {/* AI Capabilities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Book Recommendations</h3>
              <p className="text-gray-300 text-sm">Get personalized book suggestions based on your preferences</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Library Assistance</h3>
              <p className="text-gray-300 text-sm">Ask questions about library services and policies</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold mb-1">Account Help</h3>
              <p className="text-gray-300 text-sm">Get help with borrowing, returns, and account management</p>
            </div>
          </div>
        </div>
        
        {/* Full-screen Chat Interface */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Full-Screen Chat Experience</h2>
            <p className="text-gray-300 text-sm">
              Use this expanded interface for longer conversations or when you need more screen space.
            </p>
          </div>
          <GitHubModelsChat />
        </div>
      </div>
    </main>
  );
}