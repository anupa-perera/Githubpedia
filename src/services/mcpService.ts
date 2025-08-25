/**
 * GitHub Service for repository interactions
 *
 * DIRECT GITHUB API IMPLEMENTATION
 *
 * This service uses GitHub's REST API directly for reliable online deployment.
 * Works in all environments including browsers, Vercel, Netlify, etc.
 *
 * Prerequisites:
 * - GitHub token with appropriate permissions
 *
 * Production-ready implementation with proper error handling!
 */

export interface GitHubResponse<T = unknown> {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface GitHubConfig {
  token: string; // GitHub token is required for all operations
}

interface GitHubFileContent {
  content: string;
  size: number;
  type: string;
  path: string;
  name: string;
}

interface GitHubSearchItem {
  path: string;
  repository: {
    name: string;
    full_name: string;
  };
  score: number;
  html_url: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubRepository {
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
}

/**
 * Make a direct GitHub API call
 */
async function callGitHubAPI<T = unknown>(
  endpoint: string,
  config: GitHubConfig,
  options: RequestInit = {}
): Promise<GitHubResponse<T>> {
  const startTime = Date.now();

  // Validate that token is provided
  if (!config.token) {
    console.error(`❌ [GitHub API] No GitHub token provided for ${endpoint}`);
    return {
      error: {
        code: -1,
        message:
          'GitHub token is required for all API operations. Please configure your GitHub token.',
      },
    };
  }

  console.log(`🚀 [GitHub API] Calling ${endpoint}`);

  try {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options,
      headers: {
        Authorization: `token ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Developer-Wiki',
        ...options.headers,
      },
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

      if (response.status === 404) {
        errorMessage = 'Resource not found or repository is private';
      } else if (response.status === 403) {
        errorMessage = 'Rate limit exceeded or insufficient permissions';
      } else if (response.status === 401) {
        errorMessage = 'Invalid GitHub token or token expired';
      }

      console.error(
        `❌ [GitHub API] ${endpoint} failed (${duration}ms): ${errorMessage}`
      );
      return {
        error: {
          code: response.status,
          message: errorMessage,
        },
      };
    }

    const data = await response.json();
    console.log(`✅ [GitHub API] SUCCESS: ${endpoint} (${duration}ms)`);
    return { result: data as T };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(
      `💥 [GitHub API] Exception during call to ${endpoint} (${duration}ms):`,
      error
    );

    return {
      error: {
        code: -3,
        message: `GitHub API request failed: ${errorMessage}. Please check your internet connection.`,
      },
    };
  }
}

// Enhanced functions for intelligent code context retrieval

export async function getFileContents(
  owner: string,
  repo: string,
  path: string,
  config: GitHubConfig,
  ref?: string
): Promise<GitHubResponse<{ content: string; size: number; type: string }>> {
  const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
  const response = await callGitHubAPI<GitHubFileContent>(endpoint, config);

  if (response.error) {
    return response;
  }

  const data = response.result;
  if (data?.type !== 'file') {
    return {
      error: {
        code: -1,
        message: 'Path is not a file',
      },
    };
  }

  // Decode base64 content
  const content = atob(data.content.replace(/\n/g, ''));

  return {
    result: {
      content,
      size: data.size,
      type: data.type,
    },
  };
}

/**
 * Get repository structure to understand codebase layout
 */
export async function getRepositoryTree(
  owner: string,
  repo: string,
  config: GitHubConfig,
  ref: string = 'main'
): Promise<
  GitHubResponse<{ tree: Array<{ path: string; type: string; size?: number }> }>
> {
  const endpoint = `/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  return callGitHubAPI(endpoint, config);
}

/**
 * Intelligently fetch relevant code files based on query context
 */
export async function getRelevantCodeContext(
  owner: string,
  repo: string,
  query: string,
  config: GitHubConfig
): Promise<{
  files: Array<{ path: string; content: string; relevance: string }>;
  error?: string;
}> {
  try {
    // First, search for code that matches the query
    const searchResult = await searchCode(query, config, owner, repo);

    if (searchResult.error) {
      return { files: [], error: searchResult.error.message };
    }

    const searchData = searchResult.result;
    const files: Array<{ path: string; content: string; relevance: string }> =
      [];

    // Get content for the most relevant files (limit to top 5)
    const relevantFiles = searchData?.items?.slice(0, 5) || [];

    for (const item of relevantFiles) {
      try {
        const fileResult = await getFileContents(
          owner,
          repo,
          item.path,
          config
        );

        if (!fileResult.error && fileResult.result) {
          files.push({
            path: item.path,
            content: fileResult.result.content,
            relevance: `Search match - Score: ${item.score}`,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch ${item.path}:`, error);
      }
    }

    // If no search results, try to get common important files
    if (files.length === 0) {
      const commonFiles = [
        'README.md',
        'package.json',
        'requirements.txt',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'src/index.js',
        'src/index.ts',
        'src/main.js',
        'src/main.ts',
        'src/app.js',
        'src/app.ts',
        'index.js',
        'index.ts',
        'app.js',
        'app.ts',
        'main.py',
        'main.go',
        'main.rs',
      ];

      for (const filePath of commonFiles) {
        try {
          const fileResult = await getFileContents(
            owner,
            repo,
            filePath,
            config
          );
          if (!fileResult.error && fileResult.result) {
            files.push({
              path: filePath,
              content: fileResult.result.content,
              relevance: 'Common project file',
            });
            if (files.length >= 3) break; // Get up to 3 common files
          }
        } catch (error) {
          // Continue to next file
        }
      }
    }

    return { files };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get comprehensive repository context for answering questions
 */
export async function getRepositoryContext(
  owner: string,
  repo: string,
  query: string,
  config: GitHubConfig
): Promise<{
  readme?: string;
  codeFiles: Array<{ path: string; content: string; relevance: string }>;
  structure?: { tree: Array<{ path: string; type: string; size?: number }> };
  error?: string;
}> {
  try {
    // Get README for basic info
    const readmeResult = await getFileContents(
      owner,
      repo,
      'README.md',
      config
    );
    const readme = readmeResult.error
      ? undefined
      : readmeResult.result?.content;

    // Get relevant code files based on the query
    const codeContext = await getRelevantCodeContext(
      owner,
      repo,
      query,
      config
    );

    // Get repository structure (directory listing)
    const structureResult = await getRepositoryTree(owner, repo, config);
    const structure = structureResult.error
      ? undefined
      : structureResult.result;

    // If we still don't have much context, try to get more files by exploring the structure
    if (codeContext.files.length < 3 && structure?.tree) {
      const additionalFiles = await getAdditionalRelevantFiles(
        owner,
        repo,
        query,
        structure.tree,
        config,
        codeContext.files.map(f => f.path)
      );
      codeContext.files.push(...additionalFiles);
    }

    return {
      readme,
      codeFiles: codeContext.files,
      structure,
      error: codeContext.error,
    };
  } catch (error) {
    return {
      codeFiles: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get additional relevant files by analyzing repository structure
 */
async function getAdditionalRelevantFiles(
  owner: string,
  repo: string,
  query: string,
  tree: Array<{ path: string; type: string; size?: number }>,
  config: GitHubConfig,
  excludePaths: string[]
): Promise<Array<{ path: string; content: string; relevance: string }>> {
  const files: Array<{ path: string; content: string; relevance: string }> = [];
  const queryLower = query.toLowerCase();

  // Score files based on relevance to query and common patterns
  const scoredFiles = tree
    .filter(item => item.type === 'blob' && !excludePaths.includes(item.path))
    .map(item => {
      let score = 0;
      const pathLower = item.path.toLowerCase();

      // Higher score for files that match query terms
      if (queryLower.split(' ').some(term => pathLower.includes(term))) {
        score += 10;
      }

      // Score based on file type and location
      if (pathLower.includes('src/') || pathLower.includes('lib/')) score += 5;
      if (pathLower.endsWith('.js') || pathLower.endsWith('.ts')) score += 3;
      if (
        pathLower.endsWith('.py') ||
        pathLower.endsWith('.go') ||
        pathLower.endsWith('.rs')
      )
        score += 3;
      if (
        pathLower.includes('main') ||
        pathLower.includes('index') ||
        pathLower.includes('app')
      )
        score += 4;
      if (pathLower.includes('config') || pathLower.includes('setup'))
        score += 2;
      if (pathLower.includes('test') || pathLower.includes('spec')) score += 1;

      // Penalize very large files or deep nesting
      if (item.size && item.size > 50000) score -= 2;
      if (item.path.split('/').length > 4) score -= 1;

      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 additional files

  // Fetch content for scored files
  for (const item of scoredFiles) {
    try {
      const fileResult = await getFileContents(owner, repo, item.path, config);
      if (!fileResult.error && fileResult.result) {
        files.push({
          path: item.path,
          content: fileResult.result.content,
          relevance: `Structure analysis - Score: ${item.score}`,
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch additional file ${item.path}:`, error);
    }
  }

  return files;
}

export async function searchCode(
  query: string,
  config: GitHubConfig,
  owner?: string,
  repo?: string
): Promise<GitHubResponse<{ items: Array<GitHubSearchItem> }>> {
  const searchQuery = owner && repo ? `repo:${owner}/${repo} ${query}` : query;
  const endpoint = `/search/code?q=${encodeURIComponent(searchQuery)}&per_page=10`;
  return callGitHubAPI(endpoint, config);
}

export async function searchRepositories(
  query: string,
  config: GitHubConfig
): Promise<GitHubResponse<{ items: Array<GitHubRepository> }>> {
  const endpoint = `/search/repositories?q=${encodeURIComponent(query)}&per_page=10`;
  return callGitHubAPI(endpoint, config);
}

export async function listCommits(
  owner: string,
  repo: string,
  config: GitHubConfig,
  options?: { sha?: string; path?: string; per_page?: number }
): Promise<GitHubResponse<Array<GitHubCommit>>> {
  const params = new URLSearchParams();
  if (options?.sha) params.append('sha', options.sha);
  if (options?.path) params.append('path', options.path);
  if (options?.per_page) params.append('per_page', options.per_page.toString());

  const endpoint = `/repos/${owner}/${repo}/commits${params.toString() ? `?${params.toString()}` : ''}`;
  return callGitHubAPI(endpoint, config);
}

export async function getCommit(
  owner: string,
  repo: string,
  ref: string,
  config: GitHubConfig
): Promise<GitHubResponse<GitHubCommit>> {
  const endpoint = `/repos/${owner}/${repo}/commits/${ref}`;
  return callGitHubAPI(endpoint, config);
}

export async function getPullRequestFiles(
  owner: string,
  repo: string,
  pullNumber: number,
  config: GitHubConfig
): Promise<
  GitHubResponse<
    Array<{
      filename: string;
      status: string;
      additions: number;
      deletions: number;
      changes: number;
      patch?: string;
    }>
  >
> {
  const endpoint = `/repos/${owner}/${repo}/pulls/${pullNumber}/files`;
  return callGitHubAPI(endpoint, config);
}
