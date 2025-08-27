'use client';

import { useEffect, useState } from 'react';

import { MessageRenderer } from './MessageRenderer';

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMessage({
  content,
  isStreaming = false,
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // For streaming, just show the content as it comes in real-time
    setDisplayedContent(content);
  }, [content, isStreaming]);

  return (
    <div className="whitespace-pre-wrap">
      <MessageRenderer content={displayedContent} />
      {isStreaming && (
        <span className="animate-pulse text-gray-400 ml-1">▌</span>
      )}
    </div>
  );
}
