'use client';

import { useState } from 'react';

import { isValidGitHubUrl } from '@/utils/githubUtils';

interface RepositoryInputProps {
  onRepositorySubmit: (url: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function RepositoryInput({
  onRepositorySubmit,
  isLoading = false,
  error,
}: RepositoryInputProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setValidationError('Please enter a repository URL');
      return;
    }

    if (!isValidGitHubUrl(url.trim())) {
      setValidationError('Please enter a valid GitHub repository URL');
      return;
    }

    setValidationError('');
    onRepositorySubmit(url.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const displayError = error || validationError;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="repository-url"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            GitHub Repository URL
          </label>
          <div className="flex space-x-3">
            <input
              id="repository-url"
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://github.com/owner/repository"
              disabled={isLoading}
              className={`flex-1 px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                displayError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-600 focus:ring-blue-500'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>Explore</span>
                </>
              )}
            </button>
          </div>
        </div>

        {displayError && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{displayError}</span>
          </div>
        )}

        <div className="text-sm text-gray-400">
          <p className="mb-2">Supported URL formats:</p>
          <ul className="space-y-1 text-xs">
            <li>• https://github.com/owner/repository</li>
            <li>• https://github.com/owner/repository.git</li>
            <li>• git@github.com:owner/repository.git</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
