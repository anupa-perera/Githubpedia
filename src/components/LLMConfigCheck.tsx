'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface LLMConfigStatus {
  configured: boolean;
  provider?: string;
  model?: string;
  configuredAt?: string;
}

interface LLMConfigCheckProps {
  children: React.ReactNode;
}

export default function LLMConfigCheck({ children }: LLMConfigCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [configStatus, setConfigStatus] = useState<LLMConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnSetupPage, setIsOnSetupPage] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnSetupPage(
        window.location.pathname === '/llm-setup' || 
        window.location.pathname.startsWith('/auth/')
      );
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      checkLLMConfig();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const checkLLMConfig = async () => {
    try {
      const response = await fetch('/api/llm-setup');
      const data = await response.json();
      setConfigStatus(data);
    } catch (error) {
      console.error('Failed to check LLM config:', error);
      setConfigStatus({ configured: false });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-900">Loading...</div>
      </div>
    );
  }

  // If user is authenticated but LLM is not configured, redirect to setup
  if (session && configStatus && !configStatus.configured && !isOnSetupPage) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              LLM Configuration Required
            </h2>
            <p className="text-gray-600 mb-6">
              To use GitHub Developer Wiki, you need to configure your AI provider first.
            </p>
            <button
              onClick={() => router.push('/llm-setup')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Configure LLM Provider
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If configured or not authenticated, render children
  return <>{children}</>;
}