import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { LLMProvider, PROVIDER_CONFIGS } from '@/types/llm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { provider, model } = body;

    // Validate provider
    if (!['openai', 'anthropic', 'openrouter'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider' },
        { status: 400 }
      );
    }

    // Validate model for the provider
    const providerConfig = PROVIDER_CONFIGS[provider as LLMProvider];
    if (provider !== 'openrouter' && !providerConfig.models.includes(model)) {
      return NextResponse.json(
        { error: 'Invalid model for provider' },
        { status: 400 }
      );
    }

    // Get current LLM config from cookies
    const llmConfigCookie = request.cookies.get('llm-config');
    
    if (!llmConfigCookie) {
      return NextResponse.json(
        { error: 'No LLM configuration found. Please set up your API keys first.' },
        { status: 400 }
      );
    }

    let currentConfig;
    try {
      currentConfig = JSON.parse(llmConfigCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid configuration found. Please reconfigure your API keys.' },
        { status: 400 }
      );
    }

    // Update the configuration with new provider and model
    const updatedConfig = {
      ...currentConfig,
      provider,
      model,
      baseUrl: provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : currentConfig.baseUrl,
      configuredAt: new Date(),
    };

    const response = NextResponse.json({
      success: true,
      provider,
      model,
      message: 'Provider and model updated successfully',
    });

    // Update the cookie with new configuration
    response.cookies.set('llm-config', JSON.stringify(updatedConfig), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (error) {
    console.error('LLM switch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}