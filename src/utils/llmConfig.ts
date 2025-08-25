import { LLMProvider } from '@/types/llm';

export interface LLMConfigData {
  provider: LLMProvider;
  model: string;
  configured: boolean;
  configuredAt?: string;
}

/**
 * Get current LLM configuration from the API
 */
export async function getCurrentLLMConfig(): Promise<LLMConfigData | null> {
  try {
    const response = await fetch('/api/llm-setup');
    const data = await response.json();

    if (data.configured) {
      return {
        provider: data.provider,
        model: data.model,
        configured: true,
        configuredAt: data.configuredAt,
      };
    }

    return { provider: 'openai', model: '', configured: false };
  } catch (error) {
    console.error('Failed to get LLM config:', error);
    return null;
  }
}

/**
 * Switch to a different provider and model
 */
export async function switchLLMConfig(
  provider: LLMProvider,
  model: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/llm-setup/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider, model }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to switch LLM config:', error);
    return false;
  }
}

/**
 * Format provider name for display
 */
export function formatProviderName(provider: LLMProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'openrouter':
      return 'OpenRouter';
    default:
      return provider;
  }
}

/**
 * Format model name for display
 */
export function formatModelName(model: string): string {
  // Remove provider prefix for OpenRouter models
  if (model.includes('/')) {
    return model.split('/')[1];
  }
  return model;
}
