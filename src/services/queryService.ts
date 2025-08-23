/**
 * Query Service - Handles LangChain orchestration for GitHub repository queries
 * Uses functional programming approach with multi-provider LLM support
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { GitHubRepo } from '@/utils/githubUtils';
import { LLMProvider } from '@/types/llm';
import { CodeReference } from '@/types/github';


import { createMCPClient, MCPClient } from './mcpClient';

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
 * Main query processing function using LangChain orchestration
 */
export async function processQuery(context: QueryContext): Promise<QueryResult> {
  try {
    // Initialize LLM based on provider
    const llm = createLLM(context.llmConfig);
    
    // Create MCP client
    const mcpClient = createMCPClient(context.githubToken);

    // Analyze the query to determine which MCP tools to use
    const toolsToUse = await determineRequiredTools(context.query, llm);
    
    // Gather repository data using determined tools
    const repositoryData = await gatherRepositoryData(
      context.repository,
      toolsToUse,
      mcpClient
    );

    // Generate response using LLM with repository context
    const response = await generateResponse(
      context.query,
      context.repository,
      repositoryData,
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
      // GitHub API rate limit errors
      if (error.message.includes('rate limit') || error.message.includes('403')) {
        return {
          success: false,
          error: 'GitHub API rate limit exceeded. Please wait a few minutes before trying again. Authenticated users have higher rate limits.'
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

/**
 * Analyze query to determine which GitHub MCP tools are needed
 */
async function determineRequiredTools(query: string, llm: BaseChatModel): Promise<string[]> {
  const systemPrompt = `You are an AI assistant that analyzes user queries about GitHub repositories to determine which tools are needed to answer them.

Available tools:
- getFileContents: Get contents of specific files (README, package.json, main files, config files)
- searchCode: Search for code patterns, functions, classes, imports across the repository
- searchRepositories: Find related repositories by the same author
- listCommits: Get recent commit history and changes
- getPullRequestFiles: Get files changed in pull requests (requires PR number)

Analyze the user query and return a JSON array of tool names that would be most helpful to answer the question.
Prioritize tools based on the query type and limit to 2-3 most relevant tools to avoid overwhelming the context.

Query patterns and recommended tools:
- Architecture/structure questions: ["getFileContents", "searchCode"]
- How something works: ["searchCode", "getFileContents"]
- Recent changes/history: ["listCommits"]
- Dependencies/setup: ["getFileContents"]
- Code examples/implementation: ["searchCode", "getFileContents"]
- Project overview: ["getFileContents", "searchCode"]
- Related projects: ["searchRepositories"]
- General questions: ["getFileContents", "searchCode"]

Return only a JSON array of tool names, nothing else.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ]);

    const tools = JSON.parse(response.content as string);
    if (Array.isArray(tools) && tools.length > 0) {
      // Limit to maximum 3 tools to avoid overwhelming the context
      return tools.slice(0, 3);
    }
  } catch (error) {
    console.warn('Failed to determine tools using LLM, using fallback logic:', error);
  }

  // Fallback: Use simple keyword-based tool selection
  const queryLower = query.toLowerCase();
  const tools: string[] = [];

  // Always include file contents for basic repository understanding
  tools.push('getFileContents');

  // Add search if looking for specific code patterns
  if (queryLower.includes('how') || queryLower.includes('implement') || queryLower.includes('function') || 
      queryLower.includes('class') || queryLower.includes('method') || queryLower.includes('code')) {
    tools.push('searchCode');
  }

  // Add commits for history-related queries
  if (queryLower.includes('recent') || queryLower.includes('change') || queryLower.includes('history') || 
      queryLower.includes('commit') || queryLower.includes('update')) {
    tools.push('listCommits');
  }

  // Add repository search for related projects
  if (queryLower.includes('similar') || queryLower.includes('related') || queryLower.includes('other')) {
    tools.push('searchRepositories');
  }

  return tools.length > 0 ? tools : ['getFileContents', 'searchCode'];
}

/**
 * Gather repository data using selected MCP tools
 */
async function gatherRepositoryData(
  repository: GitHubRepo,
  tools: string[],
  mcpClient: MCPClient
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {};

  for (const tool of tools) {
    try {
      switch (tool) {
        case 'getFileContents':
          // Get common important files
          const commonFiles = [
            'README.md', 'README.rst', 'README.txt',
            'package.json', 'requirements.txt', 'Cargo.toml', 'go.mod', 'pom.xml',
            'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts',
            'app.js', 'app.ts', 'main.py', 'main.go', 'index.html',
            'Dockerfile', 'docker-compose.yml', '.env.example'
          ];
          const fileContents = [];
          
          for (const file of commonFiles) {
            try {
              const result = await mcpClient.callTool('mcp_github_get_file_contents', {
                owner: repository.owner,
                repo: repository.repo,
                path: file
              });
              if (result.result && !result.error) {
                fileContents.push({ file, content: result.result });
              }
            } catch {
              // File doesn't exist or is inaccessible, continue with next file
              continue;
            }
          }
          data.fileContents = fileContents;
          break;

        case 'searchCode':
          // Perform targeted code searches to understand the codebase
          const searchQueries = [
            `repo:${repository.owner}/${repository.repo} function`,
            `repo:${repository.owner}/${repository.repo} class`,
            `repo:${repository.owner}/${repository.repo} import`,
            `repo:${repository.owner}/${repository.repo} export`
          ];
          
          const codeSearchResults = [];
          for (const query of searchQueries) {
            try {
              const result = await mcpClient.callTool('mcp_github_search_code', {
                query,
                owner: repository.owner,
                repo: repository.repo
              });
              if (result.result && !result.error) {
                codeSearchResults.push({ query, result: result.result });
              }
            } catch {
              // Search failed, continue with next query
              continue;
            }
          }
          data.codeSearch = codeSearchResults;
          break;

        case 'listCommits':
          // Get recent commits (limited to avoid overwhelming the context)
          try {
            const commits = await mcpClient.callTool('mcp_github_list_commits', {
              owner: repository.owner,
              repo: repository.repo,
              per_page: 10 // Limit to recent commits
            });
            if (commits.result && !commits.error) {
              data.commits = commits.result;
            }
          } catch {
            // Commits unavailable, continue
          }
          break;

        case 'searchRepositories':
          // Find related repositories
          try {
            const relatedRepos = await mcpClient.callTool('mcp_github_search_repositories', {
              query: `user:${repository.owner} sort:updated`
            });
            if (relatedRepos.result && !relatedRepos.error) {
              data.relatedRepositories = relatedRepos.result;
            }
          } catch {
            // Related repos unavailable, continue
          }
          break;

        case 'getPullRequestFiles':
          // This would need a specific PR number, skip for now
          break;
      }
    } catch (error) {
      console.error(`Error gathering data with tool ${tool}:`, error);
      // Continue with other tools even if one fails
    }
  }

  return data;
}

/**
 * Generate response using LLM with repository context
 */
async function generateResponse(
  query: string,
  repository: GitHubRepo,
  repositoryData: Record<string, unknown>,
  llm: BaseChatModel
): Promise<{
  answer: string;
  sources: string[];
  codeReferences: CodeReference[];
}> {
  // Check if we have sufficient data
  const hasFileContents = repositoryData.fileContents && Array.isArray(repositoryData.fileContents) && repositoryData.fileContents.length > 0;
  const hasCodeSearch = repositoryData.codeSearch && Array.isArray(repositoryData.codeSearch) && repositoryData.codeSearch.length > 0;
  const hasCommits = repositoryData.commits && Array.isArray(repositoryData.commits);

  let systemPrompt = `You are an expert software developer and code analyst. You help users understand GitHub repositories by analyzing their code, structure, and documentation.

You are analyzing the repository "${repository.owner}/${repository.repo}".`;

  if (hasFileContents || hasCodeSearch || hasCommits) {
    systemPrompt += `

Available repository data:
${JSON.stringify(repositoryData, null, 2)}

When referencing code or files:
1. Always mention the specific file path
2. Include relevant code snippets when helpful
3. Explain the context and purpose of the code
4. Provide architectural insights when appropriate
5. If data is limited, explain what you can determine and suggest what additional information might be helpful

Format your response in a clear, structured way. Use markdown formatting for code blocks and file references.`;
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

  // Extract sources and code references from the repository data
  const sources: string[] = [];
  const codeReferences: CodeReference[] = [];

  // Add file sources
  if (repositoryData.fileContents && Array.isArray(repositoryData.fileContents)) {
    repositoryData.fileContents.forEach((file: { file?: string; content?: unknown }) => {
      if (file.file) {
        sources.push(`https://github.com/${repository.owner}/${repository.repo}/blob/main/${file.file}`);
        
        // Create code reference if content is available
        if (file.content) {
          let content = '';
          let lines = 0;
          
          // Handle different content formats from GitHub API
          if (typeof file.content === 'string') {
            content = file.content;
            lines = content.split('\n').length;
          } else if (file.content && typeof file.content === 'object' && 'content' in file.content) {
            const contentObj = file.content as { content?: unknown };
            content = typeof contentObj.content === 'string' ? contentObj.content : '';
            lines = content.split('\n').length;
          }
          
          if (content) {
            codeReferences.push({
              file: file.file,
              startLine: 1,
              endLine: Math.min(50, lines), // Limit to first 50 lines
              content: content.split('\n').slice(0, 50).join('\n'),
              url: `https://github.com/${repository.owner}/${repository.repo}/blob/main/${file.file}`
            });
          }
        }
      }
    });
  }

  // Add code search results as sources
  if (repositoryData.codeSearch && Array.isArray(repositoryData.codeSearch)) {
    repositoryData.codeSearch.forEach((searchResult: { result?: { items?: { html_url?: string }[] } }) => {
      if (searchResult.result && searchResult.result.items) {
        searchResult.result.items.forEach((item: { html_url?: string }) => {
          if (item.html_url) {
            sources.push(item.html_url);
          }
        });
      }
    });
  }

  // Add repository URL as a primary source
  sources.unshift(`https://github.com/${repository.owner}/${repository.repo}`);

  return {
    answer: response.content as string,
    sources: [...new Set(sources)], // Remove duplicates
    codeReferences
  };
}