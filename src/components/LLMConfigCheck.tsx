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
  const [configStatus, setConfigStatus] = useState<LLMConfigStatus | null>(
    null
  );
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
    router.push('/llm-setup');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-lg text-white">Redirecting to LLM setup...</div>
      </div>
    );
  }

  // If configured or not authenticated, render children
  return <>{children}</>;
}
