'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import LLMConfigCheck from './LLMConfigCheck';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LLMConfigCheck>{children}</LLMConfigCheck>
    </SessionProvider>
  );
}