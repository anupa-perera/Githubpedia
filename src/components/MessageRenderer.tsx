'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Map common language aliases to supported languages
  const normalizeLanguage = (lang?: string): string => {
    if (!lang) return 'text';
    
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'jsx': 'javascript',
      'tsx': 'typescript'
    };
    
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const normalizedLanguage = normalizeLanguage(language);

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-t-md border-b border-gray-600">
        <span className="text-xs text-gray-400 font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-900 rounded-b-md overflow-x-auto">
        <SyntaxHighlighter
          language={normalizedLanguage}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '12px',
            background: 'transparent',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          showLineNumbers={code.split('\n').length > 5}
          lineNumberStyle={{
            color: '#6b7280',
            fontSize: '12px',
            paddingRight: '12px',
            minWidth: '2em'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  );
}

export function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  // Parse markdown-like content
  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Find code blocks (```language\ncode\n```)
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        parts.push(...parseInlineElements(beforeText));
      }

      // Add code block
      const language = match[1];
      const code = match[2];
      parts.push(
        <CodeBlock
          key={`code-${match.index}`}
          code={code}
          language={language}
        />
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(...parseInlineElements(remainingText));
    }

    return parts;
  };

  const parseInlineElements = (text: string) => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Find inline code (`code`)
    const inlineCodeRegex = /`([^`]+)`/g;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > currentIndex) {
        const beforeText = text.slice(currentIndex, match.index);
        parts.push(...parseBasicFormatting(beforeText));
      }

      // Add inline code
      parts.push(
        <InlineCode key={`inline-${match.index}`}>
          {match[1]}
        </InlineCode>
      );

      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(...parseBasicFormatting(remainingText));
    }

    return parts;
  };

  const parseBasicFormatting = (text: string) => {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        parts.push(<br key={`br-${lineIndex}`} />);
      }

      // Parse URLs and file paths
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const filePathRegex = /(\w+\/[\w\/.-]+\.\w+)/g;
      
      let urlMatch: RegExpExecArray | null;
      let fileMatch: RegExpExecArray | null;
      const specialParts: { index: number; length: number; element: React.ReactNode }[] = [];

      // Find URLs
      while ((urlMatch = urlRegex.exec(line)) !== null) {
        specialParts.push({
          index: urlMatch.index,
          length: urlMatch[0].length,
          element: (
            <a
              key={`url-${lineIndex}-${urlMatch.index}`}
              href={urlMatch[1]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {urlMatch[1]}
            </a>
          )
        });
      }

      // Find file paths (only if no URLs overlap)
      while ((fileMatch = filePathRegex.exec(line)) !== null) {
        const overlaps = specialParts.some(part => 
          fileMatch!.index < part.index + part.length && 
          fileMatch!.index + fileMatch![0].length > part.index
        );
        
        if (!overlaps) {
          specialParts.push({
            index: fileMatch.index,
            length: fileMatch[0].length,
            element: (
              <span
                key={`file-${lineIndex}-${fileMatch.index}`}
                className="bg-gray-800 text-blue-400 px-1.5 py-0.5 rounded text-sm font-mono"
              >
                {fileMatch[1]}
              </span>
            )
          });
        }
      }

      // Sort by index
      specialParts.sort((a, b) => a.index - b.index);

      // Build the line with special elements
      if (specialParts.length > 0) {
        let lastIndex = 0;
        specialParts.forEach(part => {
          // Add text before special element
          if (part.index > lastIndex) {
            parts.push(line.slice(lastIndex, part.index));
          }
          // Add special element
          parts.push(part.element);
          lastIndex = part.index + part.length;
        });
        // Add remaining text
        if (lastIndex < line.length) {
          parts.push(line.slice(lastIndex));
        }
      } else {
        // Parse bold (**text**)
        const boldRegex = /\*\*(.*?)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(line)) !== null) {
          // Add text before bold
          if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index));
          }

          // Add bold text
          parts.push(
            <strong key={`bold-${lineIndex}-${match.index}`} className="font-semibold">
              {match[1]}
            </strong>
          );

          lastIndex = match.index + match[0].length;
        }

        // Add remaining text
        if (lastIndex < line.length) {
          parts.push(line.slice(lastIndex));
        }
      }
    });

    return parts;
  };

  const renderedContent = parseContent(content);

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      {renderedContent.map((part, index) => (
        <span key={index}>{part}</span>
      ))}
    </div>
  );
}