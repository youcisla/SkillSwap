import { useEffect, useRef, useState } from 'react';

interface QueryOptions<T> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  enabled?: boolean;
  refetchInterval?: number;
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

// Overloaded function signatures to support both calling patterns
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: Partial<Omit<QueryOptions<T>, 'queryKey' | 'queryFn'>>
): QueryResult<T>;
export function useOptimizedQuery<T>(options: QueryOptions<T>): QueryResult<T>;
export function useOptimizedQuery<T>(
  queryKeyOrOptions: string[] | QueryOptions<T>,
  queryFn?: () => Promise<T>,
  options?: Partial<Omit<QueryOptions<T>, 'queryKey' | 'queryFn'>>
): QueryResult<T> {
  // Determine the calling pattern and extract parameters
  let queryKey: string[];
  let actualQueryFn: () => Promise<T>;
  let actualOptions: Partial<QueryOptions<T>>;

  if (Array.isArray(queryKeyOrOptions)) {
    // Called with positional parameters: useOptimizedQuery(['key'], fn, options)
    queryKey = queryKeyOrOptions;
    actualQueryFn = queryFn!;
    actualOptions = options || {};
  } else {
    // Called with options object: useOptimizedQuery({ queryKey: ['key'], queryFn: fn, ... })
    const optionsObj = queryKeyOrOptions as QueryOptions<T>;
    queryKey = optionsObj.queryKey;
    actualQueryFn = optionsObj.queryFn;
    actualOptions = optionsObj;
  }

  // Extract final options with defaults
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    refetchOnWindowFocus = true,
    retry = 3,
    enabled = true,
    refetchInterval,
  } = actualOptions;

  // Validate queryKey after extraction
  if (!queryKey || !Array.isArray(queryKey) || queryKey.length === 0) {
    console.warn('useOptimizedQuery: Invalid queryKey provided', queryKey);
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Invalid queryKey provided'),
      refetch: () => {},
      isFetching: false,
    };
  }

  // Validate that queryFn is provided
  if (!actualQueryFn || typeof actualQueryFn !== 'function') {
    console.warn('useOptimizedQuery: Invalid queryFn provided', actualQueryFn);
    return {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Invalid queryFn provided'),
      refetch: () => {},
      isFetching: false,
    };
  }

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
      const result = await actualQueryFn();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [cacheTime]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true); // Silent refetch
    }, refetchInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchInterval, enabled, cacheKey]);

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
  if (!queryKey || !Array.isArray(queryKey)) {
    console.warn('prefetchQuery: Invalid queryKey provided', queryKey);
    return;
  }
  
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
  if (!queryKey || !Array.isArray(queryKey)) {
    console.warn('invalidateQuery: Invalid queryKey provided', queryKey);
    return;
  }
  
  const cacheKey = queryKey.join('-');
  queryCache.delete(cacheKey);
};

// Clear all cache
export const clearQueryCache = () => {
  queryCache.clear();
};
