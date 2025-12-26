"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminDebugPage() {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Button clicked!');
    setClickCount(prev => prev + 1);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Debug Page</h1>
      <p className="mb-4">Click count: {clickCount}</p>
      
      <div className="space-y-4">
        <Button type="button" onClick={handleClick}>
          Test Button 1
        </Button>
        
        <Button 
          type="button" 
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            alert('Button 2 clicked!');
          }}
        >
          Test Button 2
        </Button>
        
        <button 
          type="button"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => {
            console.log('Native button clicked');
            setClickCount(prev => prev + 10);
          }}
        >
          Native Button
        </button>
      </div>
    </div>
  );
}