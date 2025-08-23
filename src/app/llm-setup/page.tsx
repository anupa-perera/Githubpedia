'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LLMProvider, PROVIDER_CONFIGS, OpenRouterModel } from '@/types/llm';

export default function LLMSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchOpenRouterModels = useCallback(async () => {
    if (!apiKey) return;
    
    setIsValidatingKey(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOpenRouterModels(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
    } finally {
      setIsValidatingKey(false);
    }
  }, [apiKey]);

  // Set default model when provider changes
  useEffect(() => {
    const defaultModel = PROVIDER_CONFIGS[selectedProvider].defaultModel;
    setSelectedModel(defaultModel);
    setOpenRouterModels([]);
    setError('');
  }, [selectedProvider]);

  // Fetch OpenRouter models when API key is provided
  useEffect(() => {
    if (selectedProvider === 'openrouter' && apiKey && apiKey.length > 10) {
      fetchOpenRouterModels();
    }
  }, [selectedProvider, apiKey, fetchOpenRouterModels]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/llm-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
          model: selectedModel,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.error || 'Configuration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKeyFormat = (provider: LLMProvider, key: string): boolean => {
    const config = PROVIDER_CONFIGS[provider];
    if (!config.apiKeyPattern) return true;
    return config.apiKeyPattern.test(key);
  };

  const isApiKeyFormatValid = apiKey ? validateApiKeyFormat(selectedProvider, apiKey) : true;

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LLM Configuration</h1>
          <p className="mt-2 text-gray-600">
            Configure your AI provider to start querying repositories
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {success && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              Configuration saved successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${PROVIDER_CONFIGS[selectedProvider].name} API key`}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                  !isApiKeyFormatValid ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {!isApiKeyFormatValid && (
                <p className="mt-1 text-sm text-red-600">
                  Invalid API key format for {PROVIDER_CONFIGS[selectedProvider].name}
                </p>
              )}
              {selectedProvider === 'openrouter' && (
                <p className="mt-1 text-sm text-gray-500">
                  Get your API key from{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenRouter
                  </a>
                </p>
              )}
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              {selectedProvider === 'openrouter' && openRouterModels.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  {openRouterModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - ${model.pricing.prompt}/1K tokens
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  {PROVIDER_CONFIGS[selectedProvider].models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              )}
              {selectedProvider === 'openrouter' && isValidatingKey && (
                <p className="mt-1 text-sm text-gray-500">Loading available models...</p>
              )}
            </div>

            {/* Provider Information */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                About {PROVIDER_CONFIGS[selectedProvider].name}
              </h3>
              {selectedProvider === 'openai' && (
                <p className="text-sm text-gray-600">
                  OpenAI provides GPT models. Get your API key from the{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                  .
                </p>
              )}
              {selectedProvider === 'anthropic' && (
                <p className="text-sm text-gray-600">
                  Anthropic provides Claude models. Get your API key from the{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Anthropic Console
                  </a>
                  .
                </p>
              )}
              {selectedProvider === 'openrouter' && (
                <p className="text-sm text-gray-600">
                  OpenRouter provides access to 100+ AI models with competitive pricing.
                  Create an account at{' '}
                  <a
                    href="https://openrouter.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenRouter
                  </a>
                  .
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !apiKey || !isApiKeyFormatValid}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Configuring...' : 'Save Configuration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}