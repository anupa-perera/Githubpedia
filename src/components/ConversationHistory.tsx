'use client';

import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  repository?: string;
}

interface ConversationHistoryProps {
  messages: Message[];
  onClearHistory: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export function ConversationHistory({
  messages,
  onClearHistory,
  isVisible,
  onToggle,
}: ConversationHistoryProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearHistory = () => {
    if (showClearConfirm) {
      onClearHistory();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors relative"
        title="Show conversation history"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {messages.length > 0 && (
          <div
            className={`absolute -top-1 -right-1 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ${
              messages.length > 10 ? 'bg-gray-500' : 'bg-gray-600'
            }`}
          >
            {messages.length > 99 ? '99+' : messages.length}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-80 bg-gray-800 border-l border-gray-700 z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Conversation History
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white transition-colors"
          title="Hide history"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-gray-700/50 border-l-2 border-gray-400'
                  : 'bg-gray-600/50 border-l-2 border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      message.role === 'user' ? 'bg-gray-400' : 'bg-gray-300'
                    }`}
                  ></div>
                  <span className="text-xs text-gray-400 font-medium">
                    {message.role === 'user' ? 'You' : 'Assistant'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {truncateContent(message.content)}
              </p>
              {message.repository && (
                <div className="mt-2 text-xs text-gray-500">
                  📁 {message.repository}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleClearHistory}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                showClearConfirm
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {showClearConfirm ? 'Confirm Clear' : 'Clear History'}
            </button>
          </div>
          {showClearConfirm && (
            <p className="text-xs text-red-400 mt-1">
              Click again to permanently delete all messages
            </p>
          )}
        </div>
      )}
    </div>
  );
}
