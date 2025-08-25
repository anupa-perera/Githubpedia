import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import {
  fetchOpenRouterModels,
  getDefaultModel,
  validateApiKey,
  validateApiKeyFormat,
} from '@/services/llmService';
import { LLMProvider, LLMSetupRequest, LLMSetupResponse } from '@/types/llm';
import { authOptions } from '@/utils/auth';
import { encryptApiKey } from '@/utils/encryption';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: LLMSetupRequest = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    // Validate provider
    if (!['openai', 'anthropic', 'openrouter'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Validate API key format
    if (!validateApiKeyFormat(provider as LLMProvider, apiKey)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key format',
        provider,
        model: model || getDefaultModel(provider as LLMProvider),
        keyValid: false,
      } as LLMSetupResponse);
    }

    // Validate API key by making a test request
    const keyValid = await validateApiKey(provider as LLMProvider, apiKey);

    if (!keyValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key - authentication failed',
        provider,
        model: model || getDefaultModel(provider as LLMProvider),
        keyValid: false,
      } as LLMSetupResponse);
    }

    // For OpenRouter, fetch available models
    let availableModels;
    if (provider === 'openrouter') {
      availableModels = await fetchOpenRouterModels(apiKey);
    }

    // Encrypt the API key
    const encryptedApiKey = encryptApiKey(apiKey);

    // Store in session (in a real app, you'd store in a database)
    // For now, we'll use a simple approach with cookies
    const llmConfig = {
      provider,
      encryptedApiKey,
      model: model || getDefaultModel(provider as LLMProvider),
      baseUrl:
        provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : baseUrl,
      configuredAt: new Date(),
    };

    const response = NextResponse.json({
      success: true,
      provider,
      model: model || getDefaultModel(provider as LLMProvider),
      keyValid: true,
      availableModels,
    } as LLMSetupResponse);

    // Store encrypted config in HTTP-only cookie
    response.cookies.set('llm-config', JSON.stringify(llmConfig), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('LLM setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get current LLM config from cookies
    const llmConfigCookie = request.cookies.get('llm-config');

    if (!llmConfigCookie) {
      return NextResponse.json({ configured: false });
    }

    try {
      const llmConfig = JSON.parse(llmConfigCookie.value);
      return NextResponse.json({
        configured: true,
        provider: llmConfig.provider,
        model: llmConfig.model,
        configuredAt: llmConfig.configuredAt,
      });
    } catch {
      // Invalid config, return not configured
      return NextResponse.json({ configured: false });
    }
  } catch (error) {
    console.error('Get LLM config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
