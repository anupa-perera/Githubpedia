import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import {
  fetchAnthropicModels,
  fetchOpenAIModels,
  fetchOpenRouterModels,
} from '@/services/llmService';
import { LLMModel, LLMProvider } from '@/types/llm';
import { authOptions } from '@/utils/auth';

interface ModelsRequest {
  provider: LLMProvider;
  apiKey: string;
}

interface ModelsResponse {
  success: boolean;
  models?: LLMModel[];
  provider?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: ModelsRequest = await request.json();
    const { provider, apiKey } = body;

    // Validate provider
    if (!['openai', 'anthropic', 'openrouter'].includes(provider)) {
      return NextResponse.json<ModelsResponse>(
        { success: false, error: 'Invalid provider' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json<ModelsResponse>(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    // Fetch models based on provider
    let models: LLMModel[] = [];

    try {
      switch (provider as LLMProvider) {
        case 'openai':
          models = await fetchOpenAIModels(apiKey);
          break;
        case 'anthropic':
          models = await fetchAnthropicModels(apiKey);
          break;
        case 'openrouter':
          models = await fetchOpenRouterModels(apiKey);
          break;
      }

      return NextResponse.json<ModelsResponse>({
        success: true,
        models,
        provider,
      });
    } catch (error) {
      console.error(`Failed to fetch ${provider} models:`, error);
      return NextResponse.json<ModelsResponse>(
        {
          success: false,
          error: `Failed to fetch models. Please check your API key.`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Models fetch error:', error);
    return NextResponse.json<ModelsResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
