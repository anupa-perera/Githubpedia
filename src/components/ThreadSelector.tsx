'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatThread } from './ChatInterface';

interface ThreadSelectorProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
  onDeleteThread: (threadId: string) => void;
}

export function ThreadSelector({ 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onCreateThread, 
  onDeleteThread 
}: ThreadSelectorProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active thread
  useEffect(() => {
    if (activeThreadId && scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(`[data-thread-id="${activeThreadId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeThreadId]);

  const handleSpin = () => {
    if (threads.length === 0) return;
    
    setIsSpinning(true);
    
    // Simulate slot machine spin
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * threads.length);
      const randomThread = threads[randomIndex];
      onSelectThread(randomThread.id);
      setIsSpinning(false);
    }, 1500);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Slot Machine Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <div className="flex space-x-2">
            {/* Spin Button - Slot Machine Style */}
            <button
              onClick={handleSpin}
              disabled={threads.length === 0 || isSpinning}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white p-2 rounded-full transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              title="Random thread (Slot Machine)"
            >
              <svg 
                className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* New Thread Button */}
            <button
              onClick={onCreateThread}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
              title="New conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Slot Machine Display */}
        <div className="bg-gray-900 rounded-lg p-3 border-2 border-yellow-500">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    isSpinning 
                      ? 'bg-yellow-400 animate-pulse' 
                      : activeThreadId 
                        ? 'bg-green-400' 
                        : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-yellow-400 text-sm font-mono">
              {isSpinning ? 'SPINNING...' : activeThreadId ? 'ACTIVE' : 'SELECT'}
            </span>
          </div>
        </div>
      </div>

      {/* Thread List - Scrollable like slot machine reels */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 ${
          isSpinning ? 'animate-pulse' : ''
        }`}
      >
        {threads.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-gray-400 mb-2">No conversations yet</div>
            <button
              onClick={onCreateThread}
              className="text-green-400 hover:text-green-300 text-sm underline"
            >
              Start your first conversation
            </button>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                data-thread-id={thread.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  activeThreadId === thread.id
                    ? 'bg-green-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                } ${isSpinning ? 'animate-bounce' : ''}`}
                onClick={() => onSelectThread(thread.id)}
              >
                {/* Thread Content */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-sm">
                      {thread.title}
                    </h3>
                    {thread.repository && (
                      <div className="flex items-center mt-1 text-xs opacity-75">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        <span className="truncate">{thread.repository}</span>
                      </div>
                    )}
                    {thread.lastMessage && (
                      <p className="text-xs opacity-75 mt-1 truncate">
                        {thread.lastMessage}
                      </p>
                    )}
                    <div className="text-xs opacity-50 mt-1">
                      {formatDate(thread.updatedAt)}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(thread.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 rounded hover:bg-red-500 transition-all"
                    title="Delete conversation"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Active Thread Indicator */}
                {activeThreadId === thread.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-r"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slot Machine Footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-900">
        <div className="text-center text-xs text-gray-400">
          🎰 {threads.length} conversations loaded
        </div>
      </div>
    </div>
  );
}