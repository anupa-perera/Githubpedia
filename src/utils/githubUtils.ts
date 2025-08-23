/**
 * GitHub utility functions for parsing URLs and repository information
 */

export interface GitHubRepo {
  owner: string;
  repo: string;
}

/**
 * Parse a GitHub repository URL to extract owner and repo name
 */
export function parseGitHubUrl(url: string): GitHubRepo | null {
  try {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)/,  // https://github.com/owner/repo
      /github\.com\/([^\/]+)\/([^\/]+)\.git/, // https://github.com/owner/repo.git
      /git@github\.com:([^\/]+)\/([^\/]+)\.git/ // git@github.com:owner/repo.git
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '') // Remove .git suffix if present
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validate if a string is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
  return parseGitHubUrl(url) !== null;
}

/**
 * Create a GitHub repository URL from owner and repo name
 */
export function createGitHubUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}