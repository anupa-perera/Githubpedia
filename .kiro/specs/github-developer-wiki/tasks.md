# Implementation Plan

- [x] 1. Set up project dependencies and configuration




  - Install Next.js 15 with App Router and TypeScript
  - Install LangChain dependencies and GitHub MCP integration packages
  - Set up basic project structure with services, types, and utilities
  - Create basic MCP service with GitHub API methods
  - Implement GitHub URL parsing utilities
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement GitHub OAuth authentication





  - Install NextAuth.js and configure GitHub OAuth provider
  - Create authentication API routes (`/api/auth/[...nextauth]`)
  - Build simple login page with GitHub OAuth button
  - Update existing MCP service to use authenticated user tokens
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3. Create LLM configuration interface





  - Install OpenAI, Anthropic, and OpenRouter SDK packages
  - Create LLM setup page with provider selection (OpenAI, Anthropic, OpenRouter)
  - Add API key input form with provider-specific validation
  - Create API route for storing encrypted API keys and provider choice in session
  - Add OpenRouter model selection dropdown for users who choose OpenRouter
  - _Requirements: 2.1.1, 2.1.2, 2.1.3_

- [x] 4. Build repository input and query interface





  - Create main page with repository URL input using existing GitHub utilities
  - Add simple text area for user queries
  - Display basic repository information after URL validation
  - _Requirements: 1.3, 1.4_

- [x] 5. Implement core query processing










  - Create query processing API route (`/api/query`)
  - Integrate LangChain with multi-provider LLM support (OpenAI, Anthropic, OpenRouter)
  - Connect LangChain to existing MCP service for GitHub data
  - Return formatted responses with basic error handling
  - _Requirements: 2.1, 2.2, 2.3, 3.1_

- [ ] 6. Add basic UI improvements and error handling





  - Add loading states for queries
  - Display formatted responses with code syntax highlighting
  - Handle common errors (invalid repo, API failures, rate limits)
  - Add simple conversation history display
  - _Requirements: 2.4, 3.2, 3.3, 4.1, 4.2, 4.3_