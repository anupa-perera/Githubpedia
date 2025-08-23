'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ThreadSelector } from './ThreadSelector';
import { ChatWindow } from './ChatWindow';
import { LLMSetup } from './LLMSetup';
import { LLMSwitcher } from './LLMSwitcher';

export interface ChatThread {
  id: string;
  title: string;
  repository?: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export function ChatInterface() {
  const { data: session } = useSession();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showLLMSetup, setShowLLMSetup] = useState(false);
  const [llmConfigured, setLLMConfigured] = useState(false);

  // Load threads from localStorage on mount
  useEffect(() => {
    const savedThreads = localStorage.getItem('chat-threads');
    if (savedThreads) {
      const parsedThreads = JSON.parse(savedThreads).map((thread: ChatThread) => ({
        ...thread,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.updatedAt),
      }));
      setThreads(parsedThreads);
    }

    // Check if LLM is configured via API
    checkLLMConfig();
  }, []);

  const checkLLMConfig = async () => {
    try {
      const response = await fetch('/api/llm-setup');
      const data = await response.json();
      setLLMConfigured(data.configured || false);
    } catch (error) {
      console.error('Failed to check LLM config:', error);
      setLLMConfigured(false);
    }
  };

  // Save threads to localStorage whenever threads change
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('chat-threads', JSON.stringify(threads));
    }
  }, [threads]);

  const createNewThread = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setThreads(prev => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
  };

  const updateThread = (threadId: string, updates: Partial<ChatThread>) => {
    setThreads(prev => prev.map(thread =>
      thread.id === threadId
        ? { ...thread, ...updates, updatedAt: new Date() }
        : thread
    ));
  };

  const deleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(thread => thread.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  };

  const activeThread = threads.find(thread => thread.id === activeThreadId);

  if (showLLMSetup) {
    return (
      <LLMSetup
        onComplete={() => {
          setLLMConfigured(true);
          setShowLLMSetup(false);
          checkLLMConfig(); // Refresh the config status
        }}
        onCancel={() => setShowLLMSetup(false)}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg
              className="w-8 h-8 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            <h1 className="text-xl font-bold text-white">GitHub Developer Wiki</h1>
          </div>

          <div className="flex items-center space-x-4">
            {!llmConfigured && (
              <button
                onClick={() => setShowLLMSetup(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Setup AI Provider
              </button>
            )}

            {llmConfigured && (
              <LLMSwitcher
                onProviderChange={(provider, model) => {
                  console.log(`Switched to ${provider} with model ${model}`);
                  // You can add additional logic here if needed
                }}
              />
            )}

            {llmConfigured && (
              <button
                onClick={() => setShowLLMSetup(true)}
                className="text-gray-400 hover:text-white transition-colors"
                title="LLM Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}

            <div className="flex items-center space-x-2 text-gray-300">
              <img
                src={session?.user?.image || ''}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm">{session?.user?.name}</span>
            </div>

            <button
              onClick={() => signOut()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Thread Selector - Slot Machine Style */}
        <div className="w-80 bg-gray-800 border-r border-gray-700">
          <ThreadSelector
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
            onCreateThread={createNewThread}
            onDeleteThread={deleteThread}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {activeThread ? (
            <ChatWindow
              thread={activeThread}
              onUpdateThread={(updates) => updateThread(activeThread.id, updates)}
              llmConfigured={llmConfigured}
              onShowLLMSetup={() => setShowLLMSetup(true)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No conversation selected</h3>
                <p className="text-gray-400 mb-4">Choose a thread from the slot machine or create a new one</p>
                <button
                  onClick={createNewThread}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}