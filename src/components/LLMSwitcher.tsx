'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LLMProvider, PROVIDER_CONFIGS, OpenRouterModel } from '@/types/llm';

interface LLMSwitcherProps {
  onProviderChange?: (provider: LLMProvider, model: string) => void;
}

interface CurrentConfig {
  provider: LLMProvider;
  model: string;
  configured: boolean;
}

export function LLMSwitcher({ onProviderChange }: LLMSwitcherProps) {
  const [currentConfig, setCurrentConfig] = useState<CurrentConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('openai');
  const [selectedModel, setSelectedModel] = useState('');
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch current configuration
  const fetchCurrentConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/llm-setup');
      const data = await response.json();
      if (data.configured) {
        setCurrentConfig({
          provider: data.provider,
          model: data.model,
          configured: true,
        });
        setSelectedProvider(data.provider);
        setSelectedModel(data.model);
      }
    } catch (error) {
      console.error('Failed to fetch current config:', error);
    }
  }, []);

  // Fetch OpenRouter models when needed
  const fetchOpenRouterModels = useCallback(async () => {
    if (selectedProvider !== 'openrouter') return;
    
    setIsLoadingModels(true);
    try {
      // We need to get the API key from the current config to fetch models
      // For now, we'll use a basic set of popular models
      const popularModels: OpenRouterModel[] = [
        {
          id: 'openai/gpt-4',
          name: 'GPT-4',
          description: 'OpenAI GPT-4',
          pricing: { prompt: 0.03, completion: 0.06 },
          context_length: 8192,
          architecture: { modality: 'text', tokenizer: 'cl100k_base' }
        },
        {
          id: 'openai/gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'OpenAI GPT-3.5 Turbo',
          pricing: { prompt: 0.001, completion: 0.002 },
          context_length: 4096,
          architecture: { modality: 'text', tokenizer: 'cl100k_base' }
        },
        {
          id: 'anthropic/claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Anthropic Claude 3 Sonnet',
          pricing: { prompt: 0.003, completion: 0.015 },
          context_length: 200000,
          architecture: { modality: 'text', tokenizer: 'claude' }
        },
        {
          id: 'meta-llama/llama-2-70b-chat',
          name: 'Llama 2 70B Chat',
          description: 'Meta Llama 2 70B Chat',
          pricing: { prompt: 0.0007, completion: 0.0009 },
          context_length: 4096,
          architecture: { modality: 'text', tokenizer: 'llama' }
        }
      ];
      setOpenRouterModels(popularModels);
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  }, [selectedProvider]);

  useEffect(() => {
    fetchCurrentConfig();
  }, [fetchCurrentConfig]);

  useEffect(() => {
    if (selectedProvider === 'openrouter') {
      fetchOpenRouterModels();
    }
  }, [selectedProvider, fetchOpenRouterModels]);

  const handleProviderChange = (provider: LLMProvider) => {
    setSelectedProvider(provider);
    const defaultModel = PROVIDER_CONFIGS[provider].defaultModel;
    setSelectedModel(defaultModel);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleSaveChanges = async () => {
    if (!selectedProvider || !selectedModel) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/llm-setup/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (response.ok) {
        setCurrentConfig({
          provider: selectedProvider,
          model: selectedModel,
          configured: true,
        });
        setIsOpen(false);
        onProviderChange?.(selectedProvider, selectedModel);
      } else {
        console.error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!currentConfig?.configured) {
    return null;
  }

  const getAvailableModels = () => {
    if (selectedProvider === 'openrouter' && openRouterModels.length > 0) {
      return openRouterModels;
    }
    return PROVIDER_CONFIGS[selectedProvider].models.map(model => ({
      id: model,
      name: model,
      description: model,
      pricing: { prompt: 0, completion: 0 },
      context_length: 0,
      architecture: { modality: 'text', tokenizer: '' }
    }));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Config Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-medium">{PROVIDER_CONFIGS[currentConfig.provider].name}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-300 truncate max-w-32">{currentConfig.model}</span>
        </div>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <h3 className="text-white font-medium mb-4">Switch AI Provider & Model</h3>
            
            {/* Provider Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Provider
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoadingModels}
              >
                {getAvailableModels().map((model) => (
                  <option key={model.id} value={model.id}>
                    {selectedProvider === 'openrouter' && model.pricing.prompt > 0
                      ? `${model.name} - $${model.pricing.prompt}/1K tokens`
                      : model.name
                    }
                  </option>
                ))}
              </select>
              {isLoadingModels && (
                <p className="mt-1 text-sm text-gray-400">Loading models...</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating || (selectedProvider === currentConfig.provider && selectedModel === currentConfig.model)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-3 rounded-md text-sm transition-colors flex items-center justify-center"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Switch'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}