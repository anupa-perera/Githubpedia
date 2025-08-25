export type LLMProvider = 'openai' | 'anthropic' | 'openrouter';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  configuredAt: Date;
}

export interface EncryptedLLMConfig {
  provider: LLMProvider;
  encryptedApiKey: string;
  model: string;
  baseUrl?: string;
  configuredAt: Date;
}

export interface LLMSetupRequest {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface LLMSetupResponse {
  success: boolean;
  provider: string;
  model: string;
  keyValid: boolean;
  availableModels?: LLMModel[];
  error?: string;
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

export interface OpenAIModel {
  id: string;
  name: string;
  description: string;
  created: number;
  owned_by: string;
}

export interface AnthropicModel {
  id: string;
  name: string;
  created_at: string;
  display_name: string;
  type: string;
}

export type LLMModel = OpenRouterModel | OpenAIModel | AnthropicModel;

export interface ProviderConfig {
  name: string;
  defaultModel: string;
  models: string[];
  apiKeyPattern?: RegExp;
  baseUrl?: string;
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4',
    models: [], // Will be fetched dynamically
  },
  anthropic: {
    name: 'Anthropic',
    defaultModel: 'claude-3-sonnet-20240229',
    models: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
  },
  openrouter: {
    name: 'OpenRouter',
    defaultModel: 'openai/gpt-4',
    models: [], // Will be fetched dynamically
    baseUrl: 'https://openrouter.ai/api/v1',
  },
};
