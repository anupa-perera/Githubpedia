/**
 * GitHub-related type definitions
 */

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string;
}

export interface UserSession {
  user: {
    id: string;
    login: string;
    name: string;
    avatar_url: string;
  };
  accessToken: string;
  expiresAt: number;
  llmConfig?: {
    provider: 'openai' | 'anthropic' | 'openrouter';
    encryptedApiKey: string;
    model: string;
    baseUrl?: string; // For OpenRouter custom endpoint
    configuredAt: Date;
  };
}

export interface CodeReference {
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  url: string;
}

export interface LLMSetupRequest {
  provider: 'openai' | 'anthropic' | 'openrouter';
  apiKey: string;
  model?: string; // Optional, defaults to provider's recommended model
  baseUrl?: string; // For OpenRouter: https://openrouter.ai/api/v1
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: number;
    completion: number;
  };
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
}

export interface LLMSetupResponse {
  success: boolean;
  provider: string;
  model: string;
  keyValid: boolean;
  availableModels?: OpenRouterModel[]; // For OpenRouter
  error?: string;
}

export interface QueryContext {
  repository: string;
  userLLMConfig: {
    provider: 'openai' | 'anthropic' | 'openrouter';
    apiKey: string; // Decrypted for processing
    model: string;
    baseUrl?: string;
  };
  githubToken: string; // Always required for all GitHub operations
  query: string;
}
