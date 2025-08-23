/**
 * Utility functions for setting up the GitHub MCP server configuration
 */

export interface MCPServerConfig {
  mcpServers: {
    github: {
      command: string;
      args: string[];
      env: {
        GITHUB_TOKEN: string;
      };
      disabled: boolean;
      autoApprove: string[];
    };
  };
}

/**
 * Generate MCP configuration for the hosted GitHub MCP server
 */
export function generateGitHubMCPConfig(githubToken?: string): MCPServerConfig {
  return {
    mcpServers: {
      github: {
        command: "curl",
        args: [
          "-X", "POST",
          "https://api.githubcopilot.com/mcp/",
          "-H", "Content-Type: application/json",
          "-H", "Authorization: Bearer ${GITHUB_TOKEN}"
        ],
        env: {
          GITHUB_TOKEN: githubToken || ""
        },
        disabled: false,
        autoApprove: [
          "mcp_github_get_file_contents",
          "mcp_github_search_code",
          "mcp_github_search_repositories", 
          "mcp_github_list_commits",
          "mcp_github_get_commit",
          "mcp_github_get_pull_request_files"
        ]
      }
    }
  };
}

/**
 * Instructions for manual MCP setup
 */
export const MCP_SETUP_INSTRUCTIONS = `
To use the hosted GitHub MCP server:

1. Create or update your MCP configuration file at .kiro/settings/mcp.json
2. Add the GitHub MCP server configuration:

${JSON.stringify(generateGitHubMCPConfig("[YOUR_GITHUB_TOKEN]"), null, 2)}

3. Replace [YOUR_GITHUB_TOKEN] with your actual GitHub token
4. The server will automatically connect and provide access to GitHub MCP tools

Available GitHub MCP tools:
- mcp_github_get_file_contents: Get file contents from repositories
- mcp_github_search_code: Search code across repositories  
- mcp_github_search_repositories: Find repositories
- mcp_github_list_commits: Get commit history
- mcp_github_get_commit: Get specific commit details
- mcp_github_get_pull_request_files: Get PR file changes

The hosted server URL is: https://api.githubcopilot.com/mcp/
`;

/**
 * Check if MCP is properly configured
 */
export function validateMCPConfig(config: unknown): boolean {
  try {
    const mcpConfig = config as MCPServerConfig;
    return !!(
      mcpConfig?.mcpServers?.github?.command &&
      mcpConfig?.mcpServers?.github?.args?.length > 0 &&
      !mcpConfig?.mcpServers?.github?.disabled
    );
  } catch {
    return false;
  }
}