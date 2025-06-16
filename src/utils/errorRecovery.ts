import { useState } from 'react';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export const useErrorRecovery = <T>() => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const executeWithRetry = async (
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      onRetry,
      shouldRetry = () => true,
    } = options;

    let attempt = 0;
    let delay = initialDelay;

    while (attempt <= maxRetries) {
      try {
        setRetryCount(0);
        setLastError(null);
        
        const result = await operation();
        
        // Success - reset state
        setIsRetrying(false);
        setRetryCount(0);
        setLastError(null);
        
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);

        if (attempt === maxRetries || !shouldRetry(err)) {
          setIsRetrying(false);
          throw err;
        }

        attempt++;
        onRetry?.(attempt, err);

        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, maxDelay)));
        delay *= backoffFactor;
      }
    }

    throw lastError;
  };

  const reset = () => {
    setIsRetrying(false);
    setRetryCount(0);
    setLastError(null);
  };

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError,
    reset,
  };
};

// Enhanced error boundary hook
export const useErrorHandler = () => {
  const [errors, setErrors] = useState<Array<{ id: string; error: Error; timestamp: number }>>([]);

  const addError = (error: Error) => {
    const errorEntry = {
      id: Date.now().toString(),
      error,
      timestamp: Date.now(),
    };
    
    setErrors(prev => [...prev, errorEntry]);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e.id !== errorEntry.id));
    }, 10000);
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return {
    errors,
    addError,
    removeError,
    clearErrors,
  };
};

// Network error detector
export const isNetworkError = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const networkKeywords = [
    'network',
    'timeout',
    'fetch',
    'connection',
    'internet',
    'offline',
    'unreachable',
    'abort',
  ];
  
  return networkKeywords.some(keyword => errorMessage.includes(keyword));
};

// Categorize errors for better handling
export const categorizeError = (error: any) => {
  if (isNetworkError(error)) {
    return 'network';
  }
  
  if (error?.status) {
    if (error.status >= 400 && error.status < 500) {
      return 'client';
    }
    if (error.status >= 500) {
      return 'server';
    }
  }
  
  if (error?.name === 'ValidationError') {
    return 'validation';
  }
  
  if (error?.name === 'AuthenticationError' || error?.status === 401) {
    return 'auth';
  }
  
  return 'unknown';
};

// Error reporting utility
export const reportError = (error: Error, context?: any) => {
  // Only report in development
  if (__DEV__) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location?.href,
    };
    
    // In production, send to error tracking service
    // Example: Sentry.captureException(error, { extra: errorReport });
  }
};

// Custom error classes
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
