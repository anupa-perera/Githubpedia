/**
 * Query Service - Handles LangChain orchestration for GitHub repository queries
 * Uses functional programming approach with multi-provider LLM support
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LLMProvider } from '@/types/llm';
import { CodeReference } from '@/types/github';
import { getRepositoryContext, GitHubConfig } from './mcpService';

export interface GitHubRepo {
  owner: string;
  repo: string;
}

export interface QueryContext {
  repository: GitHubRepo;
  query: string;
  githubToken: string;
  llmConfig: {
    provider: LLMProvider;
    apiKey: string;
    model: string;
    baseUrl?: string;
  };
}

export interface QueryResult {
  success: boolean;
  response?: string;
  sources?: string[];
  codeReferences?: CodeReference[];
  error?: string;
}

/**
 * Main query processing function using enhanced MCP service
 */
export async function processQuery(context: QueryContext): Promise<QueryResult> {
  try {
    // Initialize LLM based on provider
    const llm = createLLM(context.llmConfig);
    
    // Get comprehensive repository context using GitHub API service
    const githubConfig: GitHubConfig = { token: context.githubToken };
    const repositoryContext = await getRepositoryContext(
      context.repository.owner,
      context.repository.repo,
      context.query,
      githubConfig
    );

    if (repositoryContext.error) {
      return {
        success: false,
        error: `Failed to fetch repository data: ${repositoryContext.error}`
      };
    }

    // Generate response using LLM with comprehensive repository context
    const response = await generateResponseWithContext(
      context.query,
      context.repository,
      repositoryContext,
      llm
    );

    return {
      success: true,
      response: response.answer,
      sources: response.sources,
      codeReferences: response.codeReferences
    };

  } catch (error) {
    console.error('Query processing failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      // MCP server errors
      if (error.message.includes('Remote MCP server')) {
        return {
          success: false,
          error: 'GitHub MCP server is currently unavailable. Please try again in a few minutes.'
        };
      }
      
      // GitHub rate limit errors (from MCP server)
      if (error.message.includes('rate limit') || error.message.includes('403')) {
        return {
          success: false,
          error: 'GitHub rate limit exceeded. Please wait a few minutes before trying again.'
        };
      }
      
      // Network connectivity errors
      if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        return {
          success: false,
          error: 'Network error occurred. Please check your internet connection and try again.'
        };
      }
      
      // Repository access errors
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return {
          success: false,
          error: 'Repository not found or not accessible. Please check the repository URL and your permissions.'
        };
      }
      
      // LLM provider errors
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return {
          success: false,
          error: 'AI provider authentication failed. Please check your API key configuration.'
        };
      }
      
      // Generic error with helpful message
      return {
        success: false,
        error: `Query processing failed: ${error.message}. Please try again or contact support if the issue persists.`
      };
    }
    
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Create LLM instance based on provider configuration
 */
function createLLM(config: QueryContext['llmConfig']): BaseChatModel {
  switch (config.provider) {
    case 'openai':
      return new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: 0.1,
      });
    
    case 'anthropic':
      return new ChatAnthropic({
        apiKey: config.apiKey,
        model: config.model,
        temperature: 0.1,
      });
    
    case 'openrouter':
      return new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        configuration: {
          baseURL: config.baseUrl || 'https://openrouter.ai/api/v1',
        },
        temperature: 0.1,
      });
    
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

// Removed redundant functions - now using enhanced MCP service directly

/**
 * Generate response using LLM with enhanced repository context
 */
async function generateResponseWithContext(
  query: string,
  repository: GitHubRepo,
  repositoryContext: {
    readme?: string;
    codeFiles: Array<{ path: string; content: string; relevance: string }>;
    structure?: unknown;
    error?: string;
  },
  llm: BaseChatModel
): Promise<{
  answer: string;
  sources: string[];
  codeReferences: CodeReference[];
}> {
  const hasReadme = repositoryContext.readme && repositoryContext.readme.length > 0;
  const hasCodeFiles = repositoryContext.codeFiles && repositoryContext.codeFiles.length > 0;
  const hasStructure = repositoryContext.structure;

  let systemPrompt = `You are an expert software developer and code analyst. You help users understand GitHub repositories by analyzing their code, structure, and documentation.

You are analyzing the repository "${repository.owner}/${repository.repo}".`;

  if (hasReadme || hasCodeFiles || hasStructure) {
    systemPrompt += `

Available repository data:`;

    if (hasReadme) {
      systemPrompt += `

README.md content:
${repositoryContext.readme}`;
    }

    if (hasCodeFiles) {
      systemPrompt += `

Code files found (${repositoryContext.codeFiles.length} files):`;
      repositoryContext.codeFiles.forEach((file, index) => {
        systemPrompt += `

File ${index + 1}: ${file.path}
Relevance: ${file.relevance}
Content preview:
\`\`\`
${file.content.substring(0, 2000)}${file.content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\``;
      });
    }

    if (hasStructure) {
      systemPrompt += `

Repository structure:
${JSON.stringify(repositoryContext.structure, null, 2)}`;
    }

    systemPrompt += `

When answering:
1. Reference specific files and line numbers when relevant
2. Include code snippets to illustrate points
3. Explain the architecture and design patterns used
4. Provide context about how different parts work together
5. Be specific about file paths and code locations
6. Use the actual code content to provide accurate answers

Format your response clearly with markdown formatting for code blocks and file references.`;
  } else {
    systemPrompt += `

Note: Limited repository data is available. You should:
1. Acknowledge the data limitations
2. Provide general guidance based on the repository name and common patterns
3. Suggest specific files or areas the user might want to explore
4. Offer to help with more specific questions once more data is available

Be honest about limitations while still being helpful.`;
  }

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Question about ${repository.owner}/${repository.repo}: ${query}`)
  ]);

  // Extract sources and code references from the repository context
  const sources: string[] = [];
  const codeReferences: CodeReference[] = [];

  // Add repository URL as primary source
  sources.push(`https://github.com/${repository.owner}/${repository.repo}`);

  // Add README as source if available
  if (hasReadme) {
    sources.push(`https://github.com/${repository.owner}/${repository.repo}/blob/main/README.md`);
  }

  // Add code files as sources and references
  if (hasCodeFiles) {
    repositoryContext.codeFiles.forEach((file) => {
      const fileUrl = `https://github.com/${repository.owner}/${repository.repo}/blob/main/${file.path}`;
      sources.push(fileUrl);
      
      // Create code reference
      const lines = file.content.split('\n');
      codeReferences.push({
        file: file.path,
        startLine: 1,
        endLine: Math.min(100, lines.length), // Limit to first 100 lines
        content: lines.slice(0, 100).join('\n'),
        url: fileUrl
      });
    });
  }

  return {
    answer: response.content as string,
    sources: [...new Set(sources)], // Remove duplicates
    codeReferences
  };
}