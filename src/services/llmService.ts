import OpenAI from 'openai';
import { LLMProvider, OpenRouterModel, OpenAIModel, AnthropicModel, PROVIDER_CONFIGS } from '@/types/llm';

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
  } catch {
    return false;
  }
}

async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
    });
    return response.ok;
  } catch {
    return false;
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
  } catch {
    return false;
  }
}

export async function fetchOpenAIModels(apiKey: string): Promise<OpenAIModel[]> {
  try {
    const openai = new OpenAI({ apiKey });
    const models = await openai.models.list();
    
    // Filter for GPT models and sort by creation date
    const gptModels = models.data
      .filter(model => model.id.includes('gpt'))
      .sort((a, b) => b.created - a.created)
      .map(model => ({
        id: model.id,
        name: model.id,
        description: `OpenAI ${model.id}`,
        created: model.created,
        owned_by: model.owned_by
      }));
    
    return gptModels;
  } catch (error) {
    console.error('Failed to fetch OpenAI models:', error);
    return [];
  }
}

export async function fetchAnthropicModels(apiKey: string): Promise<AnthropicModel[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Anthropic models');
    }

    const data = await response.json();
    
    // The API returns { data: [...models] }
    return data.data || [];
  } catch (error) {
    console.error('Failed to fetch Anthropic models:', error);
    return [];
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