import { useEffect, useRef, useState } from 'react';

interface QueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  enabled?: boolean;
}

interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

// Simple query cache for optimization
const queryCache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  staleTime = 5 * 60 * 1000, // 5 minutes default
  cacheTime = 10 * 60 * 1000, // 10 minutes default
  refetchOnWindowFocus = true,
  retry = 3,
  enabled = true,
}: QueryOptions<T>): QueryResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const retryCount = useRef(0);
  const cacheKey = queryKey.join('-');

  const fetchData = async (silent = false) => {
    if (!enabled) return;

    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.staleTime) {
      setData(cached.data);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }
    setIsFetching(true);
    setIsError(false);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      
      // Cache the result
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        staleTime,
      });
      
      retryCount.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (retryCount.current < retry) {
        retryCount.current++;
        // Exponential backoff
        setTimeout(() => fetchData(silent), Math.pow(2, retryCount.current) * 1000);
        return;
      }
      
      setIsError(true);
      setError(error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const refetch = () => {
    retryCount.current = 0;
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [cacheKey, enabled]);

  // Clean up old cache entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, entry] of queryCache.entries()) {
        if (now - entry.timestamp > cacheTime) {
          queryCache.delete(key);
        }
      }
    };

    const interval = setInterval(cleanup, cacheTime);
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  };
}

// Prefetch utility
export const prefetchQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  staleTime = 5 * 60 * 1000
) => {
  const cacheKey = queryKey.join('-');
  const cached = queryCache.get(cacheKey);
  
  if (!cached || Date.now() - cached.timestamp > cached.staleTime) {
    queryFn().then(data => {
      queryCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        staleTime,
      });
    }).catch(console.error);
  }
};

// Query invalidation
export const invalidateQuery = (queryKey: string[]) => {
  const cacheKey = queryKey.join('-');
  queryCache.delete(cacheKey);
};

// Clear all cache
export const clearQueryCache = () => {
  queryCache.clear();
};
