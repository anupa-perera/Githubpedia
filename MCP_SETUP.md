# GitHub MCP Configuration Setup

To complete the project setup, you need to configure the GitHub MCP server to use the remote GitHub Copilot API.

## Step 1: Create MCP Configuration

Create or update the file `.kiro/settings/mcp.json` with the following configuration:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer your_github_token_here",
        "Content-Type": "application/json"
      },
      "disabled": false,
      "autoApprove": [
        "mcp_github_get_file_contents",
        "mcp_github_search_code", 
        "mcp_github_get_pull_request_files",
        "mcp_github_search_repositories",
        "mcp_github_list_commits",
        "mcp_github_get_commit"
      ]
    }
  }
}
```

## Step 2: Set up GitHub Personal Access Token

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with the following permissions:
   - `repo` (for repository access)
   - `read:org` (for organization repositories)
3. Replace `your_github_token_here` in the configuration with your actual token

## Step 3: No Additional Installation Required

Since we're using the remote GitHub Copilot MCP server, no local installation of `uv` or `uvx` is required. The IDE will communicate directly with the remote endpoint.

## Step 4: Verify MCP Connection

After configuration, restart Kiro and check the MCP Server view in the Kiro feature panel to ensure the GitHub server is connected.