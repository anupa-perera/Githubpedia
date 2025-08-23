'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatThread } from './ChatInterface';

import { RepositoryInput } from './RepositoryInput';
import { RepositoryInfo } from './RepositoryInfo';
import { MessageRenderer } from './MessageRenderer';
import { Repository } from '@/types/github';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  repository?: string;
}

interface ChatWindowProps {
  thread: ChatThread;
  onUpdateThread: (updates: Partial<ChatThread>) => void;
  llmConfigured: boolean;
  onShowLLMSetup: () => void;
}

interface RepositoryData extends Repository {
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  default_branch?: string;
  topics?: string[];
}

export function ChatWindow({ thread, onUpdateThread, llmConfigured, onShowLLMSetup }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const [repositoryData, setRepositoryData] = useState<RepositoryData | null>(null);
  const [, setRepositoryUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for this thread
  useEffect(() => {
    const savedMessages = localStorage.getItem(`messages-${thread.id}`);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages).map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(parsedMessages);
    }
  }, [thread.id]);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`messages-${thread.id}`, JSON.stringify(messages));
    }
  }, [messages, thread.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleRepositorySubmit = async (url: string) => {
    setIsLoadingRepo(true);
    setRepoError('');

    try {
      const response = await fetch(`/api/repositories?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository information');
      }

      setRepositoryData(data);
      setRepositoryUrl(url);

      const repoName = data.full_name;
      onUpdateThread({
        repository: repoName,
        title: `Chat about ${repoName}`
      });

      // Add system message
      const systemMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `🎯 Repository set to **${repoName}**. Repository information loaded successfully! You can now ask questions about this repository.`,
        timestamp: new Date(),
        repository: repoName,
      };
      setMessages(prev => [...prev, systemMessage]);

    } catch (error) {
      console.error('Error fetching repository:', error);
      setRepoError(error instanceof Error ? error.message : 'Failed to fetch repository information');
    } finally {
      setIsLoadingRepo(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!llmConfigured) {
      onShowLLMSetup();
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      repository: thread.repository,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Update thread with last message
    onUpdateThread({
      lastMessage: input.trim(),
      updatedAt: new Date()
    });

    try {
      // Make actual API call to query processing
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryUrl: `https://github.com/${thread.repository}`,
          query: input.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process query');
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.response || 'No response generated',
        timestamp: new Date(),
        repository: thread.repository,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to process your question'}. Please try again.`,
        timestamp: new Date(),
        repository: thread.repository,
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Repository Setup */}
      {!thread.repository && (
        <div className="bg-gray-800 border-b border-gray-700 p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">Explore a GitHub Repository</h2>
            <p className="text-gray-400">Enter a GitHub repository URL to start exploring and asking questions</p>
          </div>
          <RepositoryInput
            onRepositorySubmit={handleRepositorySubmit}
            isLoading={isLoadingRepo}
            error={repoError}
          />
        </div>
      )}

      {/* Repository Info - Compact */}
      {thread.repository && repositoryData && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <RepositoryInfo repository={repositoryData} />
          <div className="text-center mt-1">
            <button
              onClick={() => {
                onUpdateThread({ repository: undefined, title: 'New Conversation' });
                setMessages([]);
                setRepositoryData(null);
                setRepositoryUrl('');
              }}
              className="text-gray-500 hover:text-gray-300 text-xs underline"
            >
              Change Repository
            </button>
          </div>
        </div>
      )}

      {/* Fallback for repository without detailed data */}
      {thread.repository && !repositoryData && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{thread.repository}</span>
            </div>
            <button
              onClick={() => {
                onUpdateThread({ repository: undefined, title: 'New Conversation' });
                setMessages([]);
                setRepositoryData(null);
                setRepositoryUrl('');
              }}
              className="text-gray-400 hover:text-white text-sm"
            >
              Change Repository
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>Start a conversation by asking a question about the repository</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-4xl px-4 py-3 rounded-lg ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
                  }`}
              >
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <MessageRenderer content={message.content} />
                )}
                <div className="text-xs opacity-70 mt-2 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        {!llmConfigured && (
          <div className="bg-yellow-900 border border-yellow-700 rounded-md p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-200 text-sm">AI provider not configured</span>
              </div>
              <button
                onClick={onShowLLMSetup}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Setup Now
              </button>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !thread.repository
                ? "Set a repository first to start asking questions..."
                : !llmConfigured
                  ? "Configure your AI provider to start chatting..."
                  : "Ask a question about the repository..."
            }
            disabled={!thread.repository || !llmConfigured}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !thread.repository || !llmConfigured || isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors self-end"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}