import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, OpenRouterModel, PROVIDER_CONFIGS } from '@/types/llm';

export async function validateApiKey(provider: LLMProvider, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai':
        return await validateOpenAIKey(apiKey);
      case 'anthropic':
        return await validateAnthropicKey(apiKey);
      case 'openrouter':
        return await validateOpenRouterKey(apiKey);
      default:
        return false;
    }
  } catch (error) {
    console.error(`API key validation failed for ${provider}:`, error);
    return false;
  }
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const openai = new OpenAI({ apiKey });
    await openai.models.list();
    return true;
  } catch (error) {
    return false;
  }
}

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const anthropic = new Anthropic({ apiKey });
    // Make a minimal request to validate the key
    await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'test' }],
    });
    return true;
  } catch (error: unknown) {
    // Check if it's an authentication error vs other errors
    if (error instanceof Error && error.message.includes('authentication')) {
      return false;
    }
    // If it's not an auth error, the key might be valid but there's another issue
    return true;
  }
}

async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch OpenRouter models');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch OpenRouter models:', error);
    return [];
  }
}

export function validateApiKeyFormat(provider: LLMProvider, apiKey: string): boolean {
  const config = PROVIDER_CONFIGS[provider];
  if (!config.apiKeyPattern) {
    return true; // No pattern defined, assume valid
  }
  return config.apiKeyPattern.test(apiKey);
}

export function getDefaultModel(provider: LLMProvider): string {
  return PROVIDER_CONFIGS[provider].defaultModel;
}

export function getProviderModels(provider: LLMProvider): string[] {
  return PROVIDER_CONFIGS[provider].models;
}