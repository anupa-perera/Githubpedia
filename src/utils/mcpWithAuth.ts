import { getGitHubToken } from './auth';
import { GitHubMCPConfig } from '../services/mcpService';
import * as mcpService from '../services/mcpService';

/**
 * Create MCP configuration with authenticated user's GitHub token
 */
export async function createAuthenticatedMCPConfig(): Promise<GitHubMCPConfig | null> {
  const token = await getGitHubToken();
  
  if (!token) {
    return null;
  }

  return { token };
}

/**
 * Wrapper functions that automatically use authenticated user's token
 */

export async function getFileContentsAuth(
  owner: string,
  repo: string,
  path: string,
  ref?: string
) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.getFileContents(owner, repo, path, config, ref);
}

export async function searchCodeAuth(
  query: string,
  owner?: string,
  repo?: string
) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.searchCode(query, config, owner, repo);
}

export async function searchRepositoriesAuth(query: string) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.searchRepositories(query, config);
}

export async function getPullRequestFilesAuth(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.getPullRequestFiles(owner, repo, pullNumber, config);
}

export async function listCommitsAuth(
  owner: string,
  repo: string,
  sha?: string,
  path?: string
) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.listCommits(owner, repo, config, sha, path);
}

export async function getCommitAuth(
  owner: string,
  repo: string,
  ref: string
) {
  const config = await createAuthenticatedMCPConfig();
  if (!config) {
    throw new Error('Authentication required');
  }
  
  return mcpService.getCommit(owner, repo, ref, config);
}