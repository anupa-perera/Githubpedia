/**
 * MCP Service for GitHub API interactions
 * Handles communication with the GitHub MCP server
 */

export interface MCPRequest {
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

export class MCPService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = 'https://api.githubcopilot.com/mcp/';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN || ''}`
    };
  }

  /**
   * Make a generic MCP call
   */
  async call(method: string, params?: Record<string, any>): Promise<MCPResponse> {
    const request: MCPRequest = {
      method,
      params
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
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
   * Get file contents from a GitHub repository
   */
  async getFileContents(owner: string, repo: string, path: string, ref?: string): Promise<MCPResponse> {
    return this.call('mcp_github_get_file_contents', {
      owner,
      repo,
      path,
      ref
    });
  }

  /**
   * Search code in GitHub repositories
   */
  async searchCode(query: string, owner?: string, repo?: string): Promise<MCPResponse> {
    const params: Record<string, any> = { query };
    if (owner) params.owner = owner;
    if (repo) params.repo = repo;
    
    return this.call('mcp_github_search_code', params);
  }

  /**
   * Search GitHub repositories
   */
  async searchRepositories(query: string): Promise<MCPResponse> {
    return this.call('mcp_github_search_repositories', { query });
  }

  /**
   * Get pull request files
   */
  async getPullRequestFiles(owner: string, repo: string, pullNumber: number): Promise<MCPResponse> {
    return this.call('mcp_github_get_pull_request_files', {
      owner,
      repo,
      pull_number: pullNumber
    });
  }

  /**
   * List commits from a repository
   */
  async listCommits(owner: string, repo: string, sha?: string, path?: string): Promise<MCPResponse> {
    const params: Record<string, any> = { owner, repo };
    if (sha) params.sha = sha;
    if (path) params.path = path;
    
    return this.call('mcp_github_list_commits', params);
  }

  /**
   * Get a specific commit
   */
  async getCommit(owner: string, repo: string, ref: string): Promise<MCPResponse> {
    return this.call('mcp_github_get_commit', {
      owner,
      repo,
      ref
    });
  }
}