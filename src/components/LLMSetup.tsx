'use client';

import { useState, useEffect, useCallback } from 'react';
import { LLMProvider, PROVIDER_CONFIGS, OpenRouterModel } from '@/types/llm';

interface LLMSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export function LLMSetup({ onComplete, onCancel }: LLMSetupProps) {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'openai',
    apiKey: '',
    model: PROVIDER_CONFIGS.openai.defaultModel,
  });
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [error, setError] = useState('');

  const fetchOpenRouterModels = useCallback(async () => {
    if (!config.apiKey) return;
    
    setIsLoadingModels(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
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
      setIsLoadingModels(false);
    }
  }, [config.apiKey]);

  // Fetch OpenRouter models when API key is provided
  useEffect(() => {
    if (config.provider === 'openrouter' && config.apiKey && config.apiKey.length > 10) {
      fetchOpenRouterModels();
    }
  }, [config.provider, config.apiKey, fetchOpenRouterModels]);

  const handleProviderChange = (provider: LLMProvider) => {
    setConfig({
      provider,
      apiKey: '',
      model: PROVIDER_CONFIGS[provider].defaultModel,
      baseUrl: provider === 'openrouter' ? PROVIDER_CONFIGS.openrouter.baseUrl : undefined,
    });
    setOpenRouterModels([]);
    setError('');
  };

  const validateAndSave = async () => {
    if (!config.apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/llm-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.success) {
        onComplete();
      } else {
        setError(result.error || 'Configuration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const currentProvider = PROVIDER_CONFIGS[config.provider];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Setup AI Provider</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose your AI provider
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(PROVIDER_CONFIGS) as LLMProvider[]).map((provider) => {
                const info = PROVIDER_CONFIGS[provider];
                return (
                  <button
                    key={provider}
                    onClick={() => handleProviderChange(provider)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      config.provider === provider
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{info.name}</div>
                    <div className="text-sm text-gray-600">
                      {provider === 'openai' && 'Most popular and reliable AI provider'}
                      {provider === 'anthropic' && 'Advanced reasoning and safety-focused AI'}
                      {provider === 'openrouter' && 'Access to 100+ models at competitive prices'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {currentProvider.name} API Key
              </label>
              <a
                href={
                  config.provider === 'openai' ? 'https://platform.openai.com/signup' :
                  config.provider === 'anthropic' ? 'https://console.anthropic.com/' :
                  'https://openrouter.ai/'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Get API Key
              </a>
            </div>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            {config.provider === 'openrouter' && openRouterModels.length > 0 ? (
              <select
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {openRouterModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - ${model.pricing.prompt}/1K tokens
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentProvider.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
            {config.provider === 'openrouter' && isLoadingModels && (
              <p className="mt-1 text-sm text-gray-600">Loading available models...</p>
            )}
          </div>

          {/* OpenRouter Base URL */}
          {config.provider === 'openrouter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndSave}
              disabled={!config.apiKey.trim() || isValidating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validating...
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Your API key is stored securely</p>
              <p>We encrypt and store your API key securely. It&apos;s never sent to our servers in plain text.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}