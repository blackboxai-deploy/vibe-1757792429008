'use client';

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '@/lib/gameEngine';
import { GAME_CONFIG } from '@/lib/gameConfig';

export default function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = GAME_CONFIG.canvas.width;
    canvas.height = GAME_CONFIG.canvas.height;

    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas);
    gameEngineRef.current.start();

    // Set initial high score
    setHighScore(gameEngineRef.current.getHighScore());

    // Score update interval
    const scoreInterval = setInterval(() => {
      if (gameEngineRef.current) {
        setScore(gameEngineRef.current.getScore());
        setHighScore(gameEngineRef.current.getHighScore());
      }
    }, 100);

    // Cleanup
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.stop();
      }
      clearInterval(scoreInterval);
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Note: Audio manager muting would be implemented here
    // audioManager.setMuted(!isMuted);
  };

  const handleCanvasClick = () => {
    // Focus canvas for keyboard events
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Game Stats */}
      <div className="flex justify-between w-full max-w-2xl px-4 text-sm text-gray-600">
        <div className="flex space-x-4">
          <span>Score: {score.toString().padStart(5, '0')}</span>
          <span>High: {highScore.toString().padStart(5, '0')}</span>
        </div>
        <button
          onClick={toggleMute}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Game Canvas */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
        <canvas
          ref={canvasRef}
          className="block cursor-pointer focus:outline-none"
          onClick={handleCanvasClick}
          tabIndex={0}
          style={{
            imageRendering: 'pixelated',
          }}
        />
        
        {/* Mobile touch overlay */}
        <div className="absolute inset-0 md:hidden">
          <div className="h-full w-full flex">
            <div 
              className="flex-1 flex items-center justify-center text-gray-400 text-xs"
              onTouchStart={(e) => {
                e.preventDefault();
                // Trigger jump
                const event = new KeyboardEvent('keydown', { code: 'Space' });
                window.dispatchEvent(event);
              }}
            >
              TAP TO JUMP
            </div>
            <div 
              className="w-20 flex items-center justify-center text-gray-400 text-xs"
              onTouchStart={(e) => {
                e.preventDefault();
                // Trigger duck
                const event = new KeyboardEvent('keydown', { code: 'ArrowDown' });
                window.dispatchEvent(event);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                // Release duck
                const event = new KeyboardEvent('keyup', { code: 'ArrowDown' });
                window.dispatchEvent(event);
              }}
            >
              DUCK
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center space-y-2 max-w-md">
        <div className="text-sm text-gray-600">
          <div className="hidden md:block">
            <strong>Desktop:</strong> SPACE to jump • DOWN arrow to duck
          </div>
          <div className="md:hidden">
            <strong>Mobile:</strong> Tap left side to jump • Hold right side to duck
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Avoid cacti and flying birds to survive as long as possible!
        </div>
      </div>

      {/* Performance Info */}
      <div className="text-xs text-gray-400 text-center">
        Canvas size: {GAME_CONFIG.canvas.width} × {GAME_CONFIG.canvas.height}px
        <br />
        Optimized for 60fps gameplay
      </div>
    </div>
  );
}