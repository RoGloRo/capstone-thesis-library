import GitHubModelsChat from "@/components/GitHubModelsChat";
import React from "react";

export default function Page() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Library AI</h1>
        <p className="text-gray-600">
          Your intelligent library assistant powered by AI
        </p>
      </div>
      
      {/* GitHub Models Chat Interface */}
      <div className="space-y-4">
        <GitHubModelsChat />
      </div>
    </div>
  );
}