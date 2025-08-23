/**
 * MCP Client wrapper for GitHub MCP server integration
 * Provides a simplified interface for calling GitHub MCP tools
 */

import { MCPResponse } from './mcpService';

export interface MCPClient {
  callTool(toolName: string, params: Record<string, unknown>): Promise<MCPResponse>;
}

/**
 * Create an MCP client for GitHub operations
 * This wraps the MCP service calls in a more convenient interface
 */
export function createMCPClient(githubToken: string): MCPClient {
  return {
    async callTool(toolName: string, params: Record<string, unknown>): Promise<MCPResponse> {
      // Import the MCP service dynamically to avoid circular dependencies
      const { callMCP } = await import('./mcpService');
      
      return callMCP(toolName, { token: githubToken }, params);
    }
  };
}