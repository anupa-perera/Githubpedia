# Design Document

## Overview

The GitHub Developer Wiki is a Next.js-based web application that provides Wikipedia-like functionality for exploring GitHub repositories. The system uses LangChain as the orchestration layer to coordinate between user queries and GitHub MCP (Model Context Protocol) for repository data access. This architecture enables intelligent querying, contextual understanding, and seamless integration with GitHub's API ecosystem.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js UI    │───▶│  LangChain       │───▶│   GitHub MCP    │
│   (Frontend)    │    │  Orchestrator    │    │   Tools         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Component Layers

1. **Frontend**: Next.js React components for user interface
2. **Orchestrator**: LangChain determines which GitHub MCP tools to call
3. **Data Access**: GitHub MCP tools provide repository data

## Components and Interfaces

### Frontend Components

#### Main Page Component
- **Purpose**: Single page with repository input and query interface
- **Features**: Repository URL input, query text area, response display
- **State**: Current repository, query history, loading states

### Backend API Routes

#### `/api/query`
- **Method**: POST
- **Purpose**: Handles all repository queries through LangChain orchestrator
- **Input**: `{ repositoryUrl: string, query: string }`
- **Output**: `{ response: string, sources: string[] }`
- **Integration**: LangChain determines which GitHub MCP tools to call based on query

### LangChain Orchestration Layer

#### QueryProcessor
- **Purpose**: Analyzes user queries and calls appropriate GitHub MCP tools
- **Function**: Takes repository URL and natural language query, determines which MCP tools to call, processes results into readable response
- **Key MCP Tools Used**:
  - `mcp_github_get_file_contents` - For file-specific questions
  - `mcp_github_search_code` - For code pattern searches
  - `mcp_github_get_pull_request_files` - For understanding recent changes
  - `mcp_github_search_repositories` - For finding related projects

## Data Models

### QueryRequest
```typescript
interface QueryRequest {
  repositoryUrl: string;
  query: string;
}
```

### QueryResponse
```typescript
interface QueryResponse {
  response: string;
  sources: string[];
}
```

## Error Handling

### Basic Error Handling
- **Invalid Repository URL**: Display error message with format guidance
- **MCP Tool Failures**: Return error message to user
- **Network Issues**: Display connection error with retry option

