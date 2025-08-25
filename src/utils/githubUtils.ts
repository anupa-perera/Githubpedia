/**
 * GitHub utility functions for URL parsing and validation
 */

export interface GitHubRepo {
  owner: string;
  repo: string;
}

/**
 * Parse a GitHub URL and extract owner and repo information
 * Supports various GitHub URL formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/
 * - https://github.com/owner/repo.git
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubUrl(url: string): GitHubRepo | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Remove trailing slash and .git extension
    const cleanUrl = url
      .trim()
      .replace(/\/$/, '')
      .replace(/\.git$/, '');

    // Handle different URL formats
    let match: RegExpMatchArray | null = null;

    // Full GitHub URL: https://github.com/owner/repo
    match = cleanUrl.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    // GitHub URL without protocol: github.com/owner/repo
    match = cleanUrl.match(/^github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    // Short format: owner/repo
    match = cleanUrl.match(/^([^\/]+)\/([^\/]+)$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    return null;
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
}

/**
 * Validate if a URL is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const repoInfo = parseGitHubUrl(url);
  if (!repoInfo) {
    return false;
  }

  // Basic validation of owner and repo names
  const { owner, repo } = repoInfo;

  // GitHub username/organization rules:
  // - May only contain alphanumeric characters or single hyphens
  // - Cannot begin or end with a hyphen
  // - Maximum 39 characters
  const validName = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

  return validName.test(owner) && validName.test(repo);
}

/**
 * Convert repository info to a standard GitHub URL
 */
export function toGitHubUrl(repo: GitHubRepo): string {
  return `https://github.com/${repo.owner}/${repo.repo}`;
}

/**
 * Extract repository name from URL for display purposes
 */
export function getRepoDisplayName(url: string): string {
  const repoInfo = parseGitHubUrl(url);
  return repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : url;
}
