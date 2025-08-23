'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  type = 'error' 
}: ErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning':
        return 'border-yellow-700';
      case 'info':
        return 'border-blue-700';
      default:
        return 'border-red-700';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-900';
      case 'info':
        return 'bg-blue-900';
      default:
        return 'bg-red-900';
    }
  };

  return (
    <div className={`${getBackgroundColor()} border ${getBorderColor()} rounded-md p-4 mb-4`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        <div className="flex-1">
          <div className="text-sm text-white whitespace-pre-wrap">
            {error}
          </div>
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex space-x-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-gray-400 hover:text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}