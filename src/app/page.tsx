'use client';

import DinoGame from '@/components/DinoGame';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-4xl w-full border-4 border-emerald-400">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
            🦕 Dino Adventure
          </h1>
          <p className="text-lg text-gray-700 font-semibold">Jump over cacti, duck under birds!</p>
          <div className="flex justify-center space-x-4 mt-2">
            <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">🚀 Slower Speed</span>
            <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-bold">🎨 Colorful Graphics</span>
            <span className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-bold">✨ Enhanced Sprites</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <DinoGame />
        </div>
        
        <div className="text-center mt-6 space-y-2">
          <div className="bg-gradient-to-r from-emerald-100 to-blue-100 rounded-lg p-4">
            <p className="text-lg font-semibold text-gray-800 mb-2">🎮 Game Controls</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p className="text-green-700"><strong>Desktop:</strong> SPACE to jump • DOWN arrow to duck</p>
              <p className="text-blue-700"><strong>Mobile:</strong> Tap to jump • Hold right side to duck</p>
            </div>
          </div>
          <p className="text-gray-600 font-medium">🌟 Survive as long as possible and beat your high score!</p>
        </div>
      </div>
    </div>
  );
}