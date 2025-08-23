# GitHub Developer Wiki - Source Code Structure

This directory contains the source code for the GitHub Developer Wiki application.

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page component
├── services/              # Business logic and external service integrations
│   └── mcpService.ts      # GitHub MCP service for repository data
├── types/                 # TypeScript type definitions
│   ├── github.ts          # GitHub-related types (Repository, User, etc.)
│   └── query.ts           # Query request/response types
├── utils/                 # Utility functions and helpers
│   ├── config.ts          # Environment configuration utilities
│   └── githubUtils.ts     # GitHub URL parsing and validation

```

## Key Components

### Services
- **MCP Service Functions**: Functional modules for GitHub MCP server communication
- **Authentication Required**: GitHub token is mandatory for all operations (no anonymous access)
- Provides pure functions for file contents, code search, and repository analysis
- Uses functional composition instead of class-based patterns
- Strict TypeScript typing with no `any` types

### Types
- **Repository**: GitHub repository metadata
- **UserSession**: User authentication and LLM configuration
- **QueryRequest/Response**: API request/response structures
- **CodeReference**: Code snippet references with file locations

### Utilities
- **githubUtils**: Parse and validate GitHub repository URLs
- **config**: Environment variable management and validation

## Next Steps

This basic structure supports:
1. ✅ Next.js 15 with App Router and TypeScript
2. ✅ LangChain dependencies for AI orchestration
3. ✅ Basic project structure with services, types, and utilities
4. ✅ MCP service foundation with GitHub API methods
5. ✅ GitHub URL parsing utilities

Ready for implementing authentication, LLM configuration, and query processing.