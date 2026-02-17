import React from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';

export default function Header() {
  return (
    <div className="bg-white p-4 shadow-sm flex justify-between items-center z-10 border-b border-gray-100">
      <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-yellow-400" /> 
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          EduMind AI
        </span>
      </h1>
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
        <BrainCircuit className="w-4 h-4" />
        <span>Dự án Thi GV Giỏi 25-26</span>
      </div>
    </div>
  );
}