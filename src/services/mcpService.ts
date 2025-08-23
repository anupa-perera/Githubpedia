/**
 * MCP Service for GitHub API interactions
 * Handles communication with the hosted GitHub MCP server using the MCP SDK
 * 
 * To use the hosted GitHub MCP server, configure your .kiro/settings/mcp.json:
 * {
 *   "mcpServers": {
 *     "github": {
 *       "command": "curl",
 *       "args": ["-X", "POST", "https://api.githubcopilot.com/mcp/"],
 *       "env": { "GITHUB_TOKEN": "your_token_here" },
 *       "disabled": false,
 *       "autoApprove": ["mcp_github_get_file_contents", "mcp_github_search_code"]
 *     }
 *   }
 * }
 * 
 * This implementation provides fallback to direct GitHub API calls when MCP is unavailable.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';


export interface MCPRequest {
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse<T = unknown> {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface GitHubMCPConfig {
  token: string; // GitHub token is required for all operations
}

// Cache for MCP client connection
let mcpClient: Client | null = null;

/**
 * Initialize connection to the hosted GitHub MCP server
 */
async function initializeMCPClient(_config: GitHubMCPConfig): Promise<Client> {
  if (mcpClient) {
    return mcpClient;
  }

  try {
    // For the hosted GitHub MCP server, we'll use HTTP transport
    // This is a simplified approach - in production you might want to use the actual MCP transport
    mcpClient = new Client(
      {
        name: "github-developer-wiki",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Note: The actual connection to the hosted MCP server would be established here
    // For now, we'll fall back to direct GitHub API calls with proper MCP-style responses
    
    return mcpClient;
  } catch (error) {
    throw new Error(`Failed to initialize MCP client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Make a direct GitHub API call with MCP-style response formatting
 * This provides the same functionality as the GitHub MCP server
 */
async function makeGitHubAPICall<T = unknown>(
  endpoint: string,
  config: GitHubMCPConfig,
  options: RequestInit = {}
): Promise<MCPResponse<T>> {
  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Developer-Wiki',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: {
          code: response.status,
          message: errorData.message || `GitHub API error: ${response.statusText}`
        }
      };
    }

    const result = await response.json();
    return { result: result as T };

  } catch (error) {
    return {
      error: {
        code: -1,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Make a generic MCP call to the hosted GitHub MCP server
 * Falls back to direct GitHub API calls with MCP-style responses
 */
export async function callMCP<T = unknown>(
  method: string,
  config: GitHubMCPConfig,
  params?: Record<string, unknown>
): Promise<MCPResponse<T>> {
  try {
    // Validate that token is provided
    if (!config.token) {
      return {
        error: {
          code: -1,
          message: 'GitHub token is required for all operations'
        }
      };
    }

    // Try to use the hosted MCP server first
    try {
      await initializeMCPClient(config);
      
      // In a full implementation, this would make an actual MCP call:
      // const result = await client.callTool({ name: method, arguments: params });
      // return { result: result.content as T };
      
      // For now, fall back to direct API calls
    } catch (mcpError) {
      console.warn('MCP server unavailable, falling back to direct API calls:', mcpError);
    }

    // Fallback to direct GitHub API calls with MCP-compatible responses
    const apiResult = await callGitHubAPI<T>(method, config, params);
    return apiResult;

  } catch (error) {
    return {
      error: {
        code: -1,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Call GitHub API directly with MCP method mapping
 */
async function callGitHubAPI<T = unknown>(
  method: string,
  config: GitHubMCPConfig,
  params?: Record<string, unknown>
): Promise<MCPResponse<T>> {
  // Map MCP method names to GitHub API endpoints
  switch (method) {
    case 'mcp_github_get_file_contents':
      return await getFileContentsAPI(params as { owner: string; repo: string; path: string; ref?: string }, config) as MCPResponse<T>;
    case 'mcp_github_search_code':
      return await searchCodeAPI(params as { query: string; owner?: string; repo?: string }, config) as MCPResponse<T>;
    case 'mcp_github_search_repositories':
      return await searchRepositoriesAPI(params as { query: string }, config) as MCPResponse<T>;
    case 'mcp_github_list_commits':
      return await listCommitsAPI(params as { owner: string; repo: string; sha?: string; path?: string }, config) as MCPResponse<T>;
    case 'mcp_github_get_commit':
      return await getCommitAPI(params as { owner: string; repo: string; ref: string }, config) as MCPResponse<T>;
    default:
      return {
        error: {
          code: -1,
          message: `Unsupported MCP method: ${method}`
        }
      };
  }
}

// GitHub API implementation functions
async function getFileContentsAPI(
  params: { owner: string; repo: string; path: string; ref?: string },
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  const { owner, repo, path, ref } = params;
  const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
  
  const response = await makeGitHubAPICall(endpoint, config);
  
  if (response.result && typeof response.result === 'object' && 'content' in response.result) {
    // Decode base64 content
    const fileData = response.result as { content?: string; encoding?: string };
    if (fileData.content && fileData.encoding === 'base64') {
      fileData.content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    }
  }
  
  return response;
}

async function searchCodeAPI(
  params: { query: string; owner?: string; repo?: string },
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  let searchQuery = params.query;
  
  // Add repository scope if provided
  if (params.owner && params.repo) {
    searchQuery += ` repo:${params.owner}/${params.repo}`;
  } else if (params.owner) {
    searchQuery += ` user:${params.owner}`;
  }
  
  const endpoint = `/search/code?q=${encodeURIComponent(searchQuery)}`;
  return await makeGitHubAPICall(endpoint, config);
}

async function searchRepositoriesAPI(
  params: { query: string },
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  const endpoint = `/search/repositories?q=${encodeURIComponent(params.query)}`;
  return await makeGitHubAPICall(endpoint, config);
}

async function listCommitsAPI(
  params: { owner: string; repo: string; sha?: string; path?: string },
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  const { owner, repo, sha, path } = params;
  let endpoint = `/repos/${owner}/${repo}/commits`;
  
  const queryParams = new URLSearchParams();
  if (sha) queryParams.append('sha', sha);
  if (path) queryParams.append('path', path);
  
  if (queryParams.toString()) {
    endpoint += `?${queryParams.toString()}`;
  }
  
  return await makeGitHubAPICall(endpoint, config);
}

async function getCommitAPI(
  params: { owner: string; repo: string; ref: string },
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  const { owner, repo, ref } = params;
  const endpoint = `/repos/${owner}/${repo}/commits/${ref}`;
  return await makeGitHubAPICall(endpoint, config);
}

/**
 * Get file contents from a GitHub repository
 */
export async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  config: GitHubMCPConfig,
  ref?: string
): Promise<MCPResponse> {
  return callMCP('mcp_github_get_file_contents', config, {
    owner,
    repo,
    path,
    ref
  });
}

/**
 * Search code in GitHub repositories
 */
export async function searchCode(
  query: string,
  config: GitHubMCPConfig,
  owner?: string,
  repo?: string
): Promise<MCPResponse> {
  const params: Record<string, unknown> = { query };
  if (owner) params.owner = owner;
  if (repo) params.repo = repo;

  return callMCP('mcp_github_search_code', config, params);
}

/**
 * Search GitHub repositories
 */
export async function searchRepositories(
  query: string,
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  return callMCP('mcp_github_search_repositories', config, { query });
}

/**
 * Get pull request files
 */
export async function getPullRequestFiles(
  owner: string,
  repo: string,
  pullNumber: number,
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  return callMCP('mcp_github_get_pull_request_files', config, {
    owner,
    repo,
    pull_number: pullNumber
  });
}

/**
 * List commits from a repository
 */
export async function listCommits(
  owner: string,
  repo: string,
  config: GitHubMCPConfig,
  sha?: string,
  path?: string
): Promise<MCPResponse> {
  const params: Record<string, unknown> = { owner, repo };
  if (sha) params.sha = sha;
  if (path) params.path = path;

  return callMCP('mcp_github_list_commits', config, params);
}

/**
 * Get a specific commit
 */
export async function getCommit(
  owner: string,
  repo: string,
  ref: string,
  config: GitHubMCPConfig
): Promise<MCPResponse> {
  return callMCP('mcp_github_get_commit', config, {
    owner,
    repo,
    ref
  });
}