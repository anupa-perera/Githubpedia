'use client';

import { Repository } from '@/types/github';

interface RepositoryInfoProps {
  repository: Repository & {
    stargazers_count?: number;
    forks_count?: number;
    open_issues_count?: number;
    default_branch?: string;
    topics?: string[];
  };
}

export function RepositoryInfo({ repository }: RepositoryInfoProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="flex items-center justify-between py-2">
      {/* Repository Header - Compact */}
      <div className="flex items-center space-x-3">
        <img
          src={repository.owner.avatar_url}
          alt={repository.owner.login}
          className="w-6 h-6 rounded-full"
        />
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            <a
              href={repository.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              {repository.full_name}
            </a>
          </h2>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="flex items-center space-x-4 text-xs text-gray-600">
        {repository.stargazers_count !== undefined && (
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{formatNumber(repository.stargazers_count)}</span>
          </div>
        )}

        {repository.forks_count !== undefined && (
          <div className="flex items-center space-x-1">
            <svg
              className="w-3 h-3 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 7l3.707-3.707a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{formatNumber(repository.forks_count)}</span>
          </div>
        )}

        {repository.language && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{repository.language}</span>
          </div>
        )}
      </div>
    </div>
  );
}
