/**
 * Example usage of the MCP Service
 * This file demonstrates how to interact with the GitHub MCP server
 */

import { MCPService } from '../services/mcpService';
import { parseGitHubUrl } from '../utils/githubUtils';

export async function exampleMCPUsage() {
  const mcpService = new MCPService();
  
  // Example 1: Parse a GitHub URL and get repository info
  const repoUrl = 'https://github.com/microsoft/vscode';
  const repoInfo = parseGitHubUrl(repoUrl);
  
  if (!repoInfo) {
    console.error('Invalid GitHub URL');
    return;
  }

  console.log(`Repository: ${repoInfo.owner}/${repoInfo.repo}`);

  try {
    // Example 2: Search for repositories
    console.log('Searching for repositories...');
    const searchResult = await mcpService.searchRepositories('language:typescript stars:>1000');
    if (searchResult.error) {
      console.error('Search error:', searchResult.error);
    } else {
      console.log('Search results:', searchResult.result);
    }

    // Example 3: Get file contents
    console.log('Getting README file...');
    const fileResult = await mcpService.getFileContents(repoInfo.owner, repoInfo.repo, 'README.md');
    if (fileResult.error) {
      console.error('File error:', fileResult.error);
    } else {
      console.log('File contents length:', fileResult.result?.content?.length || 0);
    }

    // Example 4: Search code within the repository
    console.log('Searching code...');
    const codeResult = await mcpService.searchCode('function main', repoInfo.owner, repoInfo.repo);
    if (codeResult.error) {
      console.error('Code search error:', codeResult.error);
    } else {
      console.log('Code search results:', codeResult.result);
    }

    // Example 5: List recent commits
    console.log('Getting recent commits...');
    const commitsResult = await mcpService.listCommits(repoInfo.owner, repoInfo.repo);
    if (commitsResult.error) {
      console.error('Commits error:', commitsResult.error);
    } else {
      console.log('Recent commits count:', commitsResult.result?.length || 0);
    }

  } catch (error) {
    console.error('MCP Service error:', error);
  }
}

// Example function to test MCP connectivity
export async function testMCPConnection(): Promise<boolean> {
  const mcpService = new MCPService();
  
  try {
    // Simple test: search for a popular repository
    const result = await mcpService.searchRepositories('microsoft/vscode');
    return !result.error;
  } catch (error) {
    console.error('MCP connection test failed:', error);
    return false;
  }
}